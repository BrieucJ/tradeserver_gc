web: gunicorn backend.wsgi
worker: REMAP_SIGTERM=SIGQUIT celery -A backend worker -l info --beat --without-gossip --without-mingle -c 1