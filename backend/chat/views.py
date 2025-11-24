from rest_framework import generics, permissions, status, views
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer

User = get_user_model()

class ConversationListView(generics.ListAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return self.request.user.conversations.all().order_by('-updated_at')

class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        conversation_id = self.kwargs['conversation_id']
        return Message.objects.filter(conversation_id=conversation_id)
    
    def perform_create(self, serializer):
        conversation = get_object_or_404(Conversation, id=self.kwargs['conversation_id'])
        # Ensure user is participant
        if self.request.user not in conversation.participants.all():
            raise permissions.PermissionDenied("You are not a participant in this conversation.")
            
        serializer.save(sender=self.request.user, conversation=conversation)
        
        # Update conversation timestamp
        conversation.save()

class StartChatView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, username):
        target_user = get_object_or_404(User, username=username)
        
        if target_user == request.user:
            return Response({"error": "Cannot chat with yourself"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Check if conversation exists
        conversations = Conversation.objects.filter(participants=request.user).filter(participants=target_user)
        
        if conversations.exists():
            conversation = conversations.first()
        else:
            conversation = Conversation.objects.create()
            conversation.participants.add(request.user, target_user)
            
        return Response(ConversationSerializer(conversation, context={'request': request}).data)
