import datetime
import sys
from django.db.models import Sum
from itertools import chain
from datetime import timedelta
from django.db import IntegrityError
from django.utils import timezone
from celery.task.schedules import crontab
from django.core.exceptions import ValidationError
from django.db.models import Sum, Max, Min
from celery.decorators import periodic_task
from celery import task, shared_task, current_task
from .trade.etoro import API
from .trade.sma_engine import SMAEngine
from django.contrib.auth.models import User
from django.utils.dateparse import parse_date
from pandas_datareader import data
from pandas_datareader._utils import RemoteDataError
from .serializers import BuyOrderCreateSerializer
from .models import Stock, Position, Portfolio, PriceHistory, SMAModel, SMABacktest, SMAPosition, SellOrder, BuyOrder, PortfolioHistory
from re import sub
from decimal import Decimal
import pandas as pd
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import gc


@shared_task
def create_portfolio(portfolio, user_id, positions, pending_orders, trade_history):
    print('create_portfolio')
    user = User.objects.get(id=user_id)
    
    #portfolio
    # print('creating portfolio')
    user_portfolio = Portfolio(user=user, portfolio_type=portfolio['portfolio_type'], currency=portfolio['currency'], created_at=datetime.datetime.now(tz=timezone.utc), updated_at=datetime.datetime.now(tz=timezone.utc))
    user_portfolio.save()
    portfolio_history = PortfolioHistory(portfolio=user_portfolio, cash=portfolio['cash'], total_invested_value=portfolio['total_invested_value'], created_at=datetime.datetime.now(tz=timezone.utc))
    portfolio_history.save()

    #positions
    #print('creating current positions')
    #print(positions)
    for position in positions:
        if len(Stock.objects.filter(symbol=position['ticker'])) != 0:
            stock = Stock.objects.filter(symbol=position['ticker']).first()
        else:
            stock = None
        pos = Position(stock=stock, portfolio=user_portfolio, open_date=position['open_date'], open_rate=position['open_rate'], num_of_shares=position['num_of_shares'], total_investment=position['total_investment'], current_rate=position['current_rate'], stop_loss_rate=position['stop_loss_rate'], take_profit_rate=position['take_profit_rate'])
        pos.save()
        buy_order = user_portfolio.buy_order.filter(stock=pos.stock, executed_at__isnull=True).first()
        if buy_order:
            print('existing buy order')
            buy_order.position = pos
            buy_order.executed_at = position['open_date']
            if buy_order.submited_at == None:
                buy_order.submited_at = position['open_date']
            buy_order.save()
        else:
            print('BUY ORDER unknow')
            if pos.sell_order.first() == None:
                print(f'CREATING SELL ORDER {pos.stock}')
                order = SellOrder(user=user, stock=pos.stock, portfolio=user_portfolio, position=pos)
                order.save()

    #trade history
    # print('creating old positions')
    for th in trade_history:
        if len(Stock.objects.filter(symbol=th['ticker'])) != 0:
            stock = Stock.objects.filter(symbol=th['ticker']).first()
        else:
            stock = None
        
        pos = Position(stock=stock, portfolio=user_portfolio, open_date=th['open_date'], open_rate=th['open_rate'], num_of_shares=th['num_of_shares'], total_investment=th['total_investment'], close_date=th['close_date'], close_rate=th['close_rate'])
        pos.save()

    #orders
    # print('creating orders')
    for pending_order in pending_orders:
        if len(Stock.objects.filter(symbol=pending_order['ticker'])) != 0:
            stock = Stock.objects.filter(symbol=pending_order['ticker']).first()
        else:
            stock = None
        
        if pending_order['order_type'] == 1:
            bo = BuyOrder(user=user, stock=stock, portfolio=user_portfolio, num_of_shares=pending_order['num_of_shares'], order_rate=pending_order['order_rate'], current_rate=pending_order['current_rate'],
                        total_investment=pending_order['total_investment'], stop_loss=pending_order['stop_loss'], take_profit=pending_order['take_profit'], created_at=datetime.datetime.now(tz=timezone.utc), submited_at=pending_order['submited_at'])
            bo.save()
        elif pending_order['order_type'] == 0:
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
    print('save_portfolio')
    user = User.objects.get(id=user_id)
    user_portfolio = user.portfolio.get(portfolio_type=portfolio['portfolio_type'])

    #portfolio
    print('saving portfolio')
    user_portfolio.updated_at = datetime.datetime.now(tz=timezone.utc)
    user_portfolio.save()

    portfolio_history = PortfolioHistory(portfolio=user_portfolio, cash=portfolio['cash'], total_invested_value=portfolio['total_invested_value'], created_at=datetime.datetime.now(tz=timezone.utc))
    portfolio_history.save()

    #positions
    print('saving positions')
    for position in positions:
        print(position)
        if len(Stock.objects.filter(symbol=position['ticker'])) != 0:
            stock = Stock.objects.filter(symbol=position['ticker']).first()
        else:
            stock = None
        pos = user_portfolio.position.filter(stock=stock, close_date__isnull=True).first()
        if pos:
            print(f'updating {position}')
            pos.current_rate = position['current_rate']
            pos.updated_at = datetime.datetime.now(tz=timezone.utc)
            pos.save()
        else:
            print(f'creating new position {position}')
            new_pos = Position(stock=stock, portfolio=user_portfolio, open_date=position['open_date'], open_rate=position['open_rate'], num_of_shares=position['num_of_shares'], current_rate=position['current_rate'], total_investment=position['total_investment'], stop_loss_rate=position['stop_loss_rate'], take_profit_rate=position['take_profit_rate'])
            new_pos.save()
            buy_order = user_portfolio.buy_order.filter(stock=stock, executed_at__isnull=True).first()
            if buy_order:
                print('existing buy order')
                buy_order.position = new_pos
                buy_order.executed_at = position['open_date']
                if buy_order.submited_at == None:
                    buy_order.submited_at = position['open_date']
                buy_order.save()

    #trade history
    print('saving old positions')
    for th in trade_history:
        if len(Stock.objects.filter(symbol=th['ticker'])) != 0:
            stock = Stock.objects.filter(symbol=th['ticker']).first()
        else:
            stock = None

        old_position = user_portfolio.position.filter(stock=stock, open_date=th['open_date'], open_rate=th['open_rate'], num_of_shares=th['num_of_shares'], total_investment=th['total_investment'], close_date=th['close_date'], close_rate=th['close_rate']).first()
        if not old_position:
            print('position is not in old positions')
            current_position = user_portfolio.position.filter(stock=stock, close_date__isnull=True).first()
            if current_position:
                print('position is in portfolio')
                current_position.close_date = th['close_date']
                current_position.close_rate = th['close_rate']
                current_position.updated_at = datetime.datetime.now(tz=timezone.utc)
                current_position.save()
            else:
                print('unknown position')
                pos = Position(stock=stock, portfolio=user_portfolio, open_date=th['open_date'], open_rate=th['open_rate'], num_of_shares=th['num_of_shares'], total_investment=th['total_investment'], close_date=th['close_date'], close_rate=th['close_rate'])
                pos.save()
        else:
            sell_order = SellOrder.objects.filter(stock=stock, portfolio=user_portfolio, executed_at__isnull=True).first()
            print(sell_order)
            if sell_order:
                if sell_order.executed_at == None:
                    sell_order.submited_at = th['close_date']
                    sell_order.executed_at = th['close_date']
                    sell_order.save()
    #orders
    print('Canceled orders')
    pending_order_stocks = [Stock.objects.filter(symbol=po['ticker']).first() for po in pending_orders]
    canceled_orders = user_portfolio.buy_order.filter(canceled_at__isnull=False, terminated_at__isnull=True)
    for co in canceled_orders:
        if co.stock not in pending_order_stocks:
            print(f'Buy Order has been canceled {co.stock}')
            co.terminated_at = datetime.datetime.now(tz=timezone.utc)
            co.save()

    print('Updating order')
    print(pending_orders)
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
            else:
                print('###### UNKNOWN BUY ORDER ########')
                print(pending_order)
                bo = BuyOrder(user=user, stock=stock, portfolio=user_portfolio, num_of_shares=pending_order['num_of_shares'], order_rate=pending_order['order_rate'], current_rate=pending_order['current_rate'],
                    total_investment=pending_order['total_investment'], stop_loss=pending_order['stop_loss'], take_profit=pending_order['take_profit'], submited_at=pending_order['submited_at'])
                bo.save()
        elif pending_order['order_type'] == 0:
            #print('SELL ORDER')
            sell_order = user_portfolio.sell_order.filter(stock=stock, submited_at__isnull=True).first()
            if sell_order:
                # print('updating know sell order')
                if sell_order.submited_at == None:
                    sell_order.submited_at = datetime.datetime.now(tz=timezone.utc)
                    sell_order.save()
        else:
            print('UNKNOW ORDER')


