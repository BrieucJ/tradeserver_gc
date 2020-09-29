
from .models import Profile, Portfolio, Position, Stock, PriceHistory, BuyOrder, SellOrder, PortfolioHistory, NeuralNetwork, Prediction
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

class PredictionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prediction
        fields = '__all__'

class StockSerializer(serializers.ModelSerializer):
    last_price = PriceHistorySerializer(read_only=True)
    last_real_pred = serializers.SerializerMethodField('get_last_real_pred')
    last_demo_pred = serializers.SerializerMethodField('get_last_demo_pred')

    def get_last_real_pred(self, obj):
        if self.context.get('user_id'):
            prediction = obj.prediction.filter(price_date=obj.last_price.price_date, neural_network=User.objects.get(id=self.context['user_id']).portfolio.get(portfolio_type=True).neural_network).first()
            return PredictionSerializer(prediction, read_only=True).data
        else:
            return []
        
    def get_last_demo_pred(self, obj):
        if self.context.get('user_id'):
            prediction = obj.prediction.filter(price_date=obj.last_price.price_date, neural_network=User.objects.get(id=self.context['user_id']).portfolio.get(portfolio_type=False).neural_network).first()
            return PredictionSerializer(prediction, read_only=True).data
        else:
            return []

    class Meta:
        model = Stock
        fields = ['id', 'symbol', 'name', 'sector', 'industry', 'last_price', 'last_real_pred', 'last_demo_pred']

class PortfolioHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioHistory
        fields = '__all__'

class NeuralNetworkSerializer(serializers.ModelSerializer):
    class Meta:
        model = NeuralNetwork
        fields = '__all__'

class PortfolioSerializer(serializers.ModelSerializer):
    first_portfolio_history = PortfolioHistorySerializer(read_only=True)
    last_portfolio_history = PortfolioHistorySerializer(read_only=True)
    history = PortfolioHistorySerializer(read_only=True, many=True)
    neural_network = NeuralNetworkSerializer(read_only=True)
    class Meta:
        model = Portfolio
        fields = ['portfolio_type', 'currency', 'created_at', 'updated_at', 'first_portfolio_history', 'last_portfolio_history', 'active', 'neural_network', 'history', 'stop_loss', 'take_profit', 'pos_size']
    
    def update(self, instance, validated_data):
        portfolio_type = validated_data.get('portfolio_type', None)
        if portfolio_type != None:
            portfolio = instance.portfolio.get(portfolio_type=portfolio_type)
            portfolio.active = validated_data.get('active', portfolio.active)
            portfolio.stop_loss = validated_data.get('stop_loss', portfolio.stop_loss)
            portfolio.take_profit = validated_data.get('take_profit', portfolio.take_profit)
            portfolio.save()
        return portfolio

class BuyOrderReadSerializer(serializers.ModelSerializer):
    stock = StockSerializer()
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
    class Meta:
        model = SellOrder
        fields = '__all__'

class PositionSerializer(serializers.ModelSerializer):
    stock = StockSerializer()
    buy_order = BuyOrderReadSerializer(many=True)
    sell_order = SellOrderSerializer(many=True)
    class Meta:
        model = Position
        fields = ['id', 'stock', 'portfolio', 'open_date', 'open_rate', 'num_of_shares', 'total_investment', 'stop_loss_rate', 'take_profit_rate',
                   'current_rate', 'updated_at', 'created_at', 'close_rate', 'close_date', 'buy_order', 'sell_order']

class UserSerializer(serializers.ModelSerializer):
    broker_username = serializers.CharField(source='profile.broker_username', default=None, allow_blank=True, allow_null=True)
    broker_password = serializers.CharField(source='profile.broker_password', default=None, allow_blank=True, allow_null=True, write_only=True)
    email = serializers.CharField(validators=[UniqueValidator(queryset=User.objects.all())], label="email", required=True, allow_blank=False, allow_null=False)

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'password', 'broker_username', 'broker_password']
        extra_kwargs = {'password': {'write_only': True},  'broker_password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create(username=validated_data['username'], email=validated_data['email'])
        user.set_password(validated_data['password'])
        profile = Profile.objects.create(user=user)
        profile.save()
        user.save()
        return user
    
    def update(self, instance, validated_data):
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        profile_data = validated_data.get('profile', None)
        if profile_data != None:
            profile = Profile.objects.get(user=instance)
            profile.broker_username = profile_data.get('broker_username', profile.broker_username)
            profile.broker_password = profile_data.get('broker_password', profile.broker_password)
            profile.save()
        instance.save()
        return instance