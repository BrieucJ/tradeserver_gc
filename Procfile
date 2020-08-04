web: gunicorn backend.wsgi --log-file -
worker: REMAP_SIGTERM=SIGQUIT celery -A backend worker --beat --without-gossip --without-mingle --concurrency=4 -E