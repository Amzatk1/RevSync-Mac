default_app_config = "publishing.apps.PublishingConfig"

# Celery is optional in local/dev environments where workers are not installed.
try:
    from .tasks import app as celery_app  # noqa: F401
except ModuleNotFoundError:
    celery_app = None
