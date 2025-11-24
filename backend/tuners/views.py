from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import TunerProfile, TunerCertification, TunerReview
from .serializers import TunerProfileSerializer, TunerCertificationSerializer, TunerReviewSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class TunerListView(generics.ListAPIView):
    queryset = TunerProfile.objects.all()
    serializer_class = TunerProfileSerializer
    permission_classes = (permissions.AllowAny,)

class TunerDetailView(generics.RetrieveAPIView):
    queryset = TunerProfile.objects.all()
    serializer_class = TunerProfileSerializer
    permission_classes = (permissions.AllowAny,)

class TunerApplyView(generics.CreateAPIView):
    """
    Apply to become a tuner.
    """
    queryset = TunerProfile.objects.all()
    serializer_class = TunerProfileSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def perform_create(self, serializer):
        # Ensure user role is updated or checked
        serializer.save(user=self.request.user)
        self.request.user.role = User.Role.TUNER
        self.request.user.save()

class TunerDocumentUploadView(generics.CreateAPIView):
    queryset = TunerCertification.objects.all()
    serializer_class = TunerCertificationSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def perform_create(self, serializer):
        tuner = self.request.user.tuner_profile
        serializer.save(tuner=tuner)
