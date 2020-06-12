from .models import Stock, PriceHistory, TradingModel
from rest_framework import viewsets, mixins, generics, permissions, status
from rest_framework.decorators import api_view
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import Http404, HttpResponse
from .serializers import StockSerializer, PriceHistorySerializer, TradingModelSerializer, UserSerializer
from django.contrib.auth.models import User
from .tasks  import backtest_task

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

class TradingModelViewSet(viewsets.ModelViewSet):
    serializer_class = TradingModelSerializer
    def get_queryset(self, request):
        queryset = TradingModel.objects.filter(user=request.user)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

@api_view(['POST'])
def backtest(request):
    print('backtest')
    print(request)
    backtest_task.delay()
    return Response('Backtest started', status=status.HTTP_201_CREATED)


@api_view(['GET'])
def current_user(request):
    serializer = UserSerializer(request.user, context={'request': request})
    return Response(serializer.data)

class UserDetail(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class UserList(APIView):
    permission_classes = (permissions.AllowAny,)
    def post(self, request, format=None):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)