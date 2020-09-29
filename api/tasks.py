from io import StringIO
import requests
import os
import tensorflow as tf
import glob
import datetime
import sys
import time
import json
from django.db.models import Sum, Q
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
#from .trade.sma_engine import SMAEngine
from .trade.deep_engine import DeepEngine
from django.contrib.auth.models import User
from django.utils.dateparse import parse_date
# from pandas_datareader import data
# from pandas_datareader._utils import RemoteDataError
import pandas_market_calendars as mcal
from .serializers import BuyOrderCreateSerializer
from .models import Stock, Position, Portfolio, PriceHistory, SellOrder, BuyOrder, PortfolioHistory, NeuralNetwork, Index, IndexHistory, Prediction
from re import sub
from decimal import Decimal
import pandas as pd
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import gc

nyse = mcal.get_calendar('NYSE')
LAST_TRADING_DATE = nyse.schedule(start_date=datetime.datetime.today() - timedelta(days=10), end_date=datetime.datetime.now(tz=nyse.tz)).max()['market_close']
print(f'LAST TRADING DATE: {LAST_TRADING_DATE}')

@shared_task
def create_portfolio(portfolio, user_id, positions, pending_orders, trade_history):
    print('create_portfolio')
    user = User.objects.get(id=user_id)

    tickers_list = [pos['ticker'] for pos in positions]

    if float(portfolio['cash']) + float(portfolio['total_invested_value']) > 10000:
        pos_size = 0.05
    elif float(portfolio['cash']) + float(portfolio['total_invested_value']) > 100000:
        pos_size = 0.01
    else:
        pos_size = 0.1
    
    #portfolio
    # print('creating portfolio')
    user_portfolio = Portfolio(user=user, portfolio_type=portfolio['portfolio_type'], neural_network=NeuralNetwork.objects.first(), currency=portfolio['currency'], pos_size=pos_size, created_at=datetime.datetime.now(tz=timezone.utc), updated_at=datetime.datetime.now(tz=timezone.utc))
    user_portfolio.save()
    portfolio_history = PortfolioHistory(portfolio=user_portfolio, cash=portfolio['cash'], total_invested_value=portfolio['total_invested_value'], latent_p_l=portfolio['latent_p_l'], created_at=datetime.datetime.now(tz=timezone.utc))
    portfolio_history.save()

    #positions
    print('creating current positions')
    for position in positions:
        print(position)
        if len(Stock.objects.filter(symbol=position['ticker'])) != 0:
            stock = Stock.objects.filter(symbol=position['ticker']).first()
        else:
            stock = None
        pos = Position(stock=stock, portfolio=user_portfolio, open_date=position['open_date'], open_rate=position['open_rate'], num_of_shares=position['num_of_shares'], current_rate=position['current_rate'], total_investment=position['total_investment'], stop_loss_rate=position['stop_loss_rate'], take_profit_rate=position['take_profit_rate'])
        pos.save()

    #trade history
    print('creating old positions')
    for th in trade_history:
        print(th)
        if len(Stock.objects.filter(symbol=th['ticker'])) != 0:
            stock = Stock.objects.filter(symbol=th['ticker']).first()
            pos = Position(stock=stock, portfolio=user_portfolio, open_date=th['open_date'], open_rate=th['open_rate'], num_of_shares=th['num_of_shares'], total_investment=th['total_investment'], close_date=th['close_date'], close_rate=th['close_rate'])
            pos.save()

    #orders
    print('creating orders')
    for pending_order in pending_orders:
        if len(Stock.objects.filter(symbol=pending_order['ticker'])) != 0:
            stock = Stock.objects.filter(symbol=pending_order['ticker']).first()
        else:
            stock = None
        
        if pending_order['order_type'] == 1:
            bo = BuyOrder(user=user, stock=stock, portfolio=user_portfolio, num_of_shares=pending_order['num_of_shares'], order_rate=pending_order['order_rate'], current_rate=pending_order['current_rate'],
                        total_investment=pending_order['total_investment'], stop_loss=pending_order['stop_loss'], take_profit=pending_order['take_profit'], created_at=datetime.datetime.now(tz=timezone.utc),
                        submited_at=pending_order['submited_at'])
            bo.save()
        elif pending_order['order_type'] == 0:
            existing_position = user_portfolio.position.filter(close_date__isnull=True, stock=stock)
            if len(existing_position) == 0:
                print('Creating old position for pending sell order')
                position = Position(stock=stock, portfolio=user_portfolio, open_rate=pending_order['open_rate'], num_of_shares=pending_order['num_of_shares'], current_rate=pending_order['current_rate'], total_investment=pending_order['total_investment'])
                position.save()
            else:
                position = existing_position.first()
                
            so = SellOrder(user=user, stock=stock, portfolio=user_portfolio, position=position, submited_at=datetime.datetime.now(tz=timezone.utc))
            so.save()
        else:
            print('UNKNOW ORDER TYPE')
    gc.collect()


