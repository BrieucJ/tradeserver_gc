from django.db import models
from datetime import date, datetime
from django.contrib.auth.models import User
from django_cryptography.fields import encrypt
from django.utils import timezone

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    broker_username = encrypt(models.CharField(max_length=50, blank=True, null=True))
    broker_password = encrypt(models.CharField(max_length=50, blank=True, null=True))

class Stock(models.Model):
    symbol = models.CharField(max_length=5)
    name = models.CharField(max_length=50)
    sector = models.CharField(max_length=50)
    industry = models.CharField(max_length=50)
    class Meta:
        ordering = ['symbol']
        unique_together = ['symbol']

    def __str__(self):
        return self.symbol
    
    @property
    def last_price(self):
        return self.price_history.first()

class Portfolio(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='portfolio')
    portfolio_type = models.BooleanField(default=False)
    currency = models.CharField(max_length=1, default='€')
    cash = models.FloatField(default=None, null=True)
    total_invested_value = models.FloatField(default=None, null=True)
    date = models.DateTimeField(default=datetime.now(tz=timezone.utc))

    class Meta:
        ordering = ['-date']
        unique_together = ['user', 'portfolio_type', 'date']

class PendingOrder(models.Model):
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='pending_order')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pending_order')
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE, related_name='pending_order')
    total_investment = models.FloatField(default=0)
    open_rate = models.FloatField(default=0)
    current_price = models.FloatField(default=0)
    stop_loss = models.FloatField(default=0)
    take_profit = models.FloatField(default=0)
    submited_at = models.DateTimeField(default=None, null=True)

    class Meta:
        ordering = ['-submited_at']

class Position(models.Model):
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='position')
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE, related_name='position')
    invest_date = models.DateField(default=None)
    invest_value = models.FloatField(default=0)
    invest_units = models.IntegerField(default=0)
    open_rate = models.FloatField(default=0)
    current_rate = models.FloatField(default=0)
    stop_loss_rate = models.FloatField(default=0)
    take_profit_rate = models.FloatField(default=0)

class PriceHistory(models.Model):
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='price_history')
    price_date = models.DateField(default=None)
    open = models.FloatField(default=0)
    high = models.FloatField(default=0)
    low = models.FloatField(default=0)
    close = models.FloatField(default=0)
    volume = models.BigIntegerField(default=0)
    created_at = models.DateField(default=date.today)
    class Meta:
        ordering = ['-price_date']
        unique_together = ['stock', 'price_date']
        
    def __str__(self):
        return f'{self.stock} - {self.price_date}'

class SMAModel(models.Model):
    low_sma = models.IntegerField(default=10)
    high_sma = models.IntegerField(default=34)
    stop_loss = models.FloatField(default=0.1)
    take_profit = models.FloatField(default=0.25)
    created_at = models.DateField(default=date.today)

    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.low_sma}_{self.high_sma}'

class SMABacktest(models.Model):
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='backtest')
    model = models.ForeignKey(SMAModel, on_delete=models.CASCADE, related_name='backtest')
    precision = models.FloatField(default=0)
    score = models.FloatField(default=0)
    sharpe_ratio= models.FloatField(default=0)
    data_size = models.IntegerField(default=0)
    stock_return = models.FloatField(default=0)
    stock_cagr = models.FloatField(default=0)
    stock_sd = models.FloatField(default=0)
    model_return = models.FloatField(default=0)
    model_cagr = models.FloatField(default=0)
    model_sd = models.FloatField(default=0)
    buy_count = models.IntegerField(default=0)
    profitable_buy_count = models.IntegerField(default=0)
    unprofitable_buy_count = models.IntegerField(default=0)
    sell_count = models.IntegerField(default=0)
    stop_loss_count = models.IntegerField(default=0)
    take_profit_count = models.IntegerField(default=0)
    max_drawdown = models.FloatField(default=0)

    class Meta:
        ordering = ['-score']
        unique_together = ['model', 'stock']
    
    def __str__(self):
        return f'{self.model_cagr:.2%}_{self.model_sd:.2%}'

class SMAPosition(models.Model):
    model = models.ForeignKey(SMAModel, on_delete=models.CASCADE, related_name='sma_position')
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='sma_position')
    sma_backtest = models.ForeignKey(SMABacktest, on_delete=models.CASCADE, related_name='sma_position')
    price_date = models.DateField(default=None)
    buy = models.BooleanField(default=None, null=True)

    class Meta:
        ordering = ['-price_date']
        unique_together = ['price_date', 'stock', 'model']
    
    def __str__(self):
        return f'{self.model}_{self.stock}_{self.buy}'

class SellOrder(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sell_order')
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='sell_order')
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE, related_name='sell_order')
    sma_position = models.ForeignKey(SMAPosition, on_delete=models.CASCADE, related_name='sell_order', default=None, null=True)
    position = models.ForeignKey(Position, on_delete=models.CASCADE, related_name='sell_order')
    num_of_shares = models.IntegerField(default=None)
    price_date = models.DateField(default=None)
    created_at = models.DateTimeField(default=datetime.now(tz=timezone.utc))
    submited_at = models.DateTimeField(default=None, null=True)
    executed_at = models.DateTimeField(default=None, null=True)

    class Meta:
        unique_together = ['price_date', 'position', 'stock', 'portfolio']
        ordering = ['-price_date']

class BuyOrder(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='buy_order')
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='buy_order')
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE, related_name='buy_order', default=None)
    sma_position = models.ForeignKey(SMAPosition, on_delete=models.CASCADE, related_name='buy_order')
    price_date = models.DateField(default=None)
    num_of_shares = models.IntegerField(default=None)
    order_price = models.FloatField(default=None, null=True)
    total_investment = models.FloatField(default=None, null=True)
    stop_loss = models.FloatField(default=None, null=True)
    take_profit = models.FloatField(default=None, null=True)
    created_at = models.DateTimeField(default=datetime.now(tz=timezone.utc))
    submited_at = models.DateTimeField(default=None, null=True)
    executed_at = models.DateTimeField(default=None, null=True)
    
    class Meta:
        unique_together = ['user', 'price_date', 'stock', 'portfolio']
        ordering = ['-price_date']