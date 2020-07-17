
from rest_framework import viewsets, mixins, generics, permissions, status
from rest_framework.permissions import AllowAny, IsAuthenticated
# from rest_framework.decorators import api_view, authentication_classes
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response

from django.contrib.auth.models import User
from django.http import Http404, HttpResponse, HttpResponseRedirect
from .permissions import IsAuthenticatedOrWriteOnly
from .serializers import ProfileSerializer, UserSerializer, PortfolioSerializer, PositionSerializer
from .trade.etoro import API
from .tasks  import update_portfolio_task, create_sma_positions, update_price_history, transmit_orders, portfolio_rebalancing
from .models import Profile, Portfolio

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
            pos_demo = p_demo.positions.all()
        except Portfolio.DoesNotExist:
            p_demo = None
            pos_demo = None
        
        try:
            p_real = Portfolio.objects.filter(user=u, portfolio_type=True).latest('date')
            pos_real = p_real.positions.all()
        except Portfolio.DoesNotExist:
            p_real = None
            pos_real = None
        
        return Response({'p_demo': {'portfolio': PortfolioSerializer(p_demo).data, 'positions': PositionSerializer(pos_demo, many=True).data}, 'p_real': {'portfolio': PortfolioSerializer(p_real).data, 'positions': PositionSerializer(pos_real, many=True).data}}, status=status.HTTP_200_OK)

class UpdatePortfolio(generics.RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def retrieve(self, request, *args, **kwargs):
        print('Retrieve')
        #transmit_orders.delay()
        #portfolio_rebalancing.delay(request.user.id, False)
        #update_price_history.delay()
        update_portfolio_task.delay()
        return Response('Connected', status=status.HTTP_200_OK)
    
    