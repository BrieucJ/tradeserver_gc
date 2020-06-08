from .models import Stock, PriceHistory
from rest_framework import viewsets, mixins
from django.http import Http404
from .serializers import StockSerializer, PriceHistorySerializer


class StockViewSet(mixins.RetrieveModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = StockSerializer

    def get_queryset(self):
        queryset = Stock.objects.all().order_by('symbol')
        symbol = self.request.query_params.get('symbol', None)
        if symbol is not None:
            queryset = queryset.filter(symbol=symbol)
        return queryset


class PriceHistoryViewSet(mixins.RetrieveModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = PriceHistorySerializer

    def get_queryset(self):
        queryset = PriceHistory.objects.all()
        symbol = self.request.query_params.get('symbol', None)
        if symbol is not None:
            queryset = queryset.filter(stock__symbol=symbol)
            return queryset
        else:
            raise Http404('Missing required parameters')