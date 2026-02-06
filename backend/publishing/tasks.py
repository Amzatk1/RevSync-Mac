from celery import shared_task
from revsync_backend.celery import app

@shared_task
def dummy_publish_task():
    pass
