//
//  ChatService.swift
//  RevSync
//
//  Created by RevSync on 24/11/2025.
//

import Foundation
import Combine

struct Conversation: Identifiable, Codable {
    let id: Int
    let participants: [UserModel]
    let lastMessage: Message?
    let unreadCount: Int
    let updatedAt: String
    
    var otherParticipant: UserModel? {
        // Logic to find the other user (not me)
        // For now, just return the first one that isn't me, or the first one if I'm not in the list (shouldn't happen)
        // This requires knowing "me", which we can get from AuthManager
        return participants.first
    }
}

struct Message: Identifiable, Codable {
    let id: Int
    let conversation: Int
    let sender: UserModel
    let content: String
    let isRead: Bool
    let createdAt: String
    let isMe: Bool
}

class ChatService: ObservableObject {
    static let shared = ChatService()
    private let api = APIClient.shared
    
    @Published var conversations: [Conversation] = []
    
    func fetchConversations() -> AnyPublisher<[Conversation], Error> {
        struct Response: Codable {
            let results: [Conversation]
        }
        
        // If using pagination, we'd decode Response. For now, assuming list
        return api.fetch("/chat/conversations/")
    }
    
    func fetchMessages(conversationId: Int) -> AnyPublisher<[Message], Error> {
        return api.fetch("/chat/conversations/\(conversationId)/messages/")
    }
    
    func sendMessage(conversationId: Int, content: String) -> AnyPublisher<Message, Error> {
        struct Request: Codable {
            let content: String
        }
        return api.post("/chat/conversations/\(conversationId)/messages/", body: Request(content: content))
    }
    
    func startChat(username: String) -> AnyPublisher<Conversation, Error> {
        return api.post("/chat/start/\(username)/", body: EmptyBody())
    }
}

struct EmptyBody: Codable {}
