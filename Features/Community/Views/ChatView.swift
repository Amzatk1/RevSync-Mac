//
//  ChatView.swift
//  RevSync
//
//  Created by RevSync on 24/11/2025.
//

import SwiftUI
import Combine

struct ChatView: View {
    let conversation: Conversation
    @StateObject private var service = ChatService.shared
    @State private var messages: [Message] = []
    @State private var newMessageText = ""
    @State private var cancellables = Set<AnyCancellable>()
    
    var body: some View {
        VStack {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(messages) { message in
                            MessageBubble(message: message)
                                .id(message.id)
                        }
                    }
                    .padding()
                }
                .onChange(of: messages.count) { _ in
                    if let last = messages.last {
                        withAnimation {
                            proxy.scrollTo(last.id, anchor: .bottom)
                        }
                    }
                }
            }
            
            HStack {
                TextField("Message...", text: $newMessageText)
                    .textFieldStyle(.roundedBorder)
                
                Button(action: sendMessage) {
                    Image(systemName: "paperplane.fill")
                        .font(.title2)
                }
                .disabled(newMessageText.isEmpty)
            }
            .padding()
            .background(.ultraThinMaterial)
        }
        .navigationTitle(conversation.otherParticipant?.username ?? "Chat")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear(perform: loadMessages)
    }
    
    private func loadMessages() {
        service.fetchMessages(conversationId: conversation.id)
            .receive(on: DispatchQueue.main)
            .sink { _ in } receiveValue: { messages in
                self.messages = messages
            }
            .store(in: &cancellables)
    }
    
    private func sendMessage() {
        guard !newMessageText.isEmpty else { return }
        
        let text = newMessageText
        newMessageText = ""
        
        service.sendMessage(conversationId: conversation.id, content: text)
            .receive(on: DispatchQueue.main)
            .sink { _ in } receiveValue: { message in
                self.messages.append(message)
            }
            .store(in: &cancellables)
    }
}

struct MessageBubble: View {
    let message: Message
    
    var body: some View {
        HStack {
            if message.isMe { Spacer() }
            
            Text(message.content)
                .padding(12)
                .background(message.isMe ? Color.blue : Color.gray.opacity(0.2))
                .foregroundStyle(message.isMe ? .white : .primary)
                .cornerRadius(16)
                .frame(maxWidth: 280, alignment: message.isMe ? .trailing : .leading)
            
            if !message.isMe { Spacer() }
        }
    }
}
