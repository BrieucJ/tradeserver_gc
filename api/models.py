from django.db import models
from datetime import date
from django.contrib.auth.models import User
from django_cryptography.fields import encrypt

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    broker_username = encrypt(models.CharField(max_length=50, blank=True, null=True))
    broker_password = encrypt(models.CharField(max_length=50, blank=True, null=True))

class Stock(models.Model):
    symbol = models.CharField(max_length=5)
    name = models.CharField(max_length=50)
    sector = models.CharField(max_length=50)
    industry = models.CharField(max_length=50)

    def __str__(self):
        return self.symbol

class Position(models.Model):
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='stock_model')
    invest_date = models.DateField(default=None)
    invest_value = models.FloatField(default=0)
    invest_units = models.IntegerField(default=0)
    open_rate = models.FloatField(default=0)
    current_rate = models.FloatField(default=0)
    stop_loss_rate = models.FloatField(default=0)
    take_profit_rate = models.FloatField(default=0)

class Portfolio(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='portfolio')
    positions = models.ManyToManyField(Position)
    portfolio_type = models.BooleanField()
    cash = models.FloatField(default=0)
    total_invested_value = models.FloatField(default=0)

    class Meta:
        unique_together = ('user', 'portfolio_type')

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
        unique_together = ('stock', 'price_date')
        
    def __str__(self):
        return f'{self.stock} - {self.price_date}'

class TradingModel(models.Model):
    name = models.CharField(max_length=50)
    look_back = models.IntegerField(default=10)
    low_sma = models.IntegerField(default=10)
    high_sma = models.IntegerField(default=34)
    max_single_pos = models.FloatField(default=0.1)
    sma_diff = models.FloatField(default=0)
    sma_slope = models.FloatField(default=0)
    created_at = models.DateField(default=date.today)

    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name