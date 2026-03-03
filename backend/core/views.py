from django.db import connection
from django.db.utils import Error as DatabaseError
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckView(APIView):
    """
    Lightweight runtime health endpoint used by ops checks and CI smoke tests.
    """

    permission_classes = (permissions.AllowAny,)
    authentication_classes: tuple = ()
    throttle_classes: tuple = ()

    def get(self, request):
        db_status = "ok"
        overall_status = "ok"
        status_code = status.HTTP_200_OK
        db_error = None

        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        except DatabaseError as exc:
            db_status = "error"
            db_error = str(exc)
            overall_status = "degraded"
            status_code = status.HTTP_503_SERVICE_UNAVAILABLE

        payload = {
            "status": overall_status,
            "service": "revsync-backend",
            "timestamp": timezone.now().isoformat(),
            "checks": {
                "database": db_status,
            },
        }
        if db_error:
            payload["error"] = db_error

        return Response(payload, status=status_code)
