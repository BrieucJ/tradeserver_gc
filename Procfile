web: gunicorn backend.wsgi --log-file -
worker: celery -A backend worker --without-gossip --without-mingle --concurrency=4
beat: celery -A backend beat