web: gunicorn backend.wsgi --log-file -
worker: REMAP_SIGTERM=SIGQUIT celery -A -E backend worker --beat --without-gossip --without-mingle --concurrency=4 --max-tasks-per-child=1