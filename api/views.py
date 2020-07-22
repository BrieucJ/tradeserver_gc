
from rest_framework import viewsets, mixins, generics, permissions, status
from rest_framework.permissions import AllowAny, IsAuthenticated
# from rest_framework.decorators import api_view, authentication_classes
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response

from django.contrib.auth.models import User
from django.http import Http404, HttpResponse, HttpResponseRedirect
from .permissions import IsAuthenticatedOrWriteOnly
from .serializers import ProfileSerializer, UserSerializer, PortfolioSerializer, PositionSerializer, StockSerializer, SMABacktestSerializer, SMAPositionSerializer, BuyOrderSerializer, SellOrderSerializer
from .trade.etoro import API
from .tasks  import update_portfolio_task, update_sma_positions, update_price_history, transmit_orders, update_orders
from .models import Profile, Portfolio, Stock, SMABacktest, SMAPosition

# class StockViewSet(mixins.RetrieveModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
#     serializer_class = StockSerializer
#     def get_queryset(self):
#         queryset = Stock.objects.all().order_by('symbol')
#         symbol = self.request.query_params.get('symbol', None)
#         if symbol is not None:
#             queryset = queryset.filter(symbol=symbol)
#         return queryset

# class PriceHistoryViewSet(mixins.RetrieveModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
#     serializer_class = PriceHistorySerializer
#     def get_queryset(self):
#         queryset = PriceHistory.objects.all()
#         symbol = self.request.query_params.get('symbol', None)
#         if symbol is not None:
#             queryset = queryset.filter(stock__symbol=symbol)
#             return queryset
#         else:
#             raise Http404('Missing required parameters')

# class TradingModelViewSet(viewsets.ModelViewSet):
#     serializer_class = TradingModelSerializer
#     def get_queryset(self, request):
#         queryset = TradingModel.objects.filter(user=request.user)
#         return queryset
    
#     def perform_create(self, serializer):
#         serializer.save(user=self.request.user)

class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        user_data = UserSerializer(user, context={'request': request}).data
        return Response({'user': user_data, 'token': token.key})

