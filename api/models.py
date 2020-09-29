from django.db import models
from datetime import date, datetime
from django.contrib.auth.models import User
from django_cryptography.fields import encrypt
from django.utils import timezone
# from .tasks import LAST_TRADING_DATE

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    broker_username = encrypt(models.CharField(max_length=50, blank=True, null=True))
    broker_password = encrypt(models.CharField(max_length=50, blank=True, null=True))

class Index(models.Model):
    symbol = models.CharField(max_length=5)
    name = models.CharField(max_length=50)
    class Meta:
        ordering = ['symbol']
        unique_together = ['symbol']

    def __str__(self):
        return self.symbol
    
    @property
    def last_price(self):
        return self.index_history.first()

class Stock(models.Model):
    symbol = models.CharField(max_length=5)
    index = models.ForeignKey(Index, on_delete=models.PROTECT, related_name='index')
    name = models.CharField(max_length=50)
    sector = models.CharField(max_length=50)
    industry = models.CharField(max_length=50)
    valid = models.BooleanField(default=False)
    class Meta:
        ordering = ['symbol']
        unique_together = ['symbol']

    def __str__(self):
        return self.symbol
    
    @property
    def last_price(self):
        return self.price_history.first()


class IndexHistory(models.Model):
    index = models.ForeignKey(Index, on_delete=models.CASCADE, related_name='index_history')
    price_date = models.DateField(default=None)
    open = models.FloatField(default=0)
    high = models.FloatField(default=0)
    low = models.FloatField(default=0)
    close = models.FloatField(default=0)
    volume = models.BigIntegerField(default=0)
    created_at = models.DateField(default=date.today)
    class Meta:
        ordering = ['-price_date']
        unique_together = ['index', 'price_date']
        
    def __str__(self):
        return f'{self.index.name} - {self.price_date}'

class NeuralNetwork(models.Model):
    nn_name = models.CharField(max_length=500, default=None)
    nn_type = models.CharField(max_length=500, default=None)
    batch_size = models.FloatField(default=None)
    drop_val = models.FloatField(default=None)
    dropout = models.BooleanField(default=None)
    features = models.CharField(max_length=50000, default=None)
    last_epoch = models.IntegerField(default=None)
    loss =  models.FloatField(default=None)
    loss_fn = models.CharField(max_length=500, default=None)
    n_epoch = models.IntegerField(default=None)
    n_hidden_layers = models.IntegerField(default=None)
    optimizer = models.CharField(max_length=500, default=None)
    test_accuracy = models.FloatField(default=None)
    test_loss = models.FloatField(default=None)
    units = models.IntegerField(default=None)
    val_accuracy = models.FloatField(default=None)
    val_loss = models.FloatField(default=None)
    future_target = models.IntegerField(default=None)
    target_type = models.CharField(max_length=500, default=None)
    prediction_type = models.CharField(max_length=500, default=None)

    class Meta:
        ordering = ['-test_accuracy']
        unique_together = ['nn_name', 'test_accuracy']


    def __str__(self):
        return f'{self.nn_name}'

class Portfolio(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='portfolio')
    neural_network = models.ForeignKey(NeuralNetwork, on_delete=models.SET_NULL, blank=True, null=True, related_name='portfolio')
    portfolio_type = models.BooleanField(default=False)
    currency = models.CharField(max_length=1, default='€')
    updated_at = models.DateTimeField(default=timezone.now, blank=True)
    created_at = models.DateTimeField(default=timezone.now, blank=True)
    active = models.BooleanField(default=False)
    take_profit = models.FloatField(default=None, null=True)
    stop_loss = models.FloatField(default=0.05, null=True)
    pos_size = models.FloatField(default=0.1, null=True)
    
    class Meta:
        ordering = ['-updated_at']
        unique_together = ['user', 'portfolio_type']
    
    @property
    def last_portfolio_history(self):
        return self.portfolio_history.last()
    
    @property
    def first_portfolio_history(self):
        return self.portfolio_history.first()
    
    @property
    def history(self):
        print('HISTORY')
        return self.portfolio_history.order_by('created_at__date').distinct('created_at__date')

class PortfolioHistory(models.Model):
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE, related_name='portfolio_history')
    cash = models.FloatField(default=None, null=True)
    total_invested_value = models.FloatField(default=None, null=True)
    latent_p_l = models.FloatField(default=None, null=True)
    created_at = models.DateTimeField(default=timezone.now, blank=True)

    # class Meta:
    #     ordering = ['-created_at']

class Prediction(models.Model):
    neural_network = models.ForeignKey(NeuralNetwork, on_delete=models.CASCADE, related_name='prediction')
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='prediction')
    price_date = models.DateField(default=None)
    prediction = models.FloatField()

    class Meta:
        ordering = ['-price_date']
        unique_together = ['price_date', 'stock', 'neural_network']
    
    def __str__(self):
        return f'{self.neural_network}_{self.stock}_{self.prediction}'

class Position(models.Model):
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='position', default=None, null=True)
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE, related_name='position')

    open_date = models.DateTimeField(default=None, null=True)
    open_rate = models.FloatField(default=0)
    num_of_shares = models.IntegerField(default=0)
    total_investment = models.FloatField(default=0)
    stop_loss_rate = models.FloatField(default=0)
    take_profit_rate = models.FloatField(default=0)
    
    current_rate = models.FloatField(default=0)
    updated_at = models.DateTimeField(default=None, null=True)
    created_at = models.DateTimeField(default=timezone.now, blank=True)

    close_rate = models.FloatField(default=0)
    close_date = models.DateTimeField(default=None, null=True)
    
    class Meta:
        ordering = ['-open_date']
        constraints = [models.UniqueConstraint(fields=['stock', 'portfolio'], condition=models.Q(close_date__isnull=True), name='unique stock if in portfolio')]

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

class SellOrder(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sell_order')
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='sell_order')
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE, related_name='sell_order')
    prediction = models.ForeignKey(Prediction, on_delete=models.CASCADE, related_name='sell_order', default=None, null=True)
    position = models.ForeignKey(Position, on_delete=models.CASCADE, related_name='sell_order')
    created_at = models.DateTimeField(default=timezone.now, blank=True)
    submited_at = models.DateTimeField(default=None, null=True)
    executed_at = models.DateTimeField(default=None, null=True)

    class Meta:
        unique_together = ['user', 'position', 'stock', 'portfolio']
        ordering = ['-created_at']

class BuyOrder(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='buy_order')
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='buy_order')
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE, related_name='buy_order')
    prediction = models.ForeignKey(Prediction, on_delete=models.CASCADE, related_name='buy_order', default=None, null=True)
    position = models.ForeignKey(Position, on_delete=models.CASCADE, related_name='buy_order', default=None, null=True)
    price_date = models.DateField(default=None, null=True)
    num_of_shares = models.IntegerField(default=None)
    order_rate = models.FloatField(default=None, null=True)
    current_rate = models.FloatField(default=None, null=True)
    total_investment = models.FloatField(default=None, null=True)
    stop_loss = models.FloatField(default=None, null=True)
    take_profit = models.FloatField(default=None, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    submited_at = models.DateTimeField(default=None, null=True)
    executed_at = models.DateTimeField(default=None, null=True)
    canceled_at = models.DateTimeField(default=None, null=True)
    terminated_at = models.DateTimeField(default=None, null=True)
    
    class Meta:
        ordering = ['-created_at']

