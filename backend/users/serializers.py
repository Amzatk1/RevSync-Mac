from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserProfile, AppSession

User = get_user_model()

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['bio', 'country', 'photo_url', 'experience_level', 'riding_style', 'risk_tolerance', 'last_active']
        read_only_fields = ['last_active']

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_verified', 'profile']
        read_only_fields = ['role', 'is_verified']

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'role']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', User.Role.RIDER)
        )
        UserProfile.objects.create(user=user)
        return user

    def to_representation(self, instance):
        serializer = UserSerializer(instance)
        return serializer.data

class AppSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppSession
        fields = '__all__'
        read_only_fields = ['user', 'last_seen', 'refresh_token_hash', 'ip_address', 'is_revoked']

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Create or update AppSession
        request = self.context.get('request')
        if request:
            device_id = request.data.get('device_id')
            platform = request.data.get('platform', 'unknown')
            device_name = request.data.get('device_name', '')
            
            if device_id:
                user = self.user
                session, created = AppSession.objects.update_or_create(
                    user=user,
                    device_id=device_id,
                    defaults={
                        'platform': platform,
                        'device_name': device_name,
                        'ip_address': request.META.get('REMOTE_ADDR'),
                        'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                        'is_revoked': False
                    }
                )
                # Ideally, we'd hash the refresh token and store it, but simplejwt doesn't expose it easily here without extra work.
                # For now, we just track the session existence.
                data['session_id'] = session.id
        
        return data

class FollowSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['follow', 'unfollow'])