@shared_task
def save_portfolio(portfolio, user_id, positions, pending_orders, trade_history):
    print(f'save_portfolio {portfolio["portfolio_type"]}')
    user = User.objects.get(id=user_id)
    user_portfolio = user.portfolio.get(portfolio_type=portfolio['portfolio_type'])

    #portfolio
    if float(portfolio['cash']) + float(portfolio['total_invested_value']) > 10000:
        pos_size = 0.05
    elif float(portfolio['cash']) + float(portfolio['total_invested_value']) > 100000:
        pos_size = 0.01
    else:
        pos_size = 0.1

    
    if pos_size != user_portfolio.pos_size:
        user_portfolio.pos_size = pos_size
    user_portfolio.updated_at = datetime.datetime.now(tz=timezone.utc)
    user_portfolio.save()

    portfolio_history = PortfolioHistory(portfolio=user_portfolio, cash=portfolio['cash'], total_invested_value=portfolio['total_invested_value'], latent_p_l=portfolio['latent_p_l'], created_at=datetime.datetime.now(tz=timezone.utc))
    portfolio_history.save()

    #positions
    for position in positions:
        if len(Stock.objects.filter(symbol=position['ticker'])) != 0:
            stock = Stock.objects.filter(symbol=position['ticker']).first()
        else:
            stock = None
        
        pos_list = user_portfolio.position.filter(stock=stock, close_date__isnull=True)
        if len(pos_list) == 1:
            existing_pos = pos_list.first()
            existing_pos.current_rate = position['current_rate']
            existing_pos.updated_at = datetime.datetime.now(tz=timezone.utc)
            existing_pos.save()
        elif len(pos_list) == 0:
            print(f'creating new position {position["ticker"]}')
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
        else:
            print(f'ERROR SAME STOCK {len(pos)} IN PORTFOLIO')

    #trade history
    print('#### TH ####')
    for th in trade_history:
        if len(Stock.objects.filter(symbol=th['ticker'])) != 0:
            stock = Stock.objects.filter(symbol=th['ticker']).first()

            old_positions = user_portfolio.position.filter(stock=stock, open_date__date=datetime.datetime.strptime(th['open_date'],'%Y-%m-%dT%H:%M:%SZ').date(), open_rate=th['open_rate'], num_of_shares=th['num_of_shares'], total_investment=th['total_investment'], close_date__date=datetime.datetime.strptime(th['close_date'],'%Y-%m-%dT%H:%M:%SZ').date())
            if old_positions.first() != None:
                pass
                # print(f'EXISTING OLD POSITION {th["ticker"]}')
            else:
                current_position = user_portfolio.position.filter(stock=stock, open_rate=th['open_rate'], num_of_shares=th['num_of_shares'], total_investment=th['total_investment'], close_date__isnull=True).first()
                if current_position:
                    print(f'Closing {th["ticker"]}')
                    current_position.close_date = th['close_date']
                    current_position.close_rate = th['close_rate']
                    current_position.updated_at = datetime.datetime.now(tz=timezone.utc)
                    current_position.save()
                    sell_order = current_position.sell_order.first()
                    if sell_order:
                        print(f'Closing {th["ticker"]} sell order')
                        if sell_order.executed_at == None:
                            sell_order.submited_at = th['close_date']
                            sell_order.executed_at = th['close_date']
                            sell_order.save()
                else:
                    print(f'UNKNOW OLD POSITION {th["ticker"]}')
                    pos = Position(stock=stock, portfolio=user_portfolio, open_date=th['open_date'], open_rate=th['open_rate'], num_of_shares=th['num_of_shares'], total_investment=th['total_investment'], close_date=th['close_date'], close_rate=th['close_rate'])
                    pos.save()
        else:
            print(f'Unknown stock: {th["ticker"]}')

    print('#### ORDERS ####')
    pending_order_stocks = [Stock.objects.filter(symbol=po['ticker']).first() for po in pending_orders]
    canceled_orders = user_portfolio.buy_order.filter(canceled_at__isnull=False, terminated_at__isnull=True)
    for co in canceled_orders:
        if co.stock not in pending_order_stocks:
            print(f'Buy Order has been canceled {co.stock}')
            co.terminated_at = datetime.datetime.now(tz=timezone.utc)
            co.save()

    print('pending orders')
    for pending_order in pending_orders:
        if len(Stock.objects.filter(symbol=pending_order['ticker'])) != 0:
            stock = Stock.objects.filter(symbol=pending_order['ticker']).first()
        else:
            stock = None

        if pending_order['order_type'] == 1:
            buy_order = user_portfolio.buy_order.filter(stock=stock, executed_at__isnull=True).first()
            if buy_order:
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
            existing_position = user_portfolio.position.filter(stock=stock, close_date__isnull=True)
            if len(existing_position) == 0:
                position = Position(stock=stock, portfolio=user_portfolio, open_rate=pending_order['open_rate'], num_of_shares=pending_order['num_of_shares'], current_rate=pending_order['current_rate'], total_investment=pending_order['total_investment'])
                position.save()
            else:
                position = existing_position.first()

            sell_order = position.sell_order.first()
            if sell_order:
                if sell_order.submited_at == None:
                    print('updating know sell order')
                    sell_order.submited_at = datetime.datetime.now(tz=timezone.utc)
                    sell_order.save()
            else:
                print('creating unknow sell order')
                so = SellOrder(user=user, stock=stock, portfolio=user_portfolio, position=position, submited_at=datetime.datetime.now(tz=timezone.utc))
                so.save()
        else:
            print('UNKNOW ORDER')
    gc.collect()

