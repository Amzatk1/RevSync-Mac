from celery import shared_task

@shared_task
def dummy_publish_task():
    pass
