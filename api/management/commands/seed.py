from django.core.management.base import BaseCommand
from api.trade.sma_engine import SMAEngine
from api.trade.etoro import API
from ...models import Stock, PriceHistory, SMAModel, SMABacktest, SMAPosition
import pandas as pd
from pandas_datareader import data
import datetime
import itertools

# python manage.py seed --mode=refresh

START_DATE = '2000-01-01'
END_DATE = datetime.date.today()

MODE_REFRESH = 'refresh'
MODE_CLEAR = 'clear'
MODE_SEED = 'seed'
MODE_BACKTEST = 'backtest'

class Command(BaseCommand):
    help = "seed database"

    def add_arguments(self, parser):
        parser.add_argument('--mode', type=str, help="Mode")

    def handle(self, *args, **options):
        self.stdout.write('seeding data...')
        run_seed(self, options['mode'])
        self.stdout.write('done.')

def clear_data():
    """Deletes all the data"""
    Stock.objects.all().delete()
    PriceHistory.objects.all().delete()
    SMAModel.objects.all().delete()
    SMABacktest.objects.all().delete()
    SMAPosition.objects.all().delete()

def create_stocks():
    print('Creating stocks...')
    SP500_df = pd.read_csv('./SP500_index.csv')
    api = API('TEST', 'TEST', mode='test')
    for index, row in SP500_df.iterrows():
        symbol = row['Symbol']
        if '.' in symbol: #replace wikipedia . to yahoo -
            symbol = symbol.replace('.','-')
        validated = api.validate_ticker(str(symbol).lower())
        print(f'{symbol} | {validated}')
        s = Stock(symbol=symbol, name=row['Security'], sector=row['GICS Sector'], industry=row['GICS Sub Industry'], valid=validated)
        s.save()

def create_price_history():
    print('Creating price history...')
    stocks = Stock.objects.filter(valid=True)
    for s in stocks:
        print(s.symbol)
        if s.price_history.exists() == False:
            df = data.DataReader(s.symbol, start=START_DATE, end=END_DATE, data_source='yahoo')
            for index, row in df.iterrows():
                if len(row) > 0:
                    p = PriceHistory(stock=s, price_date=index, open=row['Open'], high=row['High'], low=row['Low'], close=row['Close'], volume=row['Volume'], created_at=datetime.date.today())
                    p.save()

def create_sma_models():
    print('Creating SMA models...')
    smas = [[5, 10], [5, 20], [5, 30], [5, 40], [10, 20], [10, 30], [10, 50], [10, 100], [20, 50], [20,100], [20,150], [20,200], [30, 50], [30, 100], [30, 150], [30, 200], [50, 100], [50, 150], [50, 200]]
    stop_loss = [0.05]
    take_profit = [0.5]
    features = [smas, stop_loss, take_profit]
    versions = list(itertools.product(*features))
    print(len(versions))
    for version in versions:
        model = SMAModel(low_sma=version[0][0], high_sma=version[0][1], stop_loss=version[1], take_profit=version[2])
        model.save()

def backtest_sma_models():
    print('Backtesting SMA models...')
    testing_period = 2000
    min_period = 300
    models = SMAModel.objects.all()
    stocks = Stock.objects.filter(valid=True)
    for stock in stocks:
        print(stock)
        print(stock.id)
        prices = stock.price_history.all()
        if len(prices) < min_period:
            print(f'Skipping {stock} - history too small')
            continue
        else:
            for model in models:
                backtest = SMAEngine(prices[:testing_period], model, backtest=True)
                if backtest.model_CAGR > 0 and float(backtest.profitable_buy/backtest.buy_count) > 0.5:
                    print(f'#### SAVING {stock} {model} ####')
                    print(f'PRECISION: {backtest.profitable_buy/backtest.buy_count}')
                    print(f'TOTAL BUYS: {backtest.buy_count} | TOTAL SELLS: {backtest.sell_count} | PROFITABLE BUYS: {backtest.profitable_buy} | UNPROFITABLE BUYS: {backtest.unprofitable_buy}')
                    print(f'CAGR: {backtest.model_CAGR} | SD: {backtest.model_SD}')
                    print(f'MAX_DRAWDOWN: {backtest.max_drawdown} | STOP_LOSS: {backtest.stop_loss_count} | TAKE_PROFIT: {backtest.take_profit_count} ')
                    print('#### STOCK ####')
                    print(f'CAGR: {backtest.stock_CAGR} | SD: {backtest.stock_SD}')
                    smab = SMABacktest(stock=stock, model=model,data_size=backtest.data_size, precision=float(backtest.profitable_buy/backtest.buy_count), 
                                        sharpe_ratio=float(backtest.model_CAGR/backtest.model_SD), score=float((backtest.model_CAGR/backtest.model_SD)*(backtest.profitable_buy/backtest.buy_count)), 
                                        stock_return=backtest.stock_return, stock_sd=backtest.stock_SD, stock_cagr=backtest.stock_CAGR, 
                                        model_return=backtest.model_return, model_sd=backtest.model_SD, model_cagr=backtest.model_CAGR, 
                                        max_drawdown=backtest.max_drawdown, buy_count=backtest.buy_count, sell_count=backtest.sell_count,
                                        stop_loss_count=backtest.stop_loss_count, take_profit_count=backtest.take_profit_count,
                                        profitable_buy_count=backtest.profitable_buy, unprofitable_buy_count=backtest.unprofitable_buy)
                    smab.save()


def run_seed(self, mode):
    if mode == MODE_CLEAR:
        clear_data()
        return
    elif mode == MODE_SEED:
        create_stocks()
        create_price_history()
        create_sma_models()
    elif mode == MODE_REFRESH:
        clear_data()
        create_stocks()
        create_price_history()
        create_sma_models()
        backtest_sma_models()
    elif mode == MODE_BACKTEST:
        backtest_sma_models()