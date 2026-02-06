from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MarketplaceBrowseView, MarketplaceDetailView, TunerListingViewSet, TunerVersionViewSet,
    PurchaseView, DownloadLinkView
)

router = DefaultRouter()
router.register(r'tuner/listings', TunerListingViewSet, basename='tuner-listings')
router.register(r'tuner/versions', TunerVersionViewSet, basename='tuner-versions')

urlpatterns = [
    # Public Marketplace
    path('marketplace/browse/', MarketplaceBrowseView.as_view(), name='marketplace-browse'),
    path('marketplace/listing/<uuid:pk>/', MarketplaceDetailView.as_view(), name='marketplace-detail'),
    path('marketplace/purchase/<uuid:listing_id>/', PurchaseView.as_view(), name='purchase'),
    path('marketplace/download/<uuid:version_id>/', DownloadLinkView.as_view(), name='download-link'),
    
    # Tuner Management (ViewSets)
    path('', include(router.urls)),
]
