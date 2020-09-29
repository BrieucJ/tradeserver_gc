import os
import pandas as pd
import numpy as np
import tensorflow as tf
import glob
import time
import datetime
from datetime import date, timedelta
import json

class DeepEngine():
    def __init__(self, stock, neural_network, prices, index_prices):
        print(f'DeepEngine __init__ {neural_network}')
        self.index_prices = index_prices
        self.stock = stock
        self.prices = prices
        self.neural_net_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), f'neural_networks/{str(neural_network.nn_name)}')
        with open(os.path.join(self.neural_net_path, 'parameters.json')) as json_file: 
            self.parameters =  json.load(json_file)
        self.neural_net = tf.keras.models.load_model(str(self.neural_net_path))
        self.df = None
        self.prediction = None
        self.load_data()

    def process_df(self, stock_df, index_df):
        print('process_df')
        #merge
        stock_df['Market_close'] = index_df['Market_close']
        stock_df.dropna(inplace=True)

        #FEATURES ENGINEERING
        features_list = [f.strip().replace("'","") for f in self.parameters['features'].replace('[','').replace(']','').split(',')]
        features_list.remove('target')
        #DAILY RETURNS
        stock_df['mom_1'] = stock_df['Close'].pct_change()
        stock_df['market_mom_1'] = stock_df['Market_close'].pct_change()
        stock_df['Industry'] = self.stock.industry
        stock_df['Sector'] = self.stock.sector
        stock_df['Symbol'] = self.stock.symbol
                
        periods = np.unique([f.split('_')[-1] for f in features_list if '_' in f])

        for p in periods:
            p = int(p.strip().replace("'",""))
            #MOM
            stock_df[f'mom_{p}'] = stock_df['Close'].pct_change(p)
            stock_df[f'market_mom_{p}'] = stock_df['Market_close'].pct_change(p)
            #STANDARD DEVIATION
            stock_df[f'SD_{p}'] = np.sqrt(((stock_df['mom_1'].rolling(p+1).mean() - stock_df['mom_1'])**2)/p)
            stock_df[f'market_SD_{p}'] = np.sqrt(((stock_df['market_mom_1'].rolling(p+1).mean() - stock_df['market_mom_1'])**2)/p)
            #BETA
            cov = stock_df[['market_mom_1']].rolling(p).cov(stock_df['mom_1'].rolling(p))
            var = stock_df['market_mom_1'].rolling(p).var()
            stock_df[f'beta_{p}'] = cov['market_mom_1'] / var
            #ALPHA
            stock_df[f'alpha_{p}'] = stock_df[f'mom_{p}'] - stock_df[f'market_mom_{p}']

        stock_df = stock_df[features_list]
        stock_df.dropna(inplace=True)
        return stock_df

    def load_data(self):
        print('load_data')
        #stock
        close_prices = [item.close for item in self.prices]
        dates = [item.price_date for item in self.prices]
        stock_df = pd.DataFrame({'Date': dates, 'Close': close_prices})
        stock_df = stock_df.iloc[::-1] #old to new order
        stock_df.set_index('Date', inplace=True)
        stock_df.sort_index(inplace=True, ascending=True)

        #index
        index_close_prices = [item.close for item in self.index_prices]
        index_dates = [item.price_date for item in self.index_prices]
        index_df = pd.DataFrame({'Date': index_dates, 'Market_close': index_close_prices})
        index_df = index_df.iloc[::-1] #old to new order
        index_df['Date'] = pd.to_datetime(index_df['Date'])
        index_df.set_index('Date', inplace=True)
        index_df.sort_index(inplace=True, ascending=True)

        self.df = self.process_df(stock_df, index_df)

    def predict(self, date):
        try:
            row = self.df.loc[date]
        except KeyError:
            return None
        else:
            row = row.to_frame().transpose()
            row = row.reset_index()
            row = row.drop('index', axis=1)
            result = {}
            for c in row.columns:
                result[c] = row[c][0]

            data = tf.data.Dataset.from_tensors(result)
            data = data.batch(1)
            logit = self.neural_net.predict(data)
            assert(len(np.asarray(tf.nn.sigmoid(logit)).flatten())==1)
            prediction = np.asarray(tf.nn.sigmoid(logit)).flatten()[0]
        return prediction