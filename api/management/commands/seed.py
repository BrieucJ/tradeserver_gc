from django.core.management.base import BaseCommand
from ...models import Stock, PriceHistory
import pandas as pd
from pandas_datareader import data
import datetime

# python manage.py seed --mode=refresh

START_DATE = '2000-01-01'
END_DATE = datetime.date.today() - datetime.timedelta(days=10)

MODE_REFRESH = 'refresh'
MODE_CLEAR = 'clear'

class Command(BaseCommand):
    help = "seed database"

    def add_arguments(self, parser):
        parser.add_argument('--mode', type=str, help="Mode")

    def handle(self, *args, **options):
        self.stdout.write('seeding data...')
        run_seed(self, options['mode'])
        self.stdout.write('done.')


def clear_data():
    """Deletes all the table data"""
    Stock.objects.all().delete()
    PriceHistory.objects.all().delete()


def create_stocks():
    print('Creating stocks...')
    SP500_df = pd.read_csv('./SP500_index.csv')
    for index, row in SP500_df.iterrows():
        symbol = row['Symbol']
        if '.' in symbol: #replace wikipedia . to yahoo -
            symbol = symbol.replace('.','-')
        s = Stock(symbol=symbol, name=row['Security'], sector=row['GICS Sector'], industry=row['GICS Sub Industry'])
        s.save()

def create_price_history():
    print('Creating price history...')
    stocks = Stock.objects.all()
    for s in stocks:
        print(s.symbol)
        if s.price_history.exists() == False:
            df = data.DataReader(s.symbol, start=START_DATE, end=END_DATE, data_source='yahoo')
            for index, row in df.iterrows():
                if len(row) > 0:
                    p = PriceHistory(stock=s, price_date=index, open=row['Open'], high=row['High'], low=row['Low'], close=row['Close'], volume=row['Volume'], created_at=datetime.date.today())
                    p.save()

def run_seed(self, mode):
    # Clear data from tables
    clear_data()
    if mode == MODE_CLEAR:
        return
    
    #seed database
    create_stocks()
    create_price_history()