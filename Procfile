web: gunicorn backend.wsgi --log-file -
worker: REMAP_SIGTERM=SIGQUIT celery -A backend worker --beat --without-gossip --without-mingle --concurrency=1 -E --max-tasks-per-child=1