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
        ZStack {
            // Background
            LinearGradient(
                colors: [.revSyncBlack, .revSyncDarkGray],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()
            
            VStack(spacing: 0) {
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: 16) {
                            ForEach(messages) { message in
                                LiveMessageBubble(message: message)
                                    .id(message.id)
                            }
                        }
                        .padding()
                    }
                    .onChange(of: messages.count) { _, _ in
                        if let last = messages.last {
                            withAnimation {
                                proxy.scrollTo(last.id, anchor: .bottom)
                            }
                        }
                    }
                }
                
                HStack(spacing: 12) {
                    TextField("Message...", text: $newMessageText)
                        .textFieldStyle(.plain)
                        .padding(12)
                        .background(Color.white.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                        .overlay(
                            RoundedRectangle(cornerRadius: 20)
                                .stroke(Color.white.opacity(0.2), lineWidth: 1)
                        )
                        .foregroundStyle(.white)
                    
                    Button(action: sendMessage) {
                        Image(systemName: "paperplane.fill")
                            .font(.title2)
                            .foregroundStyle(newMessageText.isEmpty ? .gray : Color.revSyncNeonBlue)
                            .padding(10)
                            .glass(cornerRadius: 30)
                            .shadow(color: newMessageText.isEmpty ? .clear : .revSyncNeonBlue.opacity(0.5), radius: 5)
                    }
                    .disabled(newMessageText.isEmpty)
                    .buttonStyle(.plain)
                }
                .padding()
                .background(.ultraThinMaterial)
            }
        }
        .navigationTitle(conversation.otherParticipant?.username ?? "Chat")
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
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
        
        // Haptic
        HapticService.shared.play(.medium)
        
        let text = newMessageText
        newMessageText = ""
        
        service.sendMessage(conversationId: conversation.id, content: text)
            .receive(on: DispatchQueue.main)
            .sink { _ in } receiveValue: { message in
                self.messages.append(message)
                HapticService.shared.notify(.success)
            }
            .store(in: &cancellables)
    }
}

struct LiveMessageBubble: View {
    let message: Message
    
    var body: some View {
        HStack {
            if message.isMe { Spacer() }
            
            Text(message.content)
                .padding(14)
                .background(
                    message.isMe ?
                    LinearGradient(colors: [.revSyncNeonBlue, .revSyncNeonPurple], startPoint: .topLeading, endPoint: .bottomTrailing) :
                    LinearGradient(colors: [Color.white.opacity(0.1), Color.white.opacity(0.05)], startPoint: .top, endPoint: .bottom)
                )
                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .stroke(message.isMe ? Color.white.opacity(0.2) : Color.white.opacity(0.1), lineWidth: 1)
                )
                .foregroundStyle(.white)
                .shadow(color: message.isMe ? .revSyncNeonBlue.opacity(0.3) : .clear, radius: 5, x: 0, y: 2)
                .frame(maxWidth: 280, alignment: message.isMe ? .trailing : .leading)
            
            if !message.isMe { Spacer() }
        }
    }
}