class UserView(generics.CreateAPIView, generics.UpdateAPIView):
    permission_classes = (IsAuthenticatedOrWriteOnly,)
    serializer_class = UserSerializer
    def post(self, request, format=None):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            user = User.objects.get(username=serializer.data['username'])
            token, created = Token.objects.get_or_create(user=user)
            return Response({'user': serializer.data, 'token': token.key}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def put(self, request, format=None):
        serializer = self.serializer_class(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'user': serializer.data}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RetrievePortfolio(generics.RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = PortfolioSerializer
    queryset = Portfolio.objects.all()

    def retrieve(self, request, *args, **kwargs):
        u = request.user
        try:
            p_demo = Portfolio.objects.filter(user=u, portfolio_type=False).latest('date')
            pos_demo = p_demo.position.all()
            pending_buy_orders_demo = BuyOrderSerializer(p_demo.buy_order.all(), many=True).data 
            pending_sell_orders_demo = SellOrderSerializer(p_demo.sell_order.all(), many=True).data  
            pending_orders_demo = pending_buy_orders_demo + pending_sell_orders_demo 
        except Portfolio.DoesNotExist:
            p_demo = None
            pos_demo = None
            pending_orders_demo = []
        try:
            p_real = Portfolio.objects.filter(user=u, portfolio_type=True).latest('date')
            pos_real = p_real.position.all()
            pending_buy_orders_real = BuyOrderSerializer(p_real.buy_order.all(), many=True).data 
            pending_sell_orders_real = SellOrderSerializer(p_real.sell_order.all(), many=True).data  
            pending_orders_real = pending_buy_orders_real + pending_sell_orders_real 
        except Portfolio.DoesNotExist:
            p_real = None
            pos_real = None
            pending_orders_real = []

        return Response({'p_demo': {'portfolio': PortfolioSerializer(p_demo).data, 'positions': PositionSerializer(pos_demo, many=True).data, 'pending_orders': pending_orders_demo}, 'p_real': {'portfolio': PortfolioSerializer(p_real).data, 'positions': PositionSerializer(pos_real, many=True).data, 'pending_orders': pending_orders_real}}, status=status.HTTP_200_OK)

class RetrieveMarket(generics.RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = StockSerializer
    queryset = Stock.objects.all()

    def retrieve(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        stocks = StockSerializer(queryset, many=True)
        return Response({'stocks': stocks.data})

class RetrieveModel(generics.RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = SMABacktestSerializer()
    queryset = SMABacktest.objects.all()

    def retrieve(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        sma_backtest = SMABacktestSerializer(queryset, many=True)
        return Response({'sma_backtest': sma_backtest.data})

class UpdateSMAPosition(generics.RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    queryset = SMABacktest.objects.all()
    serializer_class = SMABacktestSerializer()

    def retrieve(self, request, *args, **kwargs):
        print('Retrieve')
        queryset = self.get_queryset()
        update_sma_positions.delay()
        sma_backtest = SMABacktestSerializer(queryset, many=True)
        return Response({'sma_backtest': sma_backtest.data})

class UpdateStocks(generics.RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    queryset = Stock.objects.all()
    serializer_class = StockSerializer()

    def retrieve(self, request, *args, **kwargs):
        print('Retrieve')
        queryset = self.get_queryset()
        update_price_history.delay()
        stocks = StockSerializer(queryset, many=True)
        return Response({'stocks': stocks.data})

class UpdatePortfolio(generics.RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = PortfolioSerializer
    queryset = Portfolio.objects.all()

    def retrieve(self, request, *args, **kwargs):
        print('Retrieve')
        task = update_portfolio_task.delay()
        result = task.wait(timeout=None, interval=0.5)
        u = request.user
        try:
            p_demo = Portfolio.objects.filter(user=u, portfolio_type=False).latest('date')
            pos_demo = p_demo.position.all()
            pending_buy_orders = BuyOrderSerializer(p_demo.buy_order.all(), many=True).data 
            pending_sell_orders = SellOrderSerializer(p_demo.sell_order.all(), many=True).data  
            pending_orders = pending_buy_orders + pending_sell_orders 
        except Portfolio.DoesNotExist:
            p_demo = None
            pos_demo = None
            pending_orders = []
        
        try:
            p_real = Portfolio.objects.filter(user=u, portfolio_type=True).latest('date')
            pos_real = p_real.position.all()
            pending_buy_orders = BuyOrderSerializer(p_real.buy_order.all(), many=True).data 
            pending_sell_orders = SellOrderSerializer(p_real.sell_order.all(), many=True).data  
            pending_orders = pending_buy_orders + pending_sell_orders 
        except Portfolio.DoesNotExist:
            p_real = None
            pos_real = None
            pending_orders = []
        
        return Response({'p_demo': {'portfolio': PortfolioSerializer(p_demo).data, 'positions': PositionSerializer(pos_demo, many=True).data, 'pending_orders': pending_orders}, 'p_real': {'portfolio': PortfolioSerializer(p_real).data, 'positions': PositionSerializer(pos_real, many=True).data, 'pending_orders': pending_orders}}, status=status.HTTP_200_OK)
    
class UpdateOrders(generics.RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    queryset = Stock.objects.all()
    serializer_class = StockSerializer()

    def retrieve(self, request, *args, **kwargs):
        print('Retrieve')
        update_orders.delay(request.user.id, False)
        # update_orders.delay(request.user.id, True)
        return Response({'pending_orders': 'SUCCESS'})

class TransmitOrders(generics.RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    queryset = Stock.objects.all()
    serializer_class = StockSerializer()

    def retrieve(self, request, *args, **kwargs):
        print('Retrieve')
        transmit_orders.delay(request.user.id, False)
        # transmit_orders.delay(request.user.id, True)
        return Response({'SUCCESS': 'SUCCESS'})