@shared_task
def update_orders_task(user_id):
    print('update_orders_task')
    backtests = SMABacktest.objects.all()
    user = User.objects.get(id=user_id)
    portfolios = user.portfolio.all()
    last_business_day = datetime.datetime.today() - pd.tseries.offsets.BDay(1)

    for portfolio in portfolios:
        portfolio_history = portfolio.portfolio_history.first()
        positions = portfolio.position.filter(close_date__isnull=True)
        print(len(positions))
        print(f'Portfolio type: {portfolio.portfolio_type}')
        for position in positions:
            print(position.stock.name)
            bo = position.buy_order.first()
            pending_bo = portfolio.buy_order.filter(stock=position.stock, submited_at__isnull=True).first()
            if bo == None and pending_bo == None:
                print('NO BUY ORDER or penging buy order')
                if position.sell_order.first() == None:
                    print(f'CREATING SELL ORDER {position.stock}')
                    order = SellOrder(user=user, stock=position.stock, portfolio=portfolio, position=position)
                    order.save()
            else:
                sma_position = SMAPosition.objects.filter(stock=position.stock, model=bo.sma_position.model, price_date=last_business_day.date()).first()
                if sma_position == None or sma_position.buy == False:
                    print('SMA POS NONE OR SMA POS SELL')
                    if not position.sell_order.first():
                        print(f'CREATING SELL ORDER {position.stock}')
                        order = SellOrder(user=user, stock=position.stock, portfolio=portfolio, sma_position=sma_position, position=position)
                        order.save()
        
        #PENDING BUY ORDERS REALLOCATION
        print('PENDING ORDERS REALLOCATION')
        pending_buy_orders = portfolio.buy_order.filter(executed_at__isnull=True, terminated_at__isnull=True)
        for order in pending_buy_orders:
            if order.submited_at != None and order.canceled_at == None:
                if order.price_date == None or order.price_date < last_business_day.date() or order.sma_position == None:
                    print(f'CANCEL ORDER TOO OLD {order.stock}')
                    order.canceled_at = datetime.datetime.now(tz=timezone.utc)
                    order.save()
                if order.current_price / order.order_price > 1.05:
                    print(f'CANCEL CURRENT PRICE IS .5% LOWER THAN ORDER PRICE {order.stock}')
                    order.canceled_at = datetime.datetime.now(tz=timezone.utc)
                    order.save()
            if order.submited_at == None and order.price_date < last_business_day.date() or order.sma_position == None:
                print(f'DELETE {order.stock}')
                order.delete()
        
        #INVESTMENTS
        print('PORTFOLIO INVESTMENTS')
        if portfolio_history.cash != None:
            min_score = SMABacktest.objects.aggregate(Min('score'))
            max_score = SMABacktest.objects.aggregate(Max('score'))
            total_invested_value = portfolio_history.total_invested_value
            cash = portfolio_history.cash
            print(f'CASH {cash}')
            if cash + portfolio_history.total_invested_value > 10000:
                max_allocation = 0.05 * (cash + portfolio_history.total_invested_value)
            elif cash + portfolio_history.total_invested_value > 100000:
                max_allocation = 0.01 * (cash + portfolio_history.total_invested_value)
            else:
                max_allocation = 0.1 * (cash + portfolio_history.total_invested_value)

            for b in backtests:
                print(len(b.model.sma_position.filter(price_date=last_business_day.date())))
                sma_position = b.model.sma_position.filter(price_date=last_business_day.date()).first()
                last_price = b.stock.price_history.filter(price_date=last_business_day.date()).first()
                pending_buy_orders = portfolio.buy_order.filter(executed_at__isnull=True, terminated_at__isnull=True).aggregate(Sum('total_investment'))

                if pending_buy_orders['total_investment__sum'] == None:
                    available_cash = cash
                else:
                    available_cash = cash - pending_buy_orders['total_investment__sum']

                if sma_position and last_price and sma_position.buy and available_cash > 0:
                    stock_allocation = max_allocation * (b.score/max_score['score__max'])
                    num_of_shares = int(stock_allocation/last_price.close)
                    if num_of_shares > 0:
                        stop_loss = last_price.close - b.model.stop_loss * last_price.close
                        take_profit = last_price.close + b.model.take_profit * last_price.close
                        total_investment = num_of_shares * last_price.close
                        serializer = BuyOrderCreateSerializer(data={'user':user.id, 'stock': b.stock.id, 'sma_position':sma_position.id, 'portfolio':portfolio.id, 'price_date':sma_position.price_date, 'num_of_shares':num_of_shares, 'order_rate':last_price.close, 'current_rate':last_price.close, 'total_investment':total_investment, 'stop_loss':stop_loss, 'take_profit':take_profit, 'created_at':datetime.datetime.now(tz=timezone.utc)})
                        if serializer.is_valid():
                            serializer.save()
                            print(f'BUYING STOCK: {b.stock} ({num_of_shares}) | stock_allocation: {stock_allocation} | available_cash: {available_cash}')
                        else:
                            print(f'SERIALIZER ERROR {b.stock}')
                            print(serializer.errors)
    gc.collect()


