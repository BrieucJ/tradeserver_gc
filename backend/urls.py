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
# from .views import FrontendAppView


urlpatterns = [
    path('admin/', admin.site.urls, name='admin'),
    path('api/token-auth/', views.CustomAuthToken.as_view()),
    path('api/user/', views.UserView.as_view(), name='user'),
    path('api/portfolio/', views.PortfolioView.as_view(), name='portfolio'),
    path('api/home/', views.Home.as_view(), name='home'),
    # path('api/retrieve_portfolio/', views.RetrievePortfolio.as_view(), name='retrieve_portfolio'),
    path('api/retrieve_order/', views.RetrieveOrder.as_view(), name='retrieve_order'),
    path('api/retrieve_history/', views.RetrieveHistory.as_view(), name='retrieve_history'),
    path('api/position_details/', views.PositionDetails.as_view(), name='position_details'),
    path('api/retrieve_market/', views.RetrieveMarket.as_view(), name='retrieve_market'),
    re_path('', index),
    # re_path(r'^', FrontendAppView.as_view())
    # re_path(r'^(?P<path>.*)/$', index),
    # path('', index),
]
