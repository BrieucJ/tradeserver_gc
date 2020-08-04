"""
Django settings for backend project.

Generated by 'django-admin startproject' using Django 3.0.6.

For more information on this file, see
https://docs.djangoproject.com/en/3.0/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/3.0/ref/settings/
"""

import dj_database_url
from dotenv import load_dotenv
import datetime
import os
load_dotenv()
# Build paths inside the project like this: os.path.join(BASE_DIR, ...)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRODUCTION = os.environ['PRODUCTION'] == 'True'

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/3.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = '3j98+c=+v5^pu&6na&m%t@&&nf7rsu1uhp_lu_75$&lb#30h1y'

# SECURITY WARNING: don't run with debug turned on in production!
if PRODUCTION: 
    DEBUG = False
else:
    DEBUG = True

CORS_ORIGIN_WHITELIST = ['http://127.0.0.1:8000', 'http://localhost:8000', 'https://127.0.0.1:8000', 'https://localhost:8000', 'http://localhost:3000']

ALLOWED_HOSTS = []

# Application definition
INSTALLED_APPS = [
    'corsheaders',
    'rest_framework',
    'rest_framework.authtoken',
    'api',
    'django.contrib.sites',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'whitenoise.runserver_nostatic',
    'django.contrib.staticfiles',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]


REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': (
        # 'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.TokenAuthentication',
    )
}

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'build')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

# Database
# https://docs.djangoproject.com/en/3.0/ref/settings/#databases

# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.postgresql',
#         'NAME': 'django',
#         'USER': 'django',
#         'PASSWORD': 'somepassword',
#         'HOST': '127.0.0.1',
#         'PORT': '5432',
#     }
# }


DATABASES = {}
DATABASES['default'] = dj_database_url.config(conn_max_age=600)

# Password validation
# https://docs.djangoproject.com/en/3.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/3.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/3.0/howto/static-files/

STATIC_URL = '/static/'

# Place static in the same location as webpack build files
STATIC_ROOT = os.path.join(BASE_DIR, 'build', 'static')

STATICFILES_DIRS = [STATIC_ROOT]
# If you want to serve user uploaded files add these settings
# MEDIA_URL = '/media/'
# MEDIA_ROOT = os.path.join(BASE_DIR, 'build', 'media')
# print(MEDIA_ROOT)

STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

import django_heroku
# Configure app for Heroku deployment
django_heroku.settings(locals())

# override DATABASE_URL set by django_heroku because it forces SSL mode locally
ssl_require = PRODUCTION
locals()['DATABASES']['default'] = dj_database_url.config(conn_max_age=django_heroku.MAX_CONN_AGE, ssl_require=ssl_require)

#CELERY
CELERY_TASK_SERIALIZER='json'
worker_max_tasks_per_child = 1
# CELERYD_WORKER_MAX_MEMORY_PER_CHILD = 500000
CELERY_TIMEZONE = 'Europe/Paris'
# BROKER_POOL_LIMIT = 3
if PRODUCTION:
    CELERY_BROKER_URL =  os.environ['REDIS_URL']
    # CELERY_RESULT_BACKEND = os.environ['REDIS_URL']
else: 
    CELERY_BROKER_URL =  'redis://'
    # CELERY_RESULT_BACKEND = 'redis://'