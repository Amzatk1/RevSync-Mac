from rest_framework import serializers
from .models import Tune, Purchase, TuneComment, TuneLike, Download
from tuners.serializers import TunerProfileSerializer
from users.serializers import UserSerializer

class TuneSerializer(serializers.ModelSerializer):
    creator = TunerProfileSerializer(read_only=True)

    class Meta:
        model = Tune
        fields = '__all__'
        read_only_fields = ['creator', 'downloads_count', 'safety_rating']

class TuneDetailSerializer(TuneSerializer):
    """
    Detailed view of a tune, potentially including more fields or related data.
    For now, it inherits from TuneSerializer but can be expanded.
    """
    pass

class PurchaseSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    tune = TuneSerializer(read_only=True)
    tune_id = serializers.PrimaryKeyRelatedField(queryset=Tune.objects.all(), source='tune', write_only=True)

    class Meta:
        model = Purchase
        fields = ['id', 'tune', 'buyer', 'price_paid', 'transaction_id', 'created_at']
        read_only_fields = ['buyer', 'price_paid', 'transaction_id', 'created_at']

class TuneCommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user_photo = serializers.CharField(source='user.profile.photo_url', read_only=True)
    
    class Meta:
        model = TuneComment
        fields = ['id', 'tune', 'user', 'username', 'user_photo', 'content', 'created_at']
        read_only_fields = ['user', 'created_at']
