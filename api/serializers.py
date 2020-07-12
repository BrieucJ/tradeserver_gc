
from .models import Profile, Portfolio, Position, Stock
from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = '__all__'

class StockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stock
        fields = '__all__'

class PositionSerializer(serializers.ModelSerializer):
    stock = StockSerializer()
    class Meta:
        model = Position
        fields = '__all__'

class PortfolioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Portfolio
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