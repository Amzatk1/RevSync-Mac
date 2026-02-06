from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import SafetyReport
from .serializers import SafetyReportSerializer

from drf_spectacular.utils import extend_schema

class SafetyAnalysisView(APIView):
    """
    Analyze a tune/vehicle combination for safety risks.
    """
    permission_classes = (permissions.IsAuthenticated,)

    @extend_schema(
        request=None,
        responses=SafetyReportSerializer,
        description="Trigger a safety analysis"
    )
    def post(self, request):
        # Mock Analysis Logic
        # In reality, this would call an AI service or rule engine
        
        vehicle_id = request.data.get('vehicle_id')
        listing_id = request.data.get('listing_id')
        version_id = request.data.get('version_id')
        
        # Mock result
        risk_score = 15
        status_label = 'SAFE'
        recommendations = ["Ensure tires are rated for higher speeds."]
        
        report = SafetyReport.objects.create(
            user=request.user,
            vehicle_id=vehicle_id,
            listing_id=listing_id,
            version_id=version_id,
            risk_score=risk_score,
            status=status_label,
            input_data=request.data,
            analysis_result={'engine_load': 'optimal', 'afr': 'safe'},
            recommendations=recommendations
        )
        
        return Response(SafetyReportSerializer(report).data)

class SafetyReportListView(generics.ListAPIView):
    serializer_class = SafetyReportSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        return SafetyReport.objects.filter(user=self.request.user).order_by('-created_at')
