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
from django.conf.urls import url
from django.urls import include, path, re_path
from rest_framework import routers
from api import views
from .views import index

# router = routers.DefaultRouter()
# router.register(r'user', views.UserViewSet, basename='user',)
# router.register(r'stock', views.StockViewSet, basename='stock',)
# router.register(r'pricehistory', views.PriceHistoryViewSet, basename='pricehistory')
# router.register(r'tradingmodel', views.TradingModelViewSet, basename='tradingmodel')


urlpatterns = [
    path('admin/', admin.site.urls, name='admin'),
    path('api/token-auth/', views.CustomAuthToken.as_view()),
    path('api/user/', views.UserView.as_view(), name='user'),
    path('api/retrieve_portfolio/', views.RetrievePortfolio.as_view(), name='retrieve_portfolio'),
    path('api/retrieve_market/', views.RetrieveMarket.as_view(), name='retrieve_market'),
    path('api/retrieve_model/', views.RetrieveModel.as_view(), name='retrieve_model'),
    path('api/update_sma_positions/', views.UpdateSMAPosition.as_view(), name='update_sma_positions'),
    path('api/update_stocks/', views.UpdateStocks.as_view(), name='update_stocks'),
    path('api/update_portfolio/', views.UpdatePortfolio.as_view(), name='update_portfolio'),
    path('api/update_orders/', views.UpdateOrders.as_view(), name='update_orders'),
    path('api/transmit_orders/', views.TransmitOrders.as_view(), name='transmit_orders'),
    re_path(r'^(?P<path>.*)/$', index),
    path('', index),
]
