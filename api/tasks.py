import datetime
import sys
from datetime import timedelta
from django.db import IntegrityError
from django.utils import timezone
from celery.task.schedules import crontab
from django.core.exceptions import ValidationError
from celery.decorators import periodic_task
from celery import task, shared_task, current_task
from .trade.etoro import API
from .trade.sma_engine import SMAEngine
from django.contrib.auth.models import User
from django.utils.dateparse import parse_date
from pandas_datareader import data
from pandas_datareader._utils import RemoteDataError
from .models import Stock, Position, Portfolio, PriceHistory, SMAModel, SMABacktest, SMAPosition, Order
from re import sub
from decimal import Decimal

@shared_task
def save_portfolio(portfolio, positions, user_id):
    print('save_portfolio')
    user = User.objects.get(id=user_id)
    if portfolio['cash'] == None or portfolio['total_invested_value'] == None:
        cash_value = None
        total_invested_val = None
        currency = '€'
    else:
        cash_value = Decimal(sub(r'[^\d.]', '', str(portfolio['cash'])))
        total_invested_val = Decimal(sub(r'[^\d.]', '', str(portfolio['total_invested_value'])))
        currency = portfolio['cash'][0]
    p = Portfolio(user=user, portfolio_type=portfolio['portfolio_type'], currency=currency, cash=cash_value, total_invested_value=total_invested_val, date=datetime.datetime.now(tz=timezone.utc))
    p.save()
    for position in positions:
        stock = Stock.objects.get(symbol=position['ticker'])
        invest_value = Decimal(sub(r'[^\d.]', '', str(position['invested_value'])))
        investment_date = datetime.datetime.strptime(str(position['invest_date']), "%d/%m/%Y %H:%M").date()
        pos = Position(stock=stock, portfolio=p, invest_date=investment_date, invest_value=invest_value, invest_units=int(float(position['invested_units'])), open_rate=float(position['open_rate']), current_rate=float(position['current_rate']), stop_loss_rate=float(position['stop_loss_rate']), take_profit_rate=float(position['take_profit_rate']))
        pos.save()

@shared_task
def create_orders():
    print('run algo')
    Order.objects.all().delete()
    stocks = Stock.objects.all()
    users = User.objects.all()
    backtests = SMABacktest.objects.all()
    for user in users:
        print(user)
        last_demo_portfolio = user.portfolio.filter(portfolio_type=False).first()
        

        #PORTFOLIO REALLOCATION
        positions = last_demo_portfolio.positions.all()
        for position in positions:
            stock = position.stock
            sma_position = stock.sma_position.first()
            if sma_position == None:
                print(f'SELLING {stock} POSITION')
                print(position.stock.name)
                print(position.invest_units)
                print(position.open_rate)
                order = Order(user=user, stock=position.stock, order_type='SELL', num_of_shares=position.invest_units, order_price=position.current_rate)
            elif sma_position.buy == False:
                print(f'SELLING {stock} POSITION')
        # cash = last_demo_portfolio.cash
        # #INVESTMENTS
        # for b in backtests:
        #     if cash <= 0:
        #         print('BREAKING')
        #         break
        #     else:
        #         position = SMAPosition.objects.filter(stock=b.stock, model=b.model).first()
        #         current_price = b.stock.price_history.first().close
        #         num_of_shares = int((0.1*cash)/current_price)
        #         if position.buy and num_of_shares != 0:
        #             stop_loss = current_price - b.model.stop_loss * current_price
        #             take_profit = current_price + b.model.take_profit * current_price
        #             order = Order(user=user, stock=b.stock, model=b.model, position=position, order_type='BUY', price_date=position.price_date, num_of_shares=num_of_shares, order_price=current_price, stop_loss=stop_loss, take_profit=take_profit)
        #             total_cost = num_of_shares * current_price
        #             try:
        #                 order.save()
        #                 cash -= total_cost
        #                 print(f'Current price: {current_price}')
        #                 print(f'Num of shares: {num_of_shares}')
        #                 print(f'Total cost: {total_cost}')
        #                 print(f'Cash: {cash}')
        #             except IntegrityError as err:
        #                 continue
                
                
                
            
@shared_task
def create_sma_positions():
    print('create_sma_positions')
    stocks = Stock.objects.all()
    for stock in stocks:
        print(stock)
        prices = stock.price_history.all()
        last_sma_position = stock.sma_position.first()
        backtests = stock.backtest.all()
        for b in backtests:
            print(b)
            if last_sma_position == None or prices.first().price_date > last_sma_position.price_date:
                sma_engine = SMAEngine(prices, b.model, date=prices.first().price_date, backtest=False)
            if 'buy' in sma_engine.order.keys():
                print(f'BUY: {sma_engine.order["buy"]}')
                s = SMAPosition(stock=stock, model=b.model, buy=sma_engine.order["buy"], price_date=prices.first().price_date)
                s.save()
            else:
                print(sma_engine.order["error"])
                print(f'DATE ERROR: {date}')


# PERIODIC TASKS
@periodic_task(run_every=(crontab(minute=0, hour='*/1')), name="update_price_history", ignore_result=True)
def update_price_history():
    stocks = Stock.objects.all() 
    for s in stocks:
        print(s.symbol)
        start_date = s.price_history.first().price_date + datetime.timedelta(days=1)
        if start_date < datetime.date.today():
            print(f'start date: {start_date}')
            print(f'end date: {datetime.date.today()}')
            try:
                df = data.DataReader(s.symbol, start=start_date, end=datetime.date.today(), data_source='yahoo')
                print(df.index.size)
            except RemoteDataError as err:
                print(f'#### {s.symbol} - {err} ####')
                continue
            
            for index, row in df.iterrows():
                if len(row) > 0:
                    try:
                        p = PriceHistory(stock=s, price_date=index, open=row['Open'], high=row['High'], low=row['Low'], close=row['Close'], volume=row['Volume'], created_at=datetime.date.today())
                        p.full_clean()
                        p.save()
                        print('saving')
                    except ValidationError as err:
                        print(f'#### {s.symbol} - {err} ####')
                        continue

@periodic_task(run_every=(crontab(minute=0, hour='*/1')), name="update_portfolio_task", ignore_result=True)
def update_portfolio_task():
    users = User.objects.all()
    for user in users:
        if user.profile.broker_password != None and user.profile.broker_password != None:
            #DEMO PORTFOLIO
            demo_portfolio = user.portfolio.filter(portfolio_type=False).first()
            if demo_portfolio == None or demo_portfolio.date.date() < datetime.date.today():
                print('updating demo portfolio')
                portfolio, positions = API(user.profile.broker_username, user.profile.broker_password, mode='demo').update_portfolio()
                save_portfolio.delay(portfolio, positions, user.id)
            
            #REAL PORTFOLIO
            real_portfolio = user.portfolio.filter(portfolio_type=True).first()
            if real_portfolio == None or real_portfolio.date.date() < datetime.date.today():
                print('updating real portfolio')
                portfolio, positions = API(user.profile.broker_username, user.profile.broker_password, mode='real').update_portfolio()
                save_portfolio.delay(portfolio, positions, user.id)