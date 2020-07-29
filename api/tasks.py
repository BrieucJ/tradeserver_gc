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
from .models import Stock, Position, Portfolio, PriceHistory, SMAModel, SMABacktest, SMAPosition, SellOrder, BuyOrder
from re import sub
from decimal import Decimal
import pandas as pd


@shared_task
def create_portfolio(portfolio, user_id, positions, pending_orders, trade_history):
    print('create_portfolio')
    user = User.objects.get(id=user_id)
    
    #portfolio
    print('creating portfolio')
    user_portfolio = Portfolio(user=user, portfolio_type=portfolio['portfolio_type'], currency=portfolio['currency'], cash=portfolio['cash'], total_invested_value=portfolio['total_invested_value'],
                                initial_balance=float(portfolio['total_invested_value'])+float(portfolio['cash']), created_at=datetime.datetime.now(tz=timezone.utc), updated_at=datetime.datetime.now(tz=timezone.utc))
    user_portfolio.save()

    #positions
    print('creating current positions')
    #print(positions)
    for position in positions:
        if len(Stock.objects.filter(symbol=position['ticker'])) != 0:
            stock = Stock.objects.filter(symbol=position['ticker']).first()
        else:
            stock = None
        pos = Position(stock=stock, portfolio=user_portfolio, open_date=position['open_date'], open_rate=position['open_rate'], num_of_shares=position['num_of_shares'], total_investment=position['total_investment'], current_rate=position['current_rate'], stop_loss_rate=position['stop_loss_rate'], take_profit_rate=position['take_profit_rate'])
        pos.save()

    #trade history
    print('creating old positions')
    for th in trade_history:
        if len(Stock.objects.filter(symbol=th['ticker'])) != 0:
            stock = Stock.objects.filter(symbol=th['ticker']).first()
        else:
            stock = None
        
        pos = Position(stock=stock, portfolio=user_portfolio, open_date=th['open_date'], open_rate=th['open_rate'], num_of_shares=th['num_of_shares'], total_investment=th['total_investment'], close_date=th['close_date'], close_rate=th['close_rate'])
        pos.save()

    #orders
    print('creating orders')
    for pending_order in pending_orders:
        print(pending_order)
        if len(Stock.objects.filter(symbol=pending_order['ticker'])) != 0:
            stock = Stock.objects.filter(symbol=pending_order['ticker']).first()
        else:
            stock = None
        
        if pending_order['order_type'] == 1:
            bo = BuyOrder(user=user, stock=stock, portfolio=user_portfolio, num_of_shares=pending_order['num_of_shares'], order_rate=pending_order['order_rate'], current_rate=pending_order['current_rate'],
                        total_investment=pending_order['total_investment'], stop_loss=pending_order['stop_loss'], take_profit=pending_order['take_profit'], submited_at=pending_order['submited_at'])
            bo.save()
        elif pending_order['order_type'] == 0:
            print('SELL order pending')
            existing_position = user_portfolio.position.filter(close_date__isnull=True, stock=stock)
            if len(existing_position) == 0:
                position = Position(stock=stock, portfolio=user_portfolio, open_rate=pending_order['open_rate'], num_of_shares=pending_order['num_of_shares'], current_rate=pending_order['current_rate'], total_investment=pending_order['total_investment'])
                position.save()
            else:
                position = existing_position.first()
                
            so = SellOrder(user=user, stock=stock, portfolio=user_portfolio, position=position, submited_at=datetime.datetime.now(tz=timezone.utc))
            so.save()
        else:
            print('UNKNOW ORDER TYPE')


