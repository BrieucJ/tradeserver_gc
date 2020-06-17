
from rest_framework import viewsets, mixins, generics, permissions, status
from rest_framework.permissions import AllowAny, IsAuthenticated
# from rest_framework.decorators import api_view, authentication_classes
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response

from django.contrib.auth.models import User
from django.http import Http404, HttpResponse, HttpResponseRedirect
from .permissions import IsAuthenticatedOrWriteOnly
from .serializers import ProfileSerializer, UserSerializer
from .trade.etoro import API
from .tasks  import update_portfolio_task
from .models import Profile

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
        print('Create user')
        print(request.data)
        serializer = UserSerializer(data=request.data)
        print('serializer')
        print(serializer.data)
        if serializer.is_valid():
            print('serializer valid')
            serializer.save()
            print('serializer saved')
            print(serializer.data['username'])
            user = User.objects.get(username=serializer.data['username'])
            print(f'user {user}')
            token, created = Token.objects.get_or_create(user=user)
            print(token.key)
            print(serializer.data)
            return Response({'user': serializer.data, 'token': token.key}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def put(self, request, format=None):
        serializer = self.serializer_class(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'user': serializer.data}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UpdatePortfolio(generics.RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def retrieve(self, request, *args, **kwargs):
        print('Retrieve')
        profile = Profile.objects.get(user=request.user)
        update_portfolio_task.delay(profile.broker_username, profile.broker_password)
        return Response('Connected', status=status.HTTP_200_OK)
    
    