@shared_task
def update_disabled_portfolio(portfolio_id):
    print('update_disabled_portfolio')
    portfolio = Portfolio.objects.get(id=portfolio_id)
    positions = portfolio.position.filter(close_date__isnull=True)

    for position in positions:
        if position.sell_order.first() == None:
            print(f'SELLING ALL {position.stock}')
            order = SellOrder(user=portfolio.user, stock=position.stock, portfolio=portfolio, position=position)
            order.save()
    
    pending_buy_orders = portfolio.buy_order.filter(executed_at__isnull=True, terminated_at__isnull=True)
    for order in pending_buy_orders:
        if order.submited_at != None and order.canceled_at == None:
            print(f'CANCEL ORDERS {order.stock}')
            order.canceled_at = datetime.datetime.now(tz=timezone.utc)
            order.save()
    gc.collect()


@shared_task
def update_sell_orders(portfolio_id):
    sell_threshold = 0.5
    print('update_sell_orders')
    portfolio = Portfolio.objects.get(id=portfolio_id)
    positions = portfolio.position.filter(close_date__isnull=True)
    for position in positions:
        bo = position.buy_order.first()
        pending_bo = portfolio.buy_order.filter(stock=position.stock, submited_at__isnull=True).first()
        if bo == None and pending_bo == None:
            if position.sell_order.first() == None:
                print(f'CREATING SELL ORDER {position.stock}')
                order = SellOrder(user=portfolio.user, stock=position.stock, portfolio=portfolio, position=position)
                order.save()
        else:
            prediction = Prediction.objects.filter(stock=position.stock, neural_network=bo.neural_network, price_date=last_business_day.date()).first()
            print(prediction)
            if prediction == None:
                print('PREDICTION == NONE')
                if not position.sell_order.first() and (LAST_TRADING_DATE.date() - last_sma_position_date) >= 2:
                    print(f'CREATING SELL ORDER {position.stock}')
                    order = SellOrder(user=portfolio.user, stock=position.stock, portfolio=portfolio, prediction=prediction, position=position)
                    order.save()
            else:
                print('PREDICTION != NONE')
                if float(prediction.prediction) <= sell_threshold and not position.sell_order.first():
                    print(f'Prediction {prediction.prediction}')
                    print(f'CREATING SELL ORDER {position.stock}')
                    order = SellOrder(user=portfolio.user, stock=position.stock, portfolio=portfolio, prediction=prediction, position=position)
                    order.save()
    gc.collect()

