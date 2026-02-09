from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MarketplaceBrowseView, MarketplaceDetailView,
    TunerListingViewSet, TunerVersionViewSet,
    PurchaseCheckView, MyEntitlementsView, DownloadLinkView,
    VersionStatusCheckView,
    AdminApproveVersionView, AdminPublishVersionView,
    AdminSuspendVersionView, AdminUnsuspendVersionView,
)

router = DefaultRouter()
router.register(r'tuner/listings', TunerListingViewSet, basename='tuner-listings')
router.register(r'tuner/versions', TunerVersionViewSet, basename='tuner-versions')

urlpatterns = [
    # Public Marketplace
    path('marketplace/browse/', MarketplaceBrowseView.as_view(), name='marketplace-browse'),
    path('marketplace/listing/<uuid:pk>/', MarketplaceDetailView.as_view(), name='marketplace-detail'),

    # Purchase / Entitlements
    path('marketplace/purchase-check/<uuid:listing_id>/', PurchaseCheckView.as_view(), name='purchase-check'),
    path('marketplace/entitlements/', MyEntitlementsView.as_view(), name='my-entitlements'),

    # Download
    path('marketplace/download/<uuid:version_id>/', DownloadLinkView.as_view(), name='download-link'),

    # Pre-Flash Status Gate
    path('marketplace/version-status/<uuid:version_id>/', VersionStatusCheckView.as_view(), name='version-status'),

    # Admin Actions
    path('admin-api/version/<uuid:version_id>/approve/', AdminApproveVersionView.as_view(), name='admin-approve'),
    path('admin-api/version/<uuid:version_id>/publish/', AdminPublishVersionView.as_view(), name='admin-publish'),
    path('admin-api/version/<uuid:version_id>/suspend/', AdminSuspendVersionView.as_view(), name='admin-suspend'),
    path('admin-api/version/<uuid:version_id>/unsuspend/', AdminUnsuspendVersionView.as_view(), name='admin-unsuspend'),

    # Tuner Management (ViewSets with nested actions)
    path('', include(router.urls)),
]
