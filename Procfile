web: gunicorn backend.wsgi
worker: REMAP_SIGTERM=SIGQUIT celery -A backend worker -l debug --beat --without-gossip --without-mingle -c 1 -E