@shared_task
def update_buy_orders(portfolio_id):
    print('update_buy_orders')
    portfolio = Portfolio.objects.get(id=portfolio_id)
    pending_buy_orders = portfolio.buy_order.filter(executed_at__isnull=True, terminated_at__isnull=True)

    for order in pending_buy_orders:
        if order.submited_at != None and order.executed_at == None and order.canceled_at == None:
            print(f'Pending buy order {order.price_date} | {LAST_TRADING_DATE.date()}')
            if order.price_date == None or order.price_date < LAST_TRADING_DATE.date() or order.prediction == None:
                print(f'CANCEL ORDER {order.stock}')
                order.canceled_at = datetime.datetime.now(tz=timezone.utc)
                order.save()
            if order.current_rate / order.order_rate > 1.05:
                print(f'CANCEL CURRENT PRICE IS .5% LOWER THAN ORDER PRICE {order.stock}')
                order.canceled_at = datetime.datetime.now(tz=timezone.utc)
                order.save()
        if order.submited_at == None and order.price_date < LAST_TRADING_DATE.date() or order.prediction == None:
            print(f'CANCEL {order.stock} - TOO OLD')
            order.canceled_at = datetime.datetime.now(tz=timezone.utc)
    gc.collect()

@shared_task
def update_investments(portfolio_id):
    print('update_investments')
    buy_threshold = 0.75
    portfolio = Portfolio.objects.get(id=portfolio_id)

    if portfolio.last_portfolio_history.cash != None:
        neural_network = portfolio.neural_network
        total_asset = float(portfolio.last_portfolio_history.cash) + float(portfolio.last_portfolio_history.total_invested_value)
        print(f'cash: {portfolio.last_portfolio_history.cash}')
        print(f'investments: {portfolio.last_portfolio_history.total_invested_value}')
        print(f'Total asset: {total_asset}')
        max_default_pos = portfolio.pos_size * total_asset
        print(f'max_default_pos: {max_default_pos}')

        predictions = neural_network.prediction.filter(price_date=LAST_TRADING_DATE.date()).order_by('-prediction')
        print(f'{len(predictions)} predictions')
        for p in predictions:
            print(f'Prediction: {p.stock.symbol} {p.prediction}')
            pending_buy_orders = portfolio.buy_order.filter(executed_at__isnull=True, terminated_at__isnull=True).aggregate(Sum('total_investment'))
            if pending_buy_orders['total_investment__sum'] == None:
                available_cash = float(portfolio.last_portfolio_history.cash)
            else:
                available_cash = float(portfolio.last_portfolio_history.cash) - pending_buy_orders['total_investment__sum']
            
            if float(p.prediction) > buy_threshold:
                last_price = p.stock.price_history.filter(price_date=LAST_TRADING_DATE.date()).first()
                num_of_shares = int(max_default_pos*float(p.prediction)/last_price.close)
                total_investment = num_of_shares * last_price.close
                if total_investment < available_cash:
                    if portfolio.stop_loss != None:
                        stop_loss = last_price.close - portfolio.stop_loss * last_price.close
                    else:
                        stop_loss = None
                    if portfolio.take_profit != None:
                        take_profit = last_price.close + portfolio.take_profit * last_price.close
                    else:
                        take_profit = None
                    serializer = BuyOrderCreateSerializer(data={'user':portfolio.user.id, 'stock': p.stock.id, 'prediction':p.id, 'portfolio':portfolio.id, 'price_date':p.price_date, 'num_of_shares':num_of_shares, 'order_rate':last_price.close, 'current_rate':last_price.close, 'total_investment':total_investment, 'stop_loss':stop_loss, 'take_profit':take_profit, 'created_at':datetime.datetime.now(tz=timezone.utc)})
                    if serializer.is_valid():
                        serializer.save()
                        print(f'BUYING STOCK: {p.stock.name} ({num_of_shares}) | total_investment: {total_investment} | available_cash: {available_cash}')
                    else:
                        print(f'SERIALIZER ERROR {p.stock.name}')
                        print(serializer.errors)
        
    gc.collect()

