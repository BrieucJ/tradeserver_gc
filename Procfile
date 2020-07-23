web: gunicorn backend.wsgi --log-file -
worker: celery -A backend worker -l info -c 1 --without-gossip --without-mingle --without-heartbeat