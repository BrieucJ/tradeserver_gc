from io import StringIO
import time
import requests
from django.core.management.base import BaseCommand
from api.trade.sma_engine import SMAEngine
from api.trade.etoro import API
from ...models import Stock, PriceHistory, Index, IndexHistory
import pandas as pd
import datetime
import itertools

# python manage.py seed --mode=refresh

START_DATE = '2000-01-01'
END_DATE = str(datetime.date.today())
print(START_DATE)
print(END_DATE)
MODE_REFRESH = 'refresh'
MODE_CLEAR = 'clear'
MODE_SEED = 'seed'

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
    Index.objects.all().delete()
    IndexHistory.objects.all().delete()

def create_index():
    print('creating index and index history')
    ind = Index(symbol='^GSPC', name='S&P 500')
    ind.save()
    start_unix = int(time.mktime(datetime.datetime.strptime(START_DATE, "%Y-%m-%d").timetuple()))
    end_unix = int(time.mktime(datetime.datetime.strptime(END_DATE, "%Y-%m-%d").timetuple()))
    url = f'https://query1.finance.yahoo.com/v7/finance/download/^GSPC?period1={start_unix}&period2={end_unix}&interval=1d&events=history'
    r = requests.get(url)
    string =str(r.content,'utf-8')
    data = StringIO(string) 
    df = pd.read_csv(data)
    df['Date'] = pd.to_datetime(df['Date'])
    df.set_index('Date', inplace=True)
    for i, row in df.iterrows():
        if len(row) > 0:
            i_h = IndexHistory(index=ind, price_date=i, open=row['Open'], high=row['High'], low=row['Low'], close=row['Close'], volume=row['Volume'], created_at=datetime.date.today())
            i_h.save()

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
        ind = Index.objects.first()
        s = Stock(symbol=symbol, index=ind, name=row['Security'], sector=row['GICS Sector'], industry=row['GICS Sub Industry'], valid=validated)
        s.save()

def create_price_history():
    print('Creating price history...')
    stocks = Stock.objects.filter(valid=True)
    start_unix = int(time.mktime(datetime.datetime.strptime(START_DATE, "%Y-%m-%d").timetuple()))
    end_unix = int(time.mktime(datetime.datetime.strptime(END_DATE, "%Y-%m-%d").timetuple()))
    for s in stocks:
        print(s.symbol)
        if s.price_history.count() == 0:
            url = f'https://query1.finance.yahoo.com/v7/finance/download/{s.symbol}?period1={start_unix}&period2={end_unix}&interval=1d&events=history'
            r = requests.get(url)
            string =str(r.content,'utf-8')
            data = StringIO(string) 
            df = pd.read_csv(data)
            df['Date'] = pd.to_datetime(df['Date'])
            df.set_index('Date', inplace=True)
            print(df)
            for index, row in df.iterrows():
                if len(row) > 0:
                    p = PriceHistory(stock=s, price_date=index, open=row['Open'], high=row['High'], low=row['Low'], close=row['Close'], volume=row['Volume'], created_at=datetime.date.today())
                    p.save()


def run_seed(self, mode):
    if mode == MODE_CLEAR:
        clear_data()
        return
    elif mode == MODE_SEED:
        # create_index()
        # create_stocks()
        create_price_history()
    elif mode == MODE_REFRESH:
        clear_data()
        create_index()
        create_stocks()
        create_price_history()