@shared_task
def update_sma_positions():
    print('update_sma_positions')
    backtests = SMABacktest.objects.all()
    for b in backtests:
        print(f'#### {b} ####')
        sma_position = b.sma_position.first()
        sma_position_date = sma_position.price_date
        last_price_date = sma_position.stock.price_history.first().price_date
        delta = last_price_date - sma_position_date
        days = [sma_position_date + timedelta(days=i) for i in range(delta.days + 1)]
        for d in days:
            if SMAPosition.objects.filter(stock=b.stock, sma_backtest=b, model=b.model, price_date=d).first() == None:
                sma_engine = SMAEngine(sma_position.stock.price_history.all(), b.model, date=d, backtest=False)
                if 'buy' in sma_engine.order.keys():
                    print(f'BUY: {sma_engine.order["buy"]}')
                    s = SMAPosition(stock=b.stock, sma_backtest=b, model=b.model, buy=sma_engine.order["buy"], price_date=d)
                    s.save()
                else:
                    print(sma_engine.order["error"])
    gc.collect()

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
            try:
                api = API(user.profile.broker_username, user.profile.broker_password, mode='demo')
                portfolio, positions = api.update_portfolio()
                pending_orders = api.get_pending_order()
                trade_history = api.update_trade_history()
            except Exception as err:
                print(err)
                pass
            else:
                if demo_portfolio == None:
                    create_portfolio.delay(portfolio, user.id, positions, pending_orders, trade_history)
                else:
                    save_portfolio.delay(portfolio, user.id, positions, pending_orders, trade_history)
        #real portfolio
        if real_portfolio == None or real_portfolio.updated_at < datetime.datetime.now(tz=timezone.utc):
            print(f'Updating real portfolio')
            try:
                api = API(user.profile.broker_username, user.profile.broker_password, mode='real')
                portfolio, positions = api.update_portfolio()
                pending_orders = api.get_pending_order()
                trade_history = api.update_trade_history()
            except Exception as err:
                print(err)
                pass
            else:
                if real_portfolio == None:
                    create_portfolio.delay(portfolio, user.id, positions, pending_orders, trade_history)
                else:
                    save_portfolio.delay(portfolio, user.id, positions, pending_orders, trade_history)
    gc.collect()

