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
        return TunerApplication.objects.filter(user=self.request.user).order_by('-created_at').first()

class AdminTunerApplicationListView(generics.ListAPIView):
    queryset = TunerApplication.objects.filter(status=TunerApplication.Status.PENDING)
    serializer_class = TunerApplicationSerializer
    permission_classes = [permissions.IsAdminUser]

class AdminApproveTunerView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        application = TunerApplication.objects.get(pk=pk)
        action = request.data.get('action') # approve / reject
        
        if action == 'approve':
            application.status = TunerApplication.Status.APPROVED
            application.save()
            
            # Create Profile
            TunerProfile.objects.get_or_create(
                user=application.user,
                defaults={
                    'business_name': application.business_name,
                    'slug': application.business_name.lower().replace(' ', '-')
                }
            )
            return Response({'status': 'approved'})
            
        elif action == 'reject':
            application.status = TunerApplication.Status.REJECTED
            application.save()
            return Response({'status': 'rejected'})
            
        return Response({'error': 'invalid action'}, status=400)
