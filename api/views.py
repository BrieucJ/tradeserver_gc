
from rest_framework import viewsets, mixins, generics, permissions, status
from rest_framework.permissions import AllowAny, IsAuthenticated
import datetime
# from rest_framework.decorators import api_view, authentication_classes
import pandas as pd
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from django.db.models import Min, Max
from django.contrib.auth.models import User
from django.http import Http404, HttpResponse, HttpResponseRedirect
from .permissions import IsAuthenticatedOrWriteOnly
from .serializers import ProfileSerializer, UserSerializer, PortfolioSerializer, PositionSerializer, StockSerializer, SMABacktestSerializer, SMAPositionSerializer, BuyOrderReadSerializer, SellOrderSerializer, PortfolioHistorySerializer, PriceHistorySerializer
from .trade.etoro import API
from .tasks  import update_portfolio, update_sma_positions, update_price_history, transmit_orders, update_orders
from .models import Profile, Portfolio, Stock, SMABacktest, SMAPosition, PriceHistory, PortfolioHistory, Position, BuyOrder

class Home(generics.RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = PortfolioSerializer
    queryset = Portfolio.objects.all()

    def retrieve(self, request, *args, **kwargs):
        user = request.user
        #demo
        p_demo = user.portfolio.filter(portfolio_type=False).first()
        p_real = user.portfolio.filter(portfolio_type=True).first()

        if p_demo != None:
            dates = [ph.created_at.date() for ph in p_demo.portfolio_history.order_by('created_at__date').distinct('created_at__date')]
            portfolio_history_demo = [p_demo.portfolio_history.filter(created_at__date=d).latest('created_at') for d in dates]

            current_pos_demo = PositionSerializer(p_demo.position.filter(close_date__isnull=True).order_by('-total_investment'), many=True).data 
            pending_buy_orders_demo = BuyOrderReadSerializer(p_demo.buy_order.filter(executed_at__isnull=True, terminated_at__isnull=True).order_by('-total_investment'), many=True).data 
            pending_sell_orders_demo = PositionSerializer(p_demo.position.filter(close_date__isnull=True, sell_order__isnull=False, sell_order__executed_at__isnull=True).order_by('-total_investment'), many=True).data 
        else:
            pending_buy_orders_demo = [] 
            pending_sell_orders_demo = []
            current_pos_demo = []
            portfolio_history_demo= []
        
        if p_real != None:
            dates = [ph.created_at.date() for ph in p_real.portfolio_history.order_by('created_at__date').distinct('created_at__date')]
            portfolio_history_real = [p_real.portfolio_history.filter(created_at__date=d).latest('created_at') for d in dates]
            current_pos_real = PositionSerializer(p_real.position.filter(close_date__isnull=True).order_by('-total_investment'), many=True).data
            pending_buy_orders_real = BuyOrderReadSerializer(p_real.buy_order.filter(executed_at__isnull=True, terminated_at__isnull=True).order_by('-total_investment'), many=True).data 
            pending_sell_orders_real = PositionSerializer(p_real.position.filter(close_date__isnull=True, sell_order__isnull=False, sell_order__executed_at__isnull=True).order_by('-total_investment'), many=True).data 
        else:
            pending_buy_orders_real = [] 
            pending_sell_orders_real = []
            current_pos_real = []
            portfolio_history_real = []

        return Response({'p_demo': {
                            'portfolio': PortfolioSerializer(p_demo).data,
                            'current_positions': current_pos_demo,
                            'p_history': PortfolioHistorySerializer(portfolio_history_demo, many=True).data,
                            'pending_buy_orders': pending_buy_orders_demo,
                            'pending_sell_orders': pending_sell_orders_demo,
                            },
                        'p_real': {
                            'portfolio': PortfolioSerializer(p_real).data, 
                            'current_positions': current_pos_real, 
                            'p_history': PortfolioHistorySerializer(portfolio_history_real, many=True).data,
                            'pending_buy_orders': pending_buy_orders_real,
                            'pending_sell_orders': pending_sell_orders_real,
                            }
                        }, status=status.HTTP_200_OK)

class PositionDetails(generics.RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = PositionSerializer
    queryset = Position.objects.all()

    def retrieve(self, request, *args, **kwargs):
        print('retrieve PositionDetails')
        user = request.user
        pos_id = request.GET['id']
        pos = Position.objects.get(id=pos_id)
        delta_days = 40
        if pos.open_date == None:
            start_date = (pos.created_at - datetime.timedelta(days=delta_days)).date()
        else:
            start_date = (pos.open_date - datetime.timedelta(days=delta_days)).date()

        #price_history
        close_prices = [item.close for item in pos.stock.price_history.all()]
        dates = [item.price_date for item in pos.stock.price_history.all()]        
        df = pd.DataFrame({'date': dates, 'close': close_prices})
        df = df.iloc[::-1] #old to new order
        if pos.buy_order.first() == None:
            df['low_sma'] = df['close']
            df['high_sma'] = df['close']
        else:
            df['low_sma'] = df['close'].rolling(pos.buy_order.first().sma_position.model.low_sma).mean()
            df['high_sma'] = df['close'].rolling(pos.buy_order.first().sma_position.model.high_sma).mean()
        df.dropna(inplace=True)
        df['date'] = pd.to_datetime(df['date'])
        df.set_index('date', inplace=True)

        if pos.close_date == None:
            df = df[start_date : datetime.datetime.today().date()]
        else:
            if (pos.close_date + datetime.timedelta(days=delta_days)).date() > datetime.datetime.today().date():
                df = df[start_date : datetime.datetime.today().date()]
            else:
                df = df[start_date : (pos.close_date + datetime.timedelta(days=delta_days)).date()]

        df['date'] = df.index

        return Response({'position': PositionSerializer(pos).data, 'price_df': df}, status=status.HTTP_200_OK)

class BuyOrderDetails(generics.RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = BuyOrderReadSerializer
    queryset = BuyOrder.objects.all()

    def retrieve(self, request, *args, **kwargs):
        print('retrieve BuyOrderDetails')
        user = request.user
        pos_id = request.GET['id']
        bo = BuyOrder.objects.get(id=pos_id)
        delta_days = 40
        start_date = (bo.created_at - datetime.timedelta(days=delta_days)).date()

        #price_history
        close_prices = [item.close for item in bo.stock.price_history.all()]
        dates = [item.price_date for item in bo.stock.price_history.all()]        
        df = pd.DataFrame({'date': dates, 'close': close_prices})
        df = df.iloc[::-1] #old to new order
        df['low_sma'] = df['close'].rolling(bo.sma_position.model.low_sma).mean()
        df['high_sma'] = df['close'].rolling(bo.sma_position.model.high_sma).mean()
        df.dropna(inplace=True)
        df['date'] = pd.to_datetime(df['date'])
        df.set_index('date', inplace=True)
        df = df[start_date : datetime.datetime.today().date()]
        df['date'] = df.index

        sma_positions = SMAPosition.objects.filter(price_date__range=[start_date, datetime.datetime.today().date()], stock=bo.stock, model=bo.sma_position.model)

        return Response({'buy_order': BuyOrderReadSerializer(bo).data, 'price_df': df, 'sma_positions': SMAPositionSerializer(sma_positions, many=True).data}, status=status.HTTP_200_OK)

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
        else:
            print(serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RetrievePortfolio(generics.RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = PortfolioSerializer
    queryset = Portfolio.objects.all()

    def retrieve(self, request, *args, **kwargs):
        user = request.user
        #demo
        p_demo = user.portfolio.filter(portfolio_type=False).first()
        if p_demo == None:
            current_pos_demo = []
        else:
            current_pos_demo = PositionSerializer(p_demo.position.filter(close_date__isnull=True), many=True).data 
        
        #real
        p_real = user.portfolio.filter(portfolio_type=True).first()
        if p_real == None:
            current_pos_real = []
        else:
            current_pos_real = PositionSerializer(p_real.position.filter(close_date__isnull=True), many=True).data 

        return Response({'p_demo': {'portfolio': PortfolioSerializer(p_demo).data, 'current_positions': current_pos_demo}, 'p_real': {'portfolio': PortfolioSerializer(p_real).data, 'current_positions': current_pos_real}}, status=status.HTTP_200_OK)

class RetrieveOrder(generics.RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = PortfolioSerializer
    queryset = Portfolio.objects.all()

    def retrieve(self, request, *args, **kwargs):
        user = request.user
        #demo
        p_demo = user.portfolio.filter(portfolio_type=False).first()
        p_real = user.portfolio.filter(portfolio_type=True).first()
        
        if p_demo == None:
            orders_demo = []
        else:
            temp_demo = [BuyOrderReadSerializer(p_demo.buy_order.all(), many=True).data, SellOrderSerializer(p_demo.sell_order.all(), many=True).data]
            temp_demo = [order for type_order in temp_demo for order in type_order]
            temp_demo.sort(key=lambda x: x['created_at'], reverse=True)
            orders_demo = []
            for obj in temp_demo:
                if Position.objects.filter(id=obj['position']).first() == None:
                    order =  {'order': obj, 'position': None}
                else:
                    order =  {'order': obj, 'position': PositionSerializer(Position.objects.get(id=obj['position'])).data}
                orders_demo.append(order)

        #real
        if p_real == None:
            orders_real = []
        else:
            temp_real = [BuyOrderReadSerializer(p_real.buy_order.all(), many=True).data, SellOrderSerializer(p_real.sell_order.all(), many=True).data]
            temp_real = [order for type_order in temp_real for order in type_order]
            temp_real.sort(key=lambda x: x['created_at'], reverse=True)
            orders_real = []
            for obj in temp_real:
                if Position.objects.filter(id=obj['position']).first() == None:
                    order =  {'order': obj, 'position': None}
                else:
                    order =  {'order': obj, 'position': PositionSerializer(Position.objects.get(id=obj['position'])).data}
                orders_real.append(order)

        return Response({'p_demo': {'orders': orders_demo}, 'p_real': {'orders': orders_real}}, status=status.HTTP_200_OK)

class RetrieveHistory(generics.RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = PortfolioSerializer
    queryset = Portfolio.objects.all()

    def retrieve(self, request, *args, **kwargs):
        user = request.user
        #demo
        p_demo = user.portfolio.filter(portfolio_type=False).first()
        if p_demo == None:
            history_demo = []
        else:
            history_demo = PositionSerializer(p_demo.position.filter(close_date__isnull=False), many=True).data 
        
        #real
        p_real = user.portfolio.filter(portfolio_type=True).first()
        if p_real == None:
            history_real = []
        else:
            history_real = PositionSerializer(p_real.position.filter(close_date__isnull=False), many=True).data 

        return Response({'p_demo': {'history': history_demo }, 'p_real': {'history': history_real }}, status=status.HTTP_200_OK)

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


class UpdatePriceHistory(generics.RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    queryset = SMABacktest.objects.all()
    serializer_class = SMABacktestSerializer()

    def retrieve(self, request, *args, **kwargs):
        print('Retrieve')
        update_price_history.delay()
        return Response({'updating': True})

class UpdatePortfolio(generics.RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    queryset = Stock.objects.all()
    serializer_class = StockSerializer()

    def retrieve(self, request, *args, **kwargs):
        print('Retrieve')
        update_portfolio.delay(request.user.id)
        return Response({'updating': True})

class UpdateOrders(generics.RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    queryset = Stock.objects.all()
    serializer_class = StockSerializer()

    def retrieve(self, request, *args, **kwargs):
        print('Retrieve')
        update_orders.delay()
        return Response({'updating': True})

class TransmitOrders(generics.RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    queryset = Stock.objects.all()
    serializer_class = StockSerializer()

    def retrieve(self, request, *args, **kwargs):
        print('Retrieve')
        transmit_orders.delay()
        return Response({'updating': True})