@shared_task
def update_orders_task(user_id):
    print('update_orders_task')
    user = User.objects.get(id=user_id)
    portfolios = user.portfolio.all()

    for portfolio in portfolios:
        portfolio_history = portfolio.last_portfolio_history
        positions = portfolio.position.filter(close_date__isnull=True)
        print(f'Portfolio type: {portfolio.portfolio_type}')

        if (portfolio.portfolio_type and portfolio.active == False):
            update_disabled_portfolio.delay(portfolio.id)
            continue
        if (portfolio.portfolio_type == False and portfolio.active == False):
            update_disabled_portfolio.delay(portfolio.id)
            continue
        
        print('PORTFOLIO ACTIVE')
        update_sell_orders.delay(portfolio.id)
        update_buy_orders.delay(portfolio.id)
        update_investments.delay(portfolio.id)
    gc.collect()

@shared_task
def update_neural_networks():
    print('update_deep_models')
    dirname = os.path.dirname(__file__)
    folder_path = os.path.join(dirname, 'neural_networks/*')
    folder_list = glob.glob(folder_path)
    for f in folder_list:
        nn_name = f.split('/')[-1]
        params_file = os.path.join(f, 'parameters.json')
        with open(params_file) as json_file:
            parameters = json.load(json_file)
            dm = NeuralNetwork(nn_name=nn_name, nn_type=parameters['nn_type'], batch_size=parameters['batch_size'], 
                    drop_val=parameters['drop_val'], dropout=str(parameters['dropout'])=='true', 
                    features=parameters['features'], last_epoch=parameters['last_epoch'],
                    loss=parameters['loss'], loss_fn=parameters['loss_fn'],
                    n_epoch=parameters['n_epoch'], n_hidden_layers=parameters['n_hidden_layers'],
                    optimizer=parameters['optimizer'], test_accuracy=parameters['test_accuracy'],
                    test_loss=parameters['test_loss'], units=parameters['units'],
                    val_accuracy=parameters['val_accuracy'], val_loss=parameters['val_loss'],
                    future_target=parameters['future_target'], target_type=parameters['target_type'],
                    prediction_type=parameters['prediction_type']
                )
            try:
                dm.save()
            except IntegrityError as err:
                pass
            else:
                print(f'Creating {nn_name}')

