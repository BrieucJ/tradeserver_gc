from .models import Stock, PriceHistory
from rest_framework import serializers

class StockSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Stock
        fields = ['symbol', 'name', 'sector', 'industry']

class PriceHistorySerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = PriceHistory
        fields = ['price_date', 'open', 'high', 'low', 'close', 'volume', 'created_at']