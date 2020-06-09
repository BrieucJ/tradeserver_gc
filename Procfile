release: python manage.py migrate
web: gunicorn backend.wsgi --log-file -
worker: celery -A backend worker -B -l INFO