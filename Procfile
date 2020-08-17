web: gunicorn backend.wsgi
worker: REMAP_SIGTERM=SIGQUIT celery -A backend worker --beat --without-gossip --without-mingle --concurrency=1 --max-tasks-per-child=1 -E