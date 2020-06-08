release: python manage.py migrate
web: gunicorn backend.wsgi --log-file -
worker: python manage.py celery worker -B -l info