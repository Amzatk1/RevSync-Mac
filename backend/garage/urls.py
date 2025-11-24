from django.urls import path
from .views import (
    VehicleListCreateView, VehicleDetailView,
    EcuBackupListCreateView, FlashJobListCreateView, FlashJobDetailView,
    VehicleDefinitionListView
)

urlpatterns = [
    path('garage/', VehicleListCreateView.as_view(), name='vehicle_list_create'),
    path('garage/<int:pk>/', VehicleDetailView.as_view(), name='vehicle_detail'),
    path('garage/backups/', EcuBackupListCreateView.as_view(), name='backup_list_create'),
    path('garage/flash-jobs/', FlashJobListCreateView.as_view(), name='flash_job_list_create'),
    path('garage/flash-jobs/<int:pk>/', FlashJobDetailView.as_view(), name='flash_job_detail'),
    path('garage/definitions/', VehicleDefinitionListView.as_view(), name='vehicle_definitions'),
]
