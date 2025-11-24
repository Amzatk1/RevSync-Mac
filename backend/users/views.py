from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from .models import UserProfile
from .serializers import UserSerializer, UserRegistrationSerializer, UserProfileSerializer

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
        return self.request.user.profile

class UserDetailView(generics.RetrieveAPIView):
    """
    Public view of a user.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)
    lookup_field = 'username'

class MeView(generics.RetrieveAPIView):
    """
    Get current user details.
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
