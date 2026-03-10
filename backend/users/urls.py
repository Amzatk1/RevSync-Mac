from django.urls import path
from .views import RegisterView, UserProfileView, UserDetailView, MeView, CustomTokenObtainPairView, FollowView, LegalAcceptanceView, LegalHistoryView, UserPreferenceView, PasswordResetRequestView, PasswordResetConfirmView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/password-reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('auth/password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('users/me/', MeView.as_view(), name='user_me'),
    path('profile/me/', UserProfileView.as_view(), name='profile_me'),
    path('users/<str:username>/', UserDetailView.as_view(), name='user_detail'),
    path('users/<str:username>/follow/', FollowView.as_view(), name='user_follow'),
    path('legal/accept/', LegalAcceptanceView.as_view(), name='legal_accept'),
    path('legal/history/', LegalHistoryView.as_view(), name='legal_history'),
    path('preferences/', UserPreferenceView.as_view(), name='user_preferences'),
]
