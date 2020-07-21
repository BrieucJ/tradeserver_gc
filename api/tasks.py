import datetime
import sys
from django.db.models import Sum
from itertools import chain
from datetime import timedelta
from django.db import IntegrityError
from django.utils import timezone
from celery.task.schedules import crontab
from django.core.exceptions import ValidationError
from django.db.models import Sum
from celery.decorators import periodic_task
from celery import task, shared_task, current_task
from .trade.etoro import API
from .trade.sma_engine import SMAEngine
from django.contrib.auth.models import User
from django.utils.dateparse import parse_date
from pandas_datareader import data
from pandas_datareader._utils import RemoteDataError
from .models import Stock, Position, Portfolio, PriceHistory, SMAModel, SMABacktest, SMAPosition, SellOrder, BuyOrder, PendingOrder
from re import sub
from decimal import Decimal

@shared_task
def save_portfolio(portfolio, positions, pending_orders, user_id):
    print('save_portfolio')
    user = User.objects.get(id=user_id)
    #PORTFOLIO
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
    #POSITIONS
    for position in positions:
        stock = Stock.objects.get(symbol=position['ticker'])
        invest_value = Decimal(sub(r'[^\d.]', '', str(position['invested_value'])))
        investment_date = datetime.datetime.strptime(str(position['invest_date']), "%d/%m/%Y %H:%M").date()
        pos = Position(stock=stock, portfolio=p, invest_date=investment_date, invest_value=invest_value, invest_units=int(float(position['invested_units'])), open_rate=float(position['open_rate']), current_rate=float(position['current_rate']), stop_loss_rate=float(position['stop_loss_rate']), take_profit_rate=float(position['take_profit_rate']))
        pos.save()
    #PENDING_ORDERS
    for pending_order in pending_orders:
        stock = Stock.objects.filter(symbol=pending_order['ticker'])
        po = PendingOrder(stock=stock, user=user, portfolio=p, total_investment=pending_order['total_investment'], open_rate=pending_order['open_rate'], current_price=pending_order['current_price'],stop_loss=pending_order['stop_loss'],take_profit=pending_order['take_profit'], submited_at=pending_order['submited_at'], )
        po.save()

@shared_task
def update_orders(user_id, portfolio_type):
    print('create_orders')
    current_date = datetime.date.today()
    backtests = SMABacktest.objects.all()
    user = User.objects.get(id=user_id)
    portfolio = user.portfolio.filter(portfolio_type=portfolio_type).first()
    print(portfolio.cash)
    if portfolio != None:
        print('PORTFOLIO EXIST')
        #POSITIONS REALLOCATION
        print("POSITIONS REALLOCATION")
        positions = portfolio.position.all()
        print(len(positions))
        for position in positions:
            stock = position.stock
            sma_position = stock.sma_position.filter(price_date=current_date).first()
            if sma_position != None and sma_position.buy == False:
                print(f'SELLING {stock} POSITION')
                order = SellOrder(user=user, stock=position.stock, sma_position=sma_position, portfolio=portfolio, position=position, num_of_shares=position.invest_units, price_date=sma_position.price_date)
                order.save()
            else:
                print(f'SELLING {stock} POSITION')
                order = SellOrder(user=user, stock=position.stock, portfolio=portfolio, position=position, num_of_shares=position.invest_units, price_date=position.stock.price_history.first().price_date)
                order.save()
        
        #PENDING ORDERS REALLOCATION
        print('PENDING ORDERS REALLOCATION')
        pending_buy_orders = portfolio.buy_order.filter(executed_at=None)
        pending_sell_orders = portfolio.sell_order.filter(executed_at=None)
        print(len(pending_buy_orders))
        print(len(pending_sell_orders))
        for order in pending_buy_orders:
            print(order)
        
        for order in pending_sell_orders:
            print(order)

        # for position in positions:
        #     stock = position.stock
        #     sma_position = stock.sma_position.filter(price_date=current_date).first()
        #     if sma_position != None and sma_position.buy == False:
        #         print(f'SELLING {stock} POSITION')
        #         order = SellOrder(user=user, stock=position.stock, sma_position=sma_position, portfolio=portfolio, position=position, num_of_shares=position.invest_units, price_date=sma_position.price_date)
        #         order.save()
        #     else:
        #         print('No SMA POSITION')
        #         order = SellOrder(user=user, stock=position.stock, portfolio=portfolio, position=position, num_of_shares=position.invest_units, price_date=position.stock.price_history.first().price_date)
        #         order.save()
        

        #INVESTMENTS
        if portfolio.cash != None and portfolio.total_invested_value != None:
            for b in backtests:
                cash = portfolio.cash
                max_allocation_per_stock = 0.1 * (cash + portfolio.total_invested_value)
                pending_buy_orders = portfolio.buy_order.filter(executed_at=None).aggregate(Sum('total_investment'))
                if pending_buy_orders['total_investment__sum'] == None:
                    available_cash = cash
                else:
                    available_cash = cash - pending_buy_orders['total_investment__sum']
                sma_position = b.model.sma_position.first()
                print(f'STOCK: {b.stock} | CASH: {cash} | max_allocation_per_stock: {max_allocation_per_stock} | available_cash: {available_cash} | ')
                current_price_history = b.stock.price_history.first()
                if sma_position != None and current_price_history != None:
                    num_of_shares = int(max_allocation_per_stock/current_price_history.close)
                    if sma_position.buy and num_of_shares != 0 and max_allocation_per_stock < available_cash:
                        stop_loss = current_price_history.close - b.model.stop_loss * current_price_history.close
                        take_profit = current_price_history.close + b.model.take_profit * current_price_history.close
                        total_cost = num_of_shares * current_price_history.close
                        order = BuyOrder(user=user, stock=b.stock, sma_position=sma_position, portfolio=portfolio, price_date=sma_position.price_date, num_of_shares=num_of_shares, order_price=current_price_history.close, total_investment=total_cost, stop_loss=stop_loss, take_profit=take_profit)
                        try:
                            order.save()
                        except IntegrityError as err:
                            print(err)
                            continue
                        else:
                            print(f'BUYING {num_of_shares} shares of {b.stock} for {total_cost}')
                        

@shared_task
def update_sma_positions():
    print('update_sma_positions')
    stocks = Stock.objects.all()
    for stock in stocks:
        prices = stock.price_history.all()
        last_sma_position = stock.sma_position.first()
        backtests = stock.backtest.all()
        if last_sma_position == None or prices.first().price_date > last_sma_position.price_date:
            for b in backtests:
                print(b)
                sma_engine = SMAEngine(prices, b.model, date=prices.first().price_date, backtest=False)
                if 'buy' in sma_engine.order.keys():
                    print(f'BUY: {sma_engine.order["buy"]}')
                    s = SMAPosition(stock=stock, sma_backtest=b ,model=b.model, buy=sma_engine.order["buy"], price_date=prices.first().price_date)
                    s.save()

@shared_task
def transmit_orders(user_id, portfolio_type):
    print('transmit_orders')
    current_date = datetime.date.today()
    user = User.objects.get(id=user_id)
    portfolio = user.portfolio.filter(portfolio_type=portfolio_type).first()
    if portfolio_type:
        mode = 'real'
    else:
        mode = 'demo'
    
    if portfolio != None:
        sell_orders = portfolio.sell_order.filter(submited_at=None)
        buy_orders = portfolio.buy_order.filter(submited_at=None)
        orders = list(chain(sell_orders, buy_orders))
        print(orders)
        if len(orders) != 0:
            pending_orders = API(user.profile.broker_username, user.profile.broker_password, mode=mode).transmit_orders(orders=orders)
            print('PENDING ORDERS')
            print(pending_orders)
    

#PERIODIC TASKS
@periodic_task(run_every=(crontab(minute=30, hour=22, day_of_week='1-5')), name="update_price_history", ignore_result=True)
def update_price_history():
    stocks = Stock.objects.all() 
    for s in stocks:
        print(s.symbol)
        start_date = s.price_history.first().price_date
        end_date = datetime.date.today()
        if start_date < end_date:
            print(f'start date: {start_date}')
            print(f'end date: {end_date}')
            try:
                df = data.DataReader(s.symbol, start=start_date, end=end_date, data_source='yahoo')
                print(df.index.size)
            except RemoteDataError as err:
                print(f'#### {s.symbol} - {err} ####')
                continue
            
            for index, row in df.iterrows():
                print(index)
                if len(row) > 0:
                    try:
                        p = PriceHistory(stock=s, price_date=index, open=row['Open'], high=row['High'], low=row['Low'], close=row['Close'], volume=row['Volume'], created_at=end_date)
                        p.full_clean()
                        p.save()
                        print('saving')
                    except ValidationError as err:
                        print(f'#### {s.symbol} - {err} ####')
                        continue
    update_sma_positions.delay()

@periodic_task(run_every=(crontab(minute=0, hour='*/3', day_of_week='1-5')), name="update_portfolio_task", ignore_result=True)
def update_portfolio_task():
    print('update_portfolio_task')
    users = User.objects.all()
    print(len(users))
    for user in users:
        if user.profile.broker_password != None and user.profile.broker_password != None:
            #DEMO PORTFOLIO
            demo_portfolio = user.portfolio.filter(portfolio_type=False).first()
            if demo_portfolio == None or demo_portfolio.date < datetime.datetime.now(tz=timezone.utc):
                print('updating demo portfolio')
                api = API(user.profile.broker_username, user.profile.broker_password, mode='demo')
                portfolio, positions = api.update_portfolio()
                print(portfolio)
                pending_orders = api.get_pending_order()
                save_portfolio.delay(portfolio, positions, pending_orders, user.id)

            #REAL PORTFOLIO
            real_portfolio = user.portfolio.filter(portfolio_type=True).first()
            if real_portfolio == None or real_portfolio.date < datetime.datetime.now(tz=timezone.utc):
                print('updating real portfolio')
                api = API(user.profile.broker_username, user.profile.broker_password, mode='real')
                portfolio, positions = api.update_portfolio()
                print(portfolio)
                pending_orders = api.get_pending_order()
                save_portfolio.delay(portfolio, positions, pending_orders, user.id)

@periodic_task(run_every=(crontab(minute=0, hour=0, day_of_week='1-5')), name="portfolio_rebalancing", ignore_result=True)
def portfolio_rebalancing():
    users = User.objects.all()
    for user in users:
        update_orders.delay(user.id, False)
        update_orders.delay(user.id, True)
        transmit_orders.delay(user.id, False)
        transmit_orders.delay(user.id, True)