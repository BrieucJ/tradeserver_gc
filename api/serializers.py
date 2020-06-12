from django.contrib.auth.models import User
from .models import Stock, PriceHistory, TradingModel, UserInfo
from rest_framework import serializers

class StockSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Stock
        fields = ['pk', 'symbol', 'name', 'sector', 'industry']

class PriceHistorySerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = PriceHistory
        fields = ['pk', 'price_date', 'open', 'high', 'low', 'close', 'volume', 'created_at']

class TradingModelSerializer(serializers.HyperlinkedModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    class Meta:
        model = TradingModel
        fields = ['pk', 'user', 'name', 'initial_balance', 'end_balance', 'look_back', 'low_sma', 'high_sma', 'max_single_pos', 'trading_interval', 'sma_diff', 'sma_slope',
        'start_date', 'end_date', 'max_drawdown', 'max_gain', 'true_trading_period', 'average_buy_pct', 'annualized_return', 'SP_return', 'alpha', 'created_at']

class UserInfoSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = UserInfo
        fields = ['pk', 'broker_username', 'broker_password']

class UserSerializer(serializers.HyperlinkedModelSerializer):
    models = TradingModelSerializer(source='user_model', many=True)
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'models']