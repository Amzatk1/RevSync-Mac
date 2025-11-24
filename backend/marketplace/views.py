from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Tune, Purchase, TuneComment, TuneLike
from .serializers import TuneSerializer, TuneDetailSerializer, PurchaseSerializer, TuneCommentSerializer
import uuid

from core.mixins import LastModifiedSinceMixin

class TuneListView(LastModifiedSinceMixin, generics.ListAPIView):
    queryset = Tune.objects.filter(is_active=True)
    serializer_class = TuneSerializer
    permission_classes = (permissions.AllowAny,)
    filterset_fields = ['vehicle_make', 'vehicle_model', 'stage']

class TuneDetailView(generics.RetrieveAPIView):
    queryset = Tune.objects.all()
    serializer_class = TuneSerializer
    permission_classes = (permissions.AllowAny,)

class PurchaseCreateView(generics.CreateAPIView):
    queryset = Purchase.objects.all()
    serializer_class = PurchaseSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def perform_create(self, serializer):
        tune = serializer.validated_data['tune']
        # In a real app, verify payment here
        purchase = serializer.save(
            user=self.request.user,
            price_paid=tune.price,
            transaction_id=str(uuid.uuid4())
        )
        
        # Audit Log
        from core.models import AuditLog
        AuditLog.objects.create(
            user=self.request.user,
            action="PURCHASE_TUNE",
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
            data={
                'tune_id': tune.id,
                'tune_name': tune.name,
                'price': str(tune.price),
                'transaction_id': purchase.transaction_id
            }
        )

class TuneCommentListCreateView(generics.ListCreateAPIView):
    serializer_class = TuneCommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        tune_id = self.kwargs['tune_id']
        return TuneComment.objects.filter(tune_id=tune_id).order_by('-created_at')
        
    def perform_create(self, serializer):
        tune_id = self.kwargs['tune_id']
        tune = Tune.objects.get(pk=tune_id)
        serializer.save(user=self.request.user, tune=tune)

class TuneLikeToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, tune_id):
        tune = Tune.objects.get(pk=tune_id)
        like, created = TuneLike.objects.get_or_create(user=request.user, tune=tune)
        
        if not created:
            like.delete()
            return Response({'status': 'unliked'})
            
        return Response({'status': 'liked'})

class MyPurchasesView(LastModifiedSinceMixin, generics.ListAPIView):
    serializer_class = PurchaseSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)

from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes

class UploadURLView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @extend_schema(
        request=None,
        responses={
            200: OpenApiTypes.OBJECT,
            400: OpenApiTypes.OBJECT
        },
        description="Get a signed URL for file upload"
    )
    def post(self, request):
        filename = request.data.get('filename')
        content_type = request.data.get('content_type', 'application/octet-stream')
        
        if not filename:
            return Response({'error': 'Filename required'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Generate a unique path
        path = f"tunes/{request.user.id}/{uuid.uuid4()}/{filename}"
        
        # In a real implementation with boto3/Supabase:
        # url = s3_client.generate_presigned_url(...)
        # For now, we return a mock URL for local dev
        
        upload_url = f"https://fake-storage.revsync.com/{path}"
        public_url = upload_url # In reality, this might differ
        
        return Response({
            'upload_url': upload_url,
            'public_url': public_url,
            'path': path
        })

class PublishTuneView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @extend_schema(
        request=None,
        responses={
            200: OpenApiTypes.OBJECT,
            400: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        },
        description="Publish or unpublish a tune"
    )
    def post(self, request, pk):
        try:
            tune = Tune.objects.get(pk=pk, creator__user=request.user)
        except Tune.DoesNotExist:
            return Response({'error': 'Tune not found or access denied'}, status=status.HTTP_404_NOT_FOUND)
            
        action = request.data.get('action') # 'publish' or 'unpublish'
        
        if action == 'publish':
            # Validate required fields
            if not tune.file_url:
                return Response({'error': 'File upload required before publishing'}, status=status.HTTP_400_BAD_REQUEST)
                
            tune.status = Tune.Status.PUBLISHED
            tune.is_active = True
            from django.utils import timezone
            tune.published_at = timezone.now()
            tune.save()
            return Response({'status': 'published'})
            
        elif action == 'unpublish':
            tune.status = Tune.Status.DRAFT
            tune.is_active = False
            tune.save()
            return Response({'status': 'draft'})
            
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)

from django.db.models import Sum, Count

class CreatorAnalyticsView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @extend_schema(
        request=None,
        responses={
            200: OpenApiTypes.OBJECT,
            403: OpenApiTypes.OBJECT
        },
        description="Get creator analytics (downloads, sales, revenue)"
    )
    def get(self, request):
        # Ensure user is a creator
        if not hasattr(request.user, 'tuner_profile'):
             return Response({'error': 'Not a creator'}, status=status.HTTP_403_FORBIDDEN)
             
        tunes = Tune.objects.filter(creator__user=request.user)
        
        total_downloads = tunes.aggregate(total=Count('downloads'))['total'] or 0
        total_sales = tunes.aggregate(total=Sum('purchases__price_paid'))['total'] or 0
        total_revenue = float(total_sales) * 0.85 # Mock 15% platform fee
        
        return Response({
            'total_downloads': total_downloads,
            'total_sales_volume': total_sales,
            'net_revenue': total_revenue,
            'active_tunes': tunes.filter(status=Tune.Status.PUBLISHED).count()
        })
