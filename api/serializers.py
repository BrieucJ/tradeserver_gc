
from .models import Profile, Portfolio, Position, Stock, SMABacktest, SMAPosition, PriceHistory, SMAModel, BuyOrder, SellOrder, PortfolioHistory
from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework.validators import UniqueValidator, ValidationError

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = '__all__'

class PriceHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceHistory
        fields = '__all__'

class SMAModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = SMAModel
        fields = '__all__'

class SMABacktestSerializer(serializers.ModelSerializer):
    model = SMAModelSerializer()
    class Meta:
        model = SMABacktest
        fields = '__all__'

class SMAPositionSerializer(serializers.ModelSerializer):
    model = SMAModelSerializer()
    sma_backtest = SMABacktestSerializer()
    class Meta:
        model = SMAPosition
        fields = '__all__'

class StockSerializer(serializers.ModelSerializer):
    last_price = PriceHistorySerializer(read_only=True)
    last_sma_position = SMAPositionSerializer(read_only=True)
    class Meta:
        model = Stock
        fields = ['symbol', 'name', 'sector', 'industry', 'last_price', 'last_sma_position']

class PortfolioHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioHistory
        fields = '__all__'

class PortfolioSerializer(serializers.ModelSerializer):
    first_portfolio_history = PortfolioHistorySerializer(read_only=True)
    last_portfolio_history = PortfolioHistorySerializer(read_only=True)
    class Meta:
        model = Portfolio
        fields = ['portfolio_type', 'currency', 'created_at', 'updated_at', 'first_portfolio_history', 'last_portfolio_history']

class BuyOrderReadSerializer(serializers.ModelSerializer):
    stock = StockSerializer()
    sma_position = SMAPositionSerializer()
    class Meta:
        model = BuyOrder
        fields = '__all__'

class BuyOrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BuyOrder
        fields = '__all__'
    
    def validate(self, data):
        pos = data['portfolio'].position.filter(stock=data['stock'], close_date__isnull=True).first()
        bo = data['portfolio'].buy_order.filter(stock=data['stock'], executed_at__isnull=True, terminated_at__isnull=True).first()
        if pos:
            raise ValidationError('Order is already in portfolio')
        elif bo:
            raise ValidationError('Order is already in pending buy orders')
        else:
            return data

class SellOrderSerializer(serializers.ModelSerializer):
    stock = StockSerializer()
    sma_position = SMAPositionSerializer()
    class Meta:
        model = SellOrder
        fields = '__all__'

class PositionSerializer(serializers.ModelSerializer):
    stock = StockSerializer()
    buy_order = BuyOrderReadSerializer(many=True)
    sell_order = SellOrderSerializer(many=True)
    sma_position = SMAPositionSerializer(read_only=True)
    class Meta:
        model = Position
        fields = ['id', 'stock', 'portfolio', 'open_date', 'open_rate', 'num_of_shares', 'total_investment', 'stop_loss_rate', 'take_profit_rate',
                   'current_rate', 'updated_at', 'created_at', 'close_rate', 'close_date', 'buy_order', 'sell_order', 'sma_position']

class UserSerializer(serializers.ModelSerializer):
    broker_username = serializers.CharField(source='profile.broker_username', default=None, allow_blank=True, allow_null=True)
    broker_password = serializers.CharField(source='profile.broker_password', default=None, allow_blank=True, allow_null=True, write_only=True)
    demo_live = serializers.CharField(source='profile.demo_live', default=None, allow_blank=True, allow_null=True)
    real_live = serializers.CharField(source='profile.real_live', default=None, allow_blank=True, allow_null=True)

    email = serializers.CharField(validators=[UniqueValidator(queryset=User.objects.all())], label="email", required=True, allow_blank=False, allow_null=False)

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'password', 'broker_username', 'broker_password', 'demo_live', 'real_live']
        extra_kwargs = {'password': {'write_only': True},  'broker_password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create(username=validated_data['username'], email=validated_data['email'])
        user.set_password(validated_data['password'])
        profile = Profile.objects.create(user=user)
        profile.save()
        user.save()
        return user
    
    def update(self, instance, validated_data):
        print('UPDATE UserSerializer')
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        profile_data = validated_data.get('profile', None)
        if profile_data is not None:
            print(profile_data)
            profile = Profile.objects.get(user=instance)
            profile.broker_username = profile_data.get('broker_username', profile.broker_username)
            profile.broker_password = profile_data.get('broker_password', profile.broker_password)
            profile.demo_live = profile_data.get('demo_live', profile.demo_live)
            profile.real_live = profile_data.get('real_live', profile.real_live)
            profile.save()
        instance.save()
        return instance