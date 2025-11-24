from django.urls import path
from .views import SafetyAnalysisView, SafetyReportListView

urlpatterns = [
    path('safety/analyze/', SafetyAnalysisView.as_view(), name='safety_analyze'),
    path('safety/reports/', SafetyReportListView.as_view(), name='safety_reports'),
]
