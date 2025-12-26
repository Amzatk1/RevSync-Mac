//
//  CreatorChatView.swift
//  RevSync
//
//  Created by RevSync on 20/10/2025.
//

import SwiftUI

struct CreatorChatView: View {
    @Environment(\.dismiss) var dismiss
    @State private var messageText = ""
    @State private var messages: [ChatMessage] = [
        ChatMessage(text: "Hi! I just purchased the Stage 2 tune. Do I need to upgrade my fuel pump?", isUser: true, timestamp: Date().addingTimeInterval(-86400)),
        ChatMessage(text: "Hey! For the Stage 2 map on the R1, the stock pump is usually fine up to 13k RPM. If you're tracking it heavily, a high-flow pump is recommended for safety.", isUser: false, timestamp: Date().addingTimeInterval(-80000)),
        ChatMessage(text: "Great, thanks! Also, is the quickshifter timing adjusted in this map?", isUser: true, timestamp: Date().addingTimeInterval(-3600))
    ]
    
    var creatorName: String
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Button(action: { dismiss() }) {
                    Image(systemName: "chevron.left")
                        .font(.title3)
                        .foregroundStyle(.primary)
                }
                
                Image(systemName: "person.circle.fill")
                    .font(.title)
                    .foregroundStyle(.gray)
                
                VStack(alignment: .leading) {
                    Text(creatorName)
                        .font(.headline)
                    Text("Typically replies in 1 hr")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                
                Spacer()
                
                Button(action: {}) {
                    Image(systemName: "phone.fill")
                        .foregroundStyle(.blue)
                }
                .padding(.trailing, 16)
                
                Button(action: {}) {
                    Image(systemName: "video.fill")
                        .foregroundStyle(.blue)
                }
            }
            .padding()
            .background(.ultraThinMaterial)
            
            Divider()
            
            // Messages List
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(messages) { message in
                            MessageBubble(message: message)
                        }
                    }
                    .padding()
                }
                .onChange(of: messages.count) { _, _ in
                    if let lastId = messages.last?.id {
                        withAnimation {
                            proxy.scrollTo(lastId, anchor: .bottom)
                        }
                    }
                }
            }
            
            Divider()
            
            // Input Area
            HStack(spacing: 12) {
                Button(action: {}) {
                    Image(systemName: "plus.circle.fill")
                        .font(.title2)
                        .foregroundStyle(.gray)
                }
                
                TextField("Type a message...", text: $messageText)
                    .textFieldStyle(.plain)
                    .padding(10)
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(20)
                
                Button(action: sendMessage) {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.title2)
                        .foregroundStyle(messageText.isEmpty ? .gray : .blue)
                }
                .disabled(messageText.isEmpty)
            }
            .padding()
            .background(.ultraThinMaterial)
        }
        #if os(iOS)
        .navigationBarHidden(true)
        #endif
    }
    
    private func sendMessage() {
        guard !messageText.isEmpty else { return }
        let newMessage = ChatMessage(text: messageText, isUser: true, timestamp: Date())
        withAnimation {
            messages.append(newMessage)
            messageText = ""
        }
        
        // Simulate Reply
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            withAnimation {
                messages.append(ChatMessage(text: "Yes, the quickshifter kill times are optimized for smoother shifts at high RPM.", isUser: false, timestamp: Date()))
            }
        }
    }
}

struct MessageBubble: View {
    let message: ChatMessage
    
    var body: some View {
        HStack {
            if message.isUser { Spacer() }
            
            VStack(alignment: message.isUser ? .trailing : .leading, spacing: 4) {
                Text(message.text)
                    .padding(12)
                    .background(message.isUser ? Color.blue : Color.gray.opacity(0.2))
                    .foregroundStyle(message.isUser ? .white : .primary)
                    .cornerRadius(16)
                    .clipShape(
                        .rect(
                            topLeadingRadius: 16,
                            bottomLeadingRadius: message.isUser ? 16 : 4,
                            bottomTrailingRadius: message.isUser ? 4 : 16,
                            topTrailingRadius: 16
                        )
                    )
                
                Text(message.timestamp.formatted(.dateTime.hour().minute()))
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            
            if !message.isUser { Spacer() }
        }
    }
}

struct ChatMessage: Identifiable {
    let id = UUID()
    let text: String
    let isUser: Bool
    let timestamp: Date
}