@shared_task
def save_portfolio(portfolio, user_id, positions, pending_orders, trade_history):
    print('update_portfolio')
    user = User.objects.get(id=user_id)
    user_portfolio = user.portfolio.get(portfolio_type=portfolio['portfolio_type'])

    #portfolio
    print('updating portfolio')
    user_portfolio.cash=portfolio['cash']
    user_portfolio.total_invested_value=portfolio['total_invested_value']
    if user_portfolio.initial_balance == None:
        user_portfolio.initial_balance = float(portfolio['total_invested_value'])+float(portfolio['cash'])
    user_portfolio.updated_at = datetime.datetime.now(tz=timezone.utc)
    user_portfolio.save()

    #positions
    print('updating positions')
    for position in positions:
        if len(Stock.objects.filter(symbol=position['ticker'])) != 0:
            stock = Stock.objects.filter(symbol=position['ticker']).first()
        else:
            stock = None
        pos = user_portfolio.position.filter(stock=stock, close_date__isnull=True).first()
        if pos:
            pos.current_rate = position['current_rate']
            pos.updated_at = datetime.datetime.now(tz=timezone.utc)
            pos.save()
        else:
            position = Position(stock=stock, portfolio=user_portfolio, open_date=position['open_date'], open_rate=position['open_rate'], num_of_shares=position['num_of_shares'], current_rate=position['current_rate'], total_investment=position['total_investment'], stop_loss_rate=position['stop_loss_rate'], take_profit_rate=position['take_profit_rate'])
            position.save()
            buy_order = user_portfolio.buy_order.filter(stock=stock, executed_at__isnull=True).first()
            if buy_order:
                buy_order.executed_at = position['open_date']
                if buy_order.submited_at == None:
                    buy_order.submited_at = position['open_date']
                buy_order.save()

    #trade history
    print('Updating old positions')
    for th in trade_history:
        if len(Stock.objects.filter(symbol=th['ticker'])) != 0:
            stock = Stock.objects.filter(symbol=th['ticker']).first()
        else:
            stock = None

        old_position = user_portfolio.position.filter(stock=stock, open_date=th['open_date'], open_rate=th['open_rate'], num_of_shares=th['num_of_shares'], total_investment=th['total_investment'], close_date=th['close_date'], close_rate=th['close_rate']).first()
        if not old_position:
            #print('position is not in old positions')
            current_position = user_portfolio.position.filter(stock=stock, close_date__isnull=True).first()
            if current_position:
                #print('position is in portfolio')
                current_position.close_date = th['close_date']
                current_position.close_rate = th['close_rate']
                current_position.updated_at = datetime.datetime.now(tz=timezone.utc)
                current_position.save()
                sell_order = current_position.sell_order.first()
                if sell_order:
                    #print('position sell order update')
                    sell_order.executed_at = th['close_date']
                    if sell_order.submited_at == None:
                        sell_order.submited_at = th['close_date']
                    sell_order.save()
                buy_order = user_portfolio.buy_order.filter(stock=stock, executed_at__isnull=True).first()
                if buy_order:
                    buy_order.executed_at = th['close_date']
                    buy_order.current_rate = th['current_rate']
                    buy_order.submited_at = th['submited_at']
                    buy_order.save()
            else:
                print('unknown position')
                pos = Position(stock=stock, portfolio=user_portfolio, open_date=th['open_date'], open_rate=th['open_rate'], num_of_shares=th['num_of_shares'], total_investment=th['total_investment'], close_date=th['close_date'], close_rate=th['close_rate'])
                pos.save()

    #orders
    print('Updating order')
    for pending_order in pending_orders:
        if len(Stock.objects.filter(symbol=pending_order['ticker'])) != 0:
            stock = Stock.objects.filter(symbol=pending_order['ticker']).first()
        else:
            stock = None
        
        if pending_order['order_type'] == 1:
            #print('BUY ORDER')
            buy_order = user_portfolio.buy_order.filter(stock=stock, executed_at__isnull=True).first()
            if buy_order:
                #print('updating known buy order')
                buy_order.current_rate = pending_order['current_rate']
                buy_order.submited_at = pending_order['submited_at']
                buy_order.save()
        elif pending_order['order_type'] == 0:
            #print('SELL ORDER')
            sell_order = user_portfolio.sell_order.filter(stock=stock, executed_at__isnull=True).first()
            if sell_order:
                print('updating know sell order')
                if sell_order.submited_at == None:
                    sell_order.submited_at = datetime.datetime.now(tz=timezone.utc)
                    sell_order.save()
        else:
            print('UNKNOW ORDER')


