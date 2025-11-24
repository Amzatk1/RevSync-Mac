from django.urls import path
from .views import ConversationListView, MessageListCreateView, StartChatView

urlpatterns = [
    path('conversations/', ConversationListView.as_view(), name='conversation-list'),
    path('conversations/<int:conversation_id>/messages/', MessageListCreateView.as_view(), name='message-list-create'),
    path('start/<str:username>/', StartChatView.as_view(), name='start-chat'),
]
