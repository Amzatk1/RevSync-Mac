from rest_framework import serializers
from .models import TunerProfile, TunerCertification, TunerReview
from users.serializers import UserSerializer

class TunerCertificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TunerCertification
        fields = '__all__'
        read_only_fields = ['tuner', 'is_approved', 'reviewed_at']

class TunerReviewSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    
    class Meta:
        model = TunerReview
        fields = '__all__'
        read_only_fields = ['tuner', 'author']

class TunerProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    certifications = TunerCertificationSerializer(many=True, read_only=True)
    reviews = TunerReviewSerializer(many=True, read_only=True)

    class Meta:
        model = TunerProfile
        fields = '__all__'
        read_only_fields = ['user', 'verification_level', 'is_verified_business', 'total_downloads', 'average_rating', 'tunes_published_count', 'quality_score']
