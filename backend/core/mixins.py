from django.utils.dateparse import parse_datetime
from rest_framework.exceptions import ValidationError

class LastModifiedSinceMixin:
    """
    Mixin to filter querysets by 'since' query parameter (ISO 8601 timestamp).
    Used for efficient delta sync.
    """
    def get_queryset(self):
        queryset = super().get_queryset()
        since_param = self.request.query_params.get('since')
        
        if since_param:
            since_dt = parse_datetime(since_param)
            if since_dt:
                # Return all items updated after 'since', including deleted ones
                queryset = queryset.filter(updated_at__gt=since_dt)
        else:
            # Initial sync: Only return active items
            # Check if model has deleted_at field
            if hasattr(queryset.model, 'deleted_at'):
                queryset = queryset.filter(deleted_at__isnull=True)
            
        return queryset
