import datetime
import pandas as pd
import numpy as np
from dateutil.relativedelta import relativedelta

class SMAEngine():
    def __init__(self, data, model, date=str(datetime.date.today()), initial_balance=100000, nav=100000, portfolio=None, backtest=True):
        # print('__INIT__')
        self.symbol = None
        self.stop_loss = model.stop_loss
        self.take_profit = model.take_profit
        self.low_sma = model.low_sma
        self.high_sma = model.high_sma
        self.data = data
        self.data_size = len(self.data) - self.high_sma
        self.df = None
        self.load_data()
        self.initial_balance= initial_balance
        self.nav = nav
        self.balance = initial_balance
        self.portfolio = portfolio
        if backtest:
            self.unprofitable_buy = 0
            self.profitable_buy = 0
            self.model_return = 0
            self.model_CAGR = 0
            self.model_SD = 0
            self.stock_return = 0
            self.stock_CAGR = 0
            self.stock_SD = 0
            self.buy_count = 0
            self.sell_count = 0
            self.stop_loss_count = 0
            self.take_profit_count = 0
            self.max_drawdown = 0
            self.history = []
            self.backtest()
        else:
            self.order = {}
            self.date = date
            self.trade()
        

    def load_data(self):
            self.symbol = str(self.data[0].stock)
            close_prices = [item.close for item in self.data]
            dates = [item.price_date for item in self.data]
            df = pd.DataFrame({'date': dates, 'close': close_prices})
            df = df.iloc[::-1] #old to new order
            df['low_sma'] = df['close'].rolling(self.low_sma).mean()
            df['high_sma'] = df['close'].rolling(self.high_sma).mean()
            df.dropna(inplace=True)
            df['date'] = pd.to_datetime(df['date'])
            df.set_index('date', inplace=True)
            self.df = df
            if self.df.index.size <= self.high_sma:
                print('Sample too small!')
                return
    
    def backtest(self):
        difference = relativedelta(self.df.index[-1], self.df.index[0])
        duration = float(difference.years + difference.months/12)
        for i in range(self.data_size):
            date = self.df.index.values[i]
            current_price = self.df.iloc[i]['close']
            buy = self.df.iloc[i]['low_sma'] > self.df.iloc[i]['high_sma'] #buy signal
            if self.portfolio == None:
                if buy:
                    self.buy_count += 1
                    num_of_shares = int(self.balance/current_price)
                    self.balance -= current_price * num_of_shares
                    self.portfolio = {}
                    self.portfolio['date'] = date
                    self.portfolio['shares'] = num_of_shares
                    self.portfolio['cost'] = current_price * num_of_shares
                    self.portfolio['purchase_price'] = current_price
                    self.portfolio['stop_loss'] = current_price - self.stop_loss * current_price
                    self.portfolio['take_profit'] = current_price + self.take_profit * current_price
            else:
                if current_price <= self.portfolio['stop_loss']:
                    self.unprofitable_buy += 1
                    self.sell_count += 1
                    self.stop_loss_count += 1
                    self.balance += current_price * self.portfolio["shares"]
                    self.portfolio = None
                elif current_price >= self.portfolio['take_profit']:
                    self.profitable_buy += 1
                    self.sell_count += 1
                    self.take_profit_count += 1
                    self.balance += current_price * self.portfolio["shares"]
                    self.portfolio = None
                elif not buy:
                    if self.portfolio['purchase_price'] > current_price:
                        self.unprofitable_buy += 1
                    else:
                        self.profitable_buy += 1
                    self.sell_count += 1
                    self.balance += current_price * self.portfolio["shares"]
                    self.portfolio = None
            
            if self.portfolio != None:
                self.nav = self.balance + self.portfolio['shares'] * current_price
            else:
                self.nav = self.balance
            
            if (self.nav - self.initial_balance) < self.max_drawdown:
                self.max_drawdown = self.nav - self.initial_balance
            
            self.history.append(self.nav)

            history_pct_change = pd.Series(self.history).pct_change()
            history_pct_change.dropna(inplace=True)
            stock_pct_change = self.df['close'].pct_change()
            stock_pct_change.dropna(inplace=True)

            self.stock_return = (self.df['close'].values[-1] / self.df['close'].values[0])-1
            self.stock_CAGR = (self.df['close'].values[-1] / self.df['close'].values[0])**(1/duration) - 1

            self.stock_SD = stock_pct_change.std()

            self.model_return = (self.nav / self.initial_balance) - 1
            self.model_CAGR = (self.nav / self.initial_balance)**(1/duration) - 1
            self.model_SD = history_pct_change.std()

    def trade(self):
        print('trade')
        try:
            current_date_values = self.df.loc[str(self.date)]
            buy = current_date_values['low_sma'] > current_date_values['high_sma']
            self.order['buy'] = buy
        except KeyError as err:
            self.order['error'] = err
            pass
        