@shared_task
def update_indexes():
    print('update_indexes')
    indexes = Index.objects.all() 
    for i in indexes:
        if i.index_history.exists():
            start_date = i.index_history.first().price_date
        else:
            start_date = datetime.datetime(2000, 1, 1)
        
        end_date = LAST_TRADING_DATE
        print(f'Start_date: {start_date}')
        print(f'End_date: {end_date}')
        if start_date < end_date:
            start_unix = int(time.mktime(start_date.timetuple()))
            end_unix = int(time.mktime(end_date.timetuple()))
            url = f'https://query1.finance.yahoo.com/v7/finance/download/{i.symbol}?period1={start_unix}&period2={end_unix}&interval=1d&events=history'
            r = requests.get(url)
            string=str(r.content,'utf-8')
            data = StringIO(string) 
            df = pd.read_csv(data)
            df['Date'] = pd.to_datetime(df['Date'])
            df.set_index('Date', inplace=True)
            for index, row in df.iterrows():
                if len(row) > 0:
                    try:
                        i_h = IndexHistory(index=i, price_date=index, open=row['Open'], high=row['High'], low=row['Low'], close=row['Close'], volume=row['Volume'], created_at=datetime.datetime.now(tz=timezone.utc))
                        i_h.full_clean()
                        i_h.save()
                    except ValidationError as err:
                        print(err)
                        continue
    gc.collect()   

@shared_task
def update_price_history():
    print('update_price_history')
    stocks = Stock.objects.filter(valid=True)
    update_indexes.delay()
    for s in stocks:
        if s.price_history.first():
            start_date = s.price_history.first().price_date
        else:
            start_date = datetime.datetime(2000, 1, 1)
        
        end_date = LAST_TRADING_DATE

        if start_date < end_date:
            start_unix = int(time.mktime(start_date.timetuple()))
            end_unix = int(time.mktime(end_date.timetuple()))
            url = f'https://query1.finance.yahoo.com/v7/finance/download/{s.symbol}?period1={start_unix}&period2={end_unix}&interval=1d&events=history'
            r = requests.get(url)
            string =str(r.content,'utf-8')
            data = StringIO(string) 
            df = pd.read_csv(data)
            df['Date'] = pd.to_datetime(df['Date'])
            df.set_index('Date', inplace=True)

            for index, row in df.iterrows():
                if len(row) > 0:
                    try:
                        p = PriceHistory(stock=s, price_date=index, open=row['Open'], high=row['High'], low=row['Low'], close=row['Close'], volume=row['Volume'], created_at=datetime.datetime.now(tz=timezone.utc))
                        p.full_clean()
                        p.save()
                    except ValidationError as err:
                        print(err)
                        continue
    update_predictions.delay()
    gc.collect()

@shared_task
def stock_prediction(stock_id, nn_id):
    nn = NeuralNetwork.objects.get(id=nn_id)
    stock = Stock.objects.get(id=stock_id)
    prediction = stock.prediction.first()
    if prediction == None:
        prediction_date = (datetime.datetime.today() - datetime.timedelta(days=20)).date()
    else:
        prediction_date = prediction.price_date
    print(f'LAST TRADING DATE: {LAST_TRADING_DATE.date()}')
    print(f'Last stock price date: {stock.last_price.price_date}')
    print(f'Last prediction  date: {prediction_date}')
    delta = stock.last_price.price_date - prediction_date
    print(f'DELTA: {delta}')
    print(range(delta.days))
    days = [prediction_date + timedelta(days=i+1) for i in range(delta.days)]
    print(f'DAYS {days}')
    print(f'# of days: {len(days)}')
    index_prices = Index.objects.get(symbol='^GSPC').index_history.all()
    if len(days) != 0:
        engine = DeepEngine(stock=stock, neural_network=nn, prices=stock.price_history.all(), index_prices=stock.index.index_history.all())
        for d in days:
            prediction = engine.predict(date=d)
            pred = Prediction(neural_network=nn, stock=stock, price_date=d, prediction=prediction)
            try:
                pred.save()
            except IntegrityError as err:
                print(err)
                pass
            else:
                print(f'Saving {stock.symbol} prediction {prediction} for {d}')
    gc.collect()

@shared_task
def update_predictions():
    print('update_predictions')
    neural_networks = NeuralNetwork.objects.all()
    stocks = Stock.objects.filter(valid=True)
    for nn in neural_networks:
        for s in stocks:
            stock_prediction.delay(s.id, nn.id)
            print(s)
    gc.collect()

