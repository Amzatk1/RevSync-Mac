//
//  InboxView.swift
//  RevSync
//
//  Created by RevSync on 24/11/2025.
//

import SwiftUI
import Combine

struct InboxView: View {
    @StateObject private var service = ChatService.shared
    @State private var conversations: [Conversation] = []
    @State private var isLoading = false
    @State private var cancellables = Set<AnyCancellable>()
    
    var body: some View {
        NavigationView {
            List(conversations) { conversation in
                NavigationLink(destination: ChatView(conversation: conversation)) {
                    HStack {
                        Circle()
                            .fill(Color.gray.opacity(0.3))
                            .frame(width: 50, height: 50)
                            .overlay(Text(conversation.otherParticipant?.username.prefix(1).uppercased() ?? "?"))
                        
                        VStack(alignment: .leading) {
                            Text(conversation.otherParticipant?.username ?? "Unknown")
                                .font(.headline)
                            
                            if let lastMsg = conversation.lastMessage {
                                Text(lastMsg.content)
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                                    .lineLimit(1)
                            }
                        }
                        
                        Spacer()
                        
                        if conversation.unreadCount > 0 {
                            Circle()
                                .fill(Color.blue)
                                .frame(width: 20, height: 20)
                                .overlay(Text("\(conversation.unreadCount)").font(.caption).foregroundStyle(.white))
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
            .navigationTitle("Messages")
            .onAppear(perform: loadConversations)
        }
    }
    
    private func loadConversations() {
        isLoading = true
        service.fetchConversations()
            .receive(on: DispatchQueue.main)
            .sink { completion in
                isLoading = false
            } receiveValue: { conversations in
                self.conversations = conversations
            }
            .store(in: &cancellables)
    }
}
