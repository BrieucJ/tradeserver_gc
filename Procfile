web: gunicorn backend.wsgi
worker: REMAP_SIGTERM=SIGQUIT celery -A backend worker --beat --without-gossip --without-mingle -E --max-tasks-per-child=1