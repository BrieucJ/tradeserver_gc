release: chmod u+x release.sh && ./release.sh
web: gunicorn backend.wsgi --log-file -
worker: REMAP_SIGTERM=SIGQUIT celery -A backend worker -l info

