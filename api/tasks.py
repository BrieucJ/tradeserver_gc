# import pandas as pd
# import time
# import datetime
# from celery.result import AsyncResult
# from celery.task.schedules import crontab
# from django.core.exceptions import ValidationError
# from celery.decorators import periodic_task
from celery import task, shared_task, current_task
from .trade.etoro import API
# from pandas_datareader import data
# from pandas_datareader._utils import RemoteDataError
# from .models import Stock, PriceHistory
# from celery.utils.log import get_task_logger

# logger = get_task_logger(__name__)

# END_DATE = datetime.date.today() 

# @periodic_task(run_every=(crontab(minute=0, hour='*/1')), name="update_price_history", ignore_result=True)
# def update_price_history():
#     stocks = Stock.objects.all() 
#     for s in stocks:
#         print(s.symbol)
#         start_date = s.price_history.last().price_date + datetime.timedelta(days=1)
#         if start_date < END_DATE:
#             print(f'start date: {start_date}')
#             print(f'end date: {END_DATE}')
#             try:
#                 df = data.DataReader(s.symbol, start=start_date, end=END_DATE, data_source='yahoo')
#                 print(df.index.size)
#             except RemoteDataError as err:
#                 print(f'#### {s.symbol} - {err} ####')
#                 continue
            
#             for index, row in df.iterrows():
#                 if len(row) > 0:
#                     try:
#                         p = PriceHistory(stock=s, price_date=index, open=row['Open'], high=row['High'], low=row['Low'], close=row['Close'], volume=row['Volume'], created_at=datetime.date.today())
#                         p.full_clean()
#                         p.save()
#                         print('saving')
#                     except ValidationError as err:
#                         print(f'#### {s.symbol} - {err} ####')
#                         continue

@shared_task
def update_portfolio_task(broker_username, broker_password):
    API(broker_username, broker_password).update_portfolio()