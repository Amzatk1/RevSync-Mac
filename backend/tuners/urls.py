from django.urls import path
from .views import TunerListView, TunerDetailView, TunerApplyView, TunerDocumentUploadView

urlpatterns = [
    path('tuners/', TunerListView.as_view(), name='tuner_list'),
    path('tuners/apply/', TunerApplyView.as_view(), name='tuner_apply'),
    path('tuners/<int:pk>/', TunerDetailView.as_view(), name='tuner_detail'),
    path('tuners/documents/', TunerDocumentUploadView.as_view(), name='tuner_document_upload'),
]
