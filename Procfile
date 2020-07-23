web: gunicorn backend.wsgi --log-file -
worker: celery -A backend worker --beat --without-gossip --without-mingle