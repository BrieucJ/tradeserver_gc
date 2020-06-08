from django.db import models
from datetime import date

class Stock(models.Model):
    symbol = models.CharField(max_length=5)
    name = models.CharField(max_length=50)
    sector = models.CharField(max_length=50)
    industry = models.CharField(max_length=50)
    
    def __str__(self):
        return self.symbol

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
        unique_together = ('stock', 'price_date')
        
    def __str__(self):
        return f'{self.stock} - {self.price_date}'