@shared_task
def update_portfolio(user_id):
    print('update_portfolio')
    user = User.objects.get(id=user_id)
    demo_portfolio = user.portfolio.filter(portfolio_type=False).first()
    real_portfolio = user.portfolio.filter(portfolio_type=True).first()

    if user.profile.broker_password != None and user.profile.broker_password != None:
        #real portfolio
        if real_portfolio == None or real_portfolio.updated_at < datetime.datetime.now(tz=timezone.utc):
            print(f'Updating real portfolio')
            try:
                api = API(user.profile.broker_username, user.profile.broker_password, mode='real')
                portfolio, positions = api.update_portfolio()
                pending_orders = api.get_pending_order()
                trade_history = api.update_trade_history()
            except Exception as err:
                print('#### ETORO ERROR ####')
                print(Exception)
                print(err)
                pass
            else:
                if real_portfolio == None:
                    create_portfolio.delay(portfolio, user.id, positions, pending_orders, trade_history)
                else:
                    save_portfolio.delay(portfolio, user.id, positions, pending_orders, trade_history)
        
        #demo portolio
        if demo_portfolio == None or demo_portfolio.updated_at < datetime.datetime.now(tz=timezone.utc):
            print(f'Updating demo portfolio')
            try:
                api = API(user.profile.broker_username, user.profile.broker_password, mode='demo')
                portfolio, positions = api.update_portfolio()
                pending_orders = api.get_pending_order()
                trade_history = api.update_trade_history()
            except Exception as err:
                print('#### ETORO ERROR ####')
                print(err)
                pass
            else:
                if demo_portfolio == None:
                    create_portfolio.delay(portfolio, user.id, positions, pending_orders, trade_history)
                else:
                    save_portfolio.delay(portfolio, user.id, positions, pending_orders, trade_history)
    gc.collect()


@shared_task
def transmit_user_order(user_id, portfolio_id):
    user = User.objects.get(id=user_id)
    print(f'transmit {user.email} orders')
    portfolio = Portfolio.objects.get(id=portfolio_id)
    if portfolio.portfolio_type:
        mode = 'real'
    else:
        mode = 'demo'
    sell_orders = portfolio.sell_order.filter(submited_at__isnull=True, executed_at__isnull=True)
    buy_orders = portfolio.buy_order.filter(submited_at__isnull=True, canceled_at__isnull=True, terminated_at__isnull=True, executed_at__isnull=True).order_by('-total_investment') 
    canceled_buy_orders = portfolio.buy_order.filter(submited_at__isnull=False, canceled_at__isnull=False, terminated_at__isnull=True).order_by('-total_investment')
    orders = list(chain(sell_orders, buy_orders, canceled_buy_orders))
    if len(orders) != 0:
        api = API(user.profile.broker_username, user.profile.broker_password, mode=mode)
        api.transmit_orders(orders=orders)

#PERIODIC TASKS
@periodic_task(run_every=(crontab(minute=0, hour='*/2')), name="update_orders", ignore_result=True)
def update_orders():
    print('update_orders')
    users = User.objects.all()
    if len(Stock.objects.filter(valid=True, price_history__price_date=LAST_TRADING_DATE.date())) != len(Stock.objects.filter(valid=True)):
        print('update stock prices')
        update_price_history.delay()
        update_indexes.delay()
    for user in users:
        update_orders_task.delay(user.id)
    gc.collect()

@periodic_task(run_every=(crontab(minute=30, hour='*/2')), name="transmit_orders", ignore_result=True)
def transmit_orders():
    print('transmit_orders')
    users = User.objects.all()
    for user in users:
        print(user.email)
        portfolios = user.portfolio.all()
        for portfolio in portfolios:
            transmit_user_order.delay(user.id, portfolio.id)
        update_portfolio.delay(user.id)
    gc.collect()