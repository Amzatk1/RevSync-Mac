from django.db import transaction
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.utils.text import slugify
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import TunerApplication, TunerProfile
from .serializers import TunerApplicationSerializer

class ApplyTunerView(generics.CreateAPIView):
    """
    Step 1: Apply to become a tuner.
    """
    serializer_class = TunerApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class TunerApplicationStatusView(generics.RetrieveAPIView):
    serializer_class = TunerApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        # Return latest application
        application = TunerApplication.objects.filter(user=self.request.user).order_by('-created_at').first()
        if application is None:
            raise Http404('No tuner application found.')
        return application

class AdminTunerApplicationListView(generics.ListAPIView):
    queryset = TunerApplication.objects.filter(status=TunerApplication.Status.PENDING)
    serializer_class = TunerApplicationSerializer
    permission_classes = [permissions.IsAdminUser]

class AdminApproveTunerView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def _build_unique_slug(self, business_name: str, user_id: int) -> str:
        base_slug = slugify(business_name) or f'tuner-{user_id}'
        candidate = base_slug
        counter = 2

        while TunerProfile.objects.filter(slug=candidate).exclude(user_id=user_id).exists():
            candidate = f'{base_slug}-{counter}'
            counter += 1

        return candidate

    def post(self, request, pk):
        application = get_object_or_404(TunerApplication, pk=pk)
        action = request.data.get('action') # approve / reject
        
        if action == 'approve':
            with transaction.atomic():
                application.status = TunerApplication.Status.APPROVED
                application.save(update_fields=['status', 'updated_at'])

                user = application.user
                updates = []
                if not user.is_tuner:
                    user.is_tuner = True
                    updates.append('is_tuner')
                if user.role != user.Role.TUNER:
                    user.role = user.Role.TUNER
                    updates.append('role')
                if updates:
                    user.save(update_fields=updates)

                TunerProfile.objects.update_or_create(
                    user=user,
                    defaults={
                        'business_name': application.business_name,
                        'slug': self._build_unique_slug(application.business_name, user.id),
                    }
                )
            return Response({'status': 'approved'})
            
        elif action == 'reject':
            application.status = TunerApplication.Status.REJECTED
            application.save(update_fields=['status', 'updated_at'])
            return Response({'status': 'rejected'})
            
        return Response({'error': 'invalid action'}, status=400)
