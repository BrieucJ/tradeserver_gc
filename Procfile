release: chmod u+x release.sh && ./release.sh
web: gunicorn backend.wsgi --log-file -
worker: celery -A backend worker -B -l INFO