#PERIODIC TASKS
@periodic_task(run_every=(crontab(minute=0, hour='*/3')), name="update_price_history", ignore_result=True)
def update_price_history():
    print('update_price_history')
    stocks = Stock.objects.filter(valid=True) 
    for s in stocks:
        try:
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
                            print(err)
                            continue
        except:
            continue
    update_sma_positions.delay()
    gc.collect()

@periodic_task(run_every=(crontab(minute=0, hour='*/1')), name="update_orders", ignore_result=True)
def update_orders():
    print('update_orders')
    users = User.objects.all()
    for user in users:
        update_orders_task.delay(user.id)
    gc.collect()

@periodic_task(run_every=(crontab(minute=30, hour='*/1')), name="transmit_orders", ignore_result=True)
def transmit_orders():
    print('transmit_orders')
    users = User.objects.all()
    for user in users:
        portfolios = user.portfolio.all()
        for portfolio in portfolios:
            if portfolio.portfolio_type:
                mode = 'real'
            else:
                mode = 'demo'
            sell_orders = portfolio.sell_order.filter(submited_at__isnull=True)
            buy_orders = portfolio.buy_order.filter(submited_at__isnull=True).order_by('-total_investment') 
            canceled_buy_orders = portfolio.buy_order.filter(submited_at__isnull=False, canceled_at__isnull=False, terminated_at__isnull=True).order_by('-total_investment')
            orders = list(chain(sell_orders, buy_orders, canceled_buy_orders))
            if len(orders) != 0:
                api = API(user.profile.broker_username, user.profile.broker_password, mode=mode)
                api.transmit_orders(orders=orders)
        update_portfolio.delay(user.id)
        gc.collect()