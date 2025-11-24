from django.urls import path
from . import views

urlpatterns = [
    path('marketplace/tunes/', views.TuneListView.as_view(), name='tune_list'),
    path('marketplace/tunes/<int:pk>/', views.TuneDetailView.as_view(), name='tune_detail'),
    path('tunes/<int:pk>/purchase/', views.PurchaseCreateView.as_view(), name='tune-purchase'),
    path('tunes/<int:tune_id>/comments/', views.TuneCommentListCreateView.as_view(), name='tune-comments'),
    path('tunes/<int:tune_id>/like/', views.TuneLikeToggleView.as_view(), name='tune-like'),
    path('marketplace/my-purchases/', views.MyPurchasesView.as_view(), name='my_purchases'),
    path('marketplace/upload-url/', views.UploadURLView.as_view(), name='upload_url'),
    path('marketplace/tunes/<int:pk>/publish/', views.PublishTuneView.as_view(), name='tune_publish'),
    path('marketplace/analytics/creator/', views.CreatorAnalyticsView.as_view(), name='creator_analytics'),
]
