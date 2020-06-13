"""backend URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path, re_path
from rest_framework import routers
from rest_framework_simplejwt.views import (TokenObtainPairView, TokenRefreshView, TokenVerifyView)
from api import views
from .views import index

router = routers.DefaultRouter()
router.register(r'stock', views.StockViewSet, basename='stock',)
router.register(r'pricehistory', views.PriceHistoryViewSet, basename='pricehistory')
router.register(r'tradingmodel', views.TradingModelViewSet, basename='tradingmodel')

urlpatterns = [
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('admin/', admin.site.urls, name='admin'),
    path('api/', include(router.urls), name='api'),
    path('api/users/<int:pk>/', views.UserDetail.as_view()),
    path('api/current_user/', views.current_user),
    path('api/backtest/', views.backtest),
    re_path(r'^(?P<path>.*)/$', index),
    path('', index),
]

