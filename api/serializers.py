
from .models import Profile
from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

# class StockSerializer(serializers.HyperlinkedModelSerializer):
#     class Meta:
#         model = Stock
#         fields = ['pk', 'symbol', 'name', 'sector', 'industry']

# class PriceHistorySerializer(serializers.HyperlinkedModelSerializer):
#     class Meta:
#         model = PriceHistory
#         fields = ['pk', 'price_date', 'open', 'high', 'low', 'close', 'volume', 'created_at']

# class TradingModelSerializer(serializers.HyperlinkedModelSerializer):
#     user = serializers.ReadOnlyField(source='user.username')
#     class Meta:
#         model = TradingModel
#         fields = ['pk', 'user', 'name', 'initial_balance', 'end_balance', 'look_back', 'low_sma', 'high_sma', 'max_single_pos', 'trading_interval', 'sma_diff', 'sma_slope',
#         'start_date', 'end_date', 'max_drawdown', 'max_gain', 'true_trading_period', 'average_buy_pct', 'annualized_return', 'SP_return', 'alpha', 'created_at']

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    broker_username = serializers.CharField(source='profile.broker_username', default=None, allow_blank=True, allow_null=True)
    broker_password = serializers.CharField(source='profile.broker_password', default=None, allow_blank=True, allow_null=True, write_only=True)
    email = serializers.CharField(validators=[UniqueValidator(queryset=User.objects.all())], label="email", required=True, allow_blank=False, allow_null=False)

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'password', 'broker_username', 'broker_password']
        extra_kwargs = {'password': {'write_only': True} }

    def create(self, validated_data):
        user = User.objects.create(username=validated_data['username'], email= validated_data['email'])
        user.set_password(validated_data['password'])
        profile = Profile.objects.create(user=user)
        profile.save()
        user.save()
        return user
    
    def update(self, instance, validated_data):
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        profile_data = validated_data.get('profile', None)
        if profile_data is not None:
            profile = Profile.objects.get(user=instance)
            profile.broker_username = profile_data.get('broker_username', profile.broker_username)
            profile.broker_password = profile_data.get('broker_password', profile.broker_password)
            profile.save()
        instance.save()
        return instance