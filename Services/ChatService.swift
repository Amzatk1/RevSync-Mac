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
        struct GetConversationsRequest: APIRequest {
            typealias Response = Paginated<Conversation>
            var path: String { "/chat/conversations/" }
            var method: HTTPMethod { .GET }
        }
        return api.send(GetConversationsRequest())
            .map { $0.results }
            .eraseToAnyPublisher()
    }
    
    func fetchMessages(conversationId: Int) -> AnyPublisher<[Message], Error> {
        struct GetMessagesRequest: APIRequest {
            typealias Response = Paginated<Message>
            let id: Int
            var path: String { "/chat/conversations/\(id)/messages/" }
            var method: HTTPMethod { .GET }
        }
        return api.send(GetMessagesRequest(id: conversationId))
            .map { $0.results }
            .eraseToAnyPublisher()
    }
    
    func sendMessage(conversationId: Int, content: String) -> AnyPublisher<Message, Error> {
        struct SendMessageRequest: APIRequest {
            typealias Response = Message
            let id: Int
            let content: String
            var path: String { "/chat/conversations/\(id)/messages/" }
            var method: HTTPMethod { .POST }
            var body: Data? { jsonBody(["content": content]) }
        }
        return api.send(SendMessageRequest(id: conversationId, content: content))
            .eraseToAnyPublisher()
    }
    
    func startChat(username: String) -> AnyPublisher<Conversation, Error> {
        struct StartChatRequest: APIRequest {
            typealias Response = Conversation
            let username: String
            var path: String { "/chat/start/\(username)/" }
            var method: HTTPMethod { .POST }
        }
        return api.send(StartChatRequest(username: username))
            .eraseToAnyPublisher()
    }
}

struct EmptyBody: Codable {}
