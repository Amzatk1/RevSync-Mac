from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.encoding import force_bytes, force_str
from .models import UserProfile
from .serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    UserProfileSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
)

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserRegistrationSerializer

class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Get or update the current user's profile.
    """
    serializer_class = UserProfileSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        profile, _ = UserProfile.objects.get_or_create(user=self.request.user)
        return profile

class UserDetailView(generics.RetrieveAPIView):
    """
    Public view of a user.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)
    lookup_field = 'username'

class MeView(generics.RetrieveUpdateAPIView):
    """
    Get or update current user details (first_name, last_name, etc.).
    """
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user

from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

from .models import Follow
from .serializers import FollowSerializer
from drf_spectacular.utils import extend_schema

class FollowView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = FollowSerializer

    @extend_schema(request=FollowSerializer, responses={200: None})
    def post(self, request, username):
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            target_user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            
        if target_user == request.user:
            return Response({'error': 'Cannot follow yourself'}, status=status.HTTP_400_BAD_REQUEST)
            
        action = serializer.validated_data['action'] # 'follow' or 'unfollow'
        
        if action == 'follow':
            Follow.objects.get_or_create(follower=request.user, following=target_user)
            return Response({'status': 'following'})
            
        elif action == 'unfollow':
            Follow.objects.filter(follower=request.user, following=target_user).delete()
            return Response({'status': 'unfollowed'})
            
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)

from .models import UserLegalAcceptance, UserPreference
from .serializers import UserLegalAcceptanceSerializer, UserPreferenceSerializer

class LegalAcceptanceView(generics.CreateAPIView):
    """
    Record user acceptance of a legal document.
    """
    serializer_class = UserLegalAcceptanceSerializer
    permission_classes = (permissions.IsAuthenticated,)

class LegalHistoryView(generics.ListAPIView):
    """
    Get history of accepted documents for the current user.
    """
    serializer_class = UserLegalAcceptanceSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return UserLegalAcceptance.objects.filter(user=self.request.user)

class UserPreferenceView(generics.ListCreateAPIView):
    """
    Get or set user preferences (consents, settings).
    POST with "key" and "value" to update/create.
    """
    serializer_class = UserPreferenceSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return UserPreference.objects.filter(user=self.request.user).order_by('-updated_at')


class PasswordResetRequestView(APIView):
    """
    Request a password reset email/link.

    Always returns success-like messaging so account existence is not disclosed.
    """
    permission_classes = (permissions.AllowAny,)
    serializer_class = PasswordResetRequestSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        user = User.objects.filter(email__iexact=email, is_active=True).first()

        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = settings.PASSWORD_RESET_URL_TEMPLATE.format(uid=uid, token=token)
            subject = 'RevSync password reset'
            body = (
                'A password reset was requested for your RevSync account.\n\n'
                f'Reset your password using this link:\n{reset_url}\n\n'
                'If you did not request this, you can ignore this email.'
            )
            try:
                send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)
            except Exception:
                # In local/dev environments console email may not be configured.
                # Log the reset URL so the flow remains testable without leaking it to the client.
                import logging
                logging.getLogger(__name__).warning("Password reset email delivery failed for %s. Reset URL: %s", user.email, reset_url)

        return Response(
            {'message': 'If an account exists for that email, reset instructions have been sent.'},
            status=status.HTTP_202_ACCEPTED,
        )


class PasswordResetConfirmView(APIView):
    """
    Confirm a password reset using uid + token.
    """
    permission_classes = (permissions.AllowAny,)
    serializer_class = PasswordResetConfirmSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        uid = serializer.validated_data['uid']
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id, is_active=True)
        except Exception:
            raise serializers.ValidationError({'uid': 'Invalid reset identifier.'})

        if not default_token_generator.check_token(user, token):
            raise serializers.ValidationError({'token': 'This reset link is invalid or has expired.'})

        user.set_password(new_password)
        user.save(update_fields=['password'])

        return Response({'message': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)
