#!/bin/bash
python manage.py makemigrations
python manage.py makemigrations api
python manage.py migrate
python manage.py migrate api