@shared_task
def update_orders(user_id, portfolio_type):
    print('update_orders')
    backtests = SMABacktest.objects.all()
    user = User.objects.get(id=user_id)
    portfolio = user.portfolio.filter(portfolio_type=portfolio_type).first()
    last_business_day = datetime.datetime.today() - pd.tseries.offsets.BDay(1)

    if portfolio:
        positions = portfolio.position.all()
        for position in positions:
            stock = position.stock
            print(stock)
            if stock:
                sma_position = stock.sma_position.first()
                if sma_position != None and sma_position.buy == False:
                    print(f'SELLING {stock} POSITION')
                    order = SellOrder(user=user, stock=position.stock, sma_position=sma_position, portfolio=portfolio, position=position)
                    order.save()
        
        #PENDING ORDERS REALLOCATION
        print('PENDING ORDERS REALLOCATION')
        pending_buy_orders = portfolio.buy_order.filter(executed_at__isnull=True)
        pending_sell_orders = portfolio.sell_order.filter(executed_at__isnull=True)
        for order in pending_buy_orders:
            if order.created_at.date() <= (datetime.date.today() - timedelta(days=1)):
                order.canceled_at = datetime.now()
                order.save()
        
        # for order in pending_sell_orders:
        #     if order.created_at.date() <= (datetime.date.today() - timedelta(days=1)):
        #         order.canceled_at = datetime.now()
        #         order.save()

        #INVESTMENTS
        print('PORTFOLIO INVESTMENTS')
        if portfolio.cash != None and portfolio.total_invested_value != None:
            cash = portfolio.cash
            if cash + portfolio.total_invested_value > 10000:
                max_allocation_per_stock = 0.05 * (cash + portfolio.total_invested_value)
            elif cash + portfolio.total_invested_value > 100000:
                max_allocation_per_stock = 0.01 * (cash + portfolio.total_invested_value)
            else:
                max_allocation_per_stock = 0.1 * (cash + portfolio.total_invested_value)
            print(f'CASH: {cash}')
            for b in backtests:
                pending_buy_orders = portfolio.buy_order.filter(executed_at__isnull=True).aggregate(Sum('total_investment'))
                if pending_buy_orders['total_investment__sum'] == None:
                    available_cash = cash
                else:
                    available_cash = cash - pending_buy_orders['total_investment__sum']
                
                sma_position = b.model.sma_position.filter(price_date=last_business_day).first()
                last_price = b.stock.price_history.filter(price_date=last_business_day).first()
                in_portfolio = portfolio.position.filter(stock=b.stock, close_date__isnull=True).count() != 0
                if sma_position and last_price and in_portfolio == False and max_allocation_per_stock < available_cash and sma_position.buy:
                    num_of_shares = int(max_allocation_per_stock/last_price.close)
                    if num_of_shares > 0:
                        print(f'BUYING STOCK: {b.stock} ({num_of_shares}) | CASH: {cash} | max_allocation_per_stock: {max_allocation_per_stock} | available_cash: {available_cash}')
                        stop_loss = last_price.close - b.model.stop_loss * last_price.close
                        take_profit = last_price.close + b.model.take_profit * last_price.close
                        total_cost = num_of_shares * last_price.close
                        order = BuyOrder(user=user, stock=b.stock, sma_position=sma_position, portfolio=portfolio, price_date=sma_position.price_date, num_of_shares=num_of_shares, order_rate=last_price.close, current_rate=last_price.close, total_investment=total_cost, stop_loss=stop_loss, take_profit=take_profit)
                        try:
                            order.save()
                        except IntegrityError as err:
                            print(err)
                            continue

@shared_task
def transmit_orders(user_id, portfolio_type):
    print('transmit_orders')
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
        if len(orders) != 0:
            api = API(user.profile.broker_username, user.profile.broker_password, mode=mode)
            api.transmit_orders(orders=orders)
            update_portfolio.delay(user_id)

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
                if not SMAPosition.objects.filter(stock=stock, sma_backtest=b, model=b.model, price_date=prices.first().price_date).first():
                    sma_engine = SMAEngine(prices, b.model, date=prices.first().price_date, backtest=False)
                    if 'buy' in sma_engine.order.keys():
                        print(f'BUY: {sma_engine.order["buy"]}')
                        s = SMAPosition(stock=stock, sma_backtest=b, model=b.model, buy=sma_engine.order["buy"], price_date=prices.first().price_date)
                        s.save()

@shared_task
def update_portfolio(user_id):
    print('update_portfolio')
    user = User.objects.get(id=user_id)
    demo_portfolio = user.portfolio.filter(portfolio_type=False).first()
    real_portfolio = user.portfolio.filter(portfolio_type=True).first()

    if user.profile.broker_password != None and user.profile.broker_password != None:
        #demo portolio
        if demo_portfolio == None or demo_portfolio.updated_at < datetime.datetime.now(tz=timezone.utc):
            print(f'Updating demo portfolio')
            api = API(user.profile.broker_username, user.profile.broker_password, mode='demo')
            portfolio, positions = api.update_portfolio()
            pending_orders = api.get_pending_order()
            trade_history = api.update_trade_history()
            if demo_portfolio == None:
                create_portfolio.delay(portfolio, user.id, positions, pending_orders, trade_history)
            else:
                save_portfolio.delay(portfolio, user.id, positions, pending_orders, trade_history)
        #real portfolio
        if real_portfolio == None or real_portfolio.updated_at < datetime.datetime.now(tz=timezone.utc):
            print(f'Updating real portfolio')
            api = API(user.profile.broker_username, user.profile.broker_password, mode='real')
            portfolio, positions = api.update_portfolio()
            pending_orders = api.get_pending_order()
            trade_history = api.update_trade_history()
            if real_portfolio == None:
                create_portfolio.delay(portfolio, user.id, positions, pending_orders, trade_history)
            else:
                save_portfolio.delay(portfolio, user.id, positions, pending_orders, trade_history)

#PERIODIC TASKS
@periodic_task(run_every=(crontab(minute=0, hour='*/2')), name="update_price_history", ignore_result=False)
def update_price_history():
    stocks = Stock.objects.filter(valid=True) 
    for s in stocks:
        print(s.symbol)
        if s.price_history.first():
            start_date = s.price_history.first().price_date
        else:
            start_date = datetime.datetime(2000, 1, 1)
        end_date = datetime.datetime.today() - pd.tseries.offsets.BDay(1)
        if start_date < end_date:
            try:
                df = data.DataReader(s.symbol, start=start_date, end=end_date, data_source='yahoo')
            except RemoteDataError as err:
                print(f'#### {s.symbol} - {err} ####')
                continue
            
            for index, row in df.iterrows():
                if len(row) > 0:
                    try:
                        p = PriceHistory(stock=s, price_date=index, open=row['Open'], high=row['High'], low=row['Low'], close=row['Close'], volume=row['Volume'], created_at=end_date)
                        p.full_clean()
                        p.save()
                    except ValidationError as err:
                        continue
    update_sma_positions.delay()

@periodic_task(run_every=(crontab(minute=0, hour=5, day_of_week='1-5')), name="portfolio_rebalancing", ignore_result=False)
def portfolio_rebalancing():
    users = User.objects.all()
    for user in users:
        update_orders.delay(user.id, False)
        update_orders.delay(user.id, True)
        transmit_orders.delay(user.id, False)
        transmit_orders.delay(user.id, True)

@periodic_task(run_every=(crontab(minute=0, hour='*/2')), name="update_portfolios", ignore_result=False)
def update_portfolios():
    users = User.objects.all()
    for user in users:
        update_portfolio.delay(user.id)