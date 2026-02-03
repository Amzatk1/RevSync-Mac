from django.urls import path
from .views import (
    ApplyTunerView, TunerApplicationStatusView, 
    AdminTunerApplicationListView, AdminApproveTunerView
)

urlpatterns = [
    # Application Flow
    path('apply/', ApplyTunerView.as_view(), name='apply-tuner'),
    path('apply/status/', TunerApplicationStatusView.as_view(), name='tuner-app-status'),
    
    # Admin Flow
    path('admin/applications/', AdminTunerApplicationListView.as_view(), name='admin-tuner-apps'),
    path('admin/applications/<int:pk>/action/', AdminApproveTunerView.as_view(), name='admin-tuner-action'),
]
