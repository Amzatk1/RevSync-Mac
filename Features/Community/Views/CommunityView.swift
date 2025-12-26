// CommunityView.swift
// Shows community forums and trending topics.
//

import SwiftUI

struct CommunityView: View {
    @State private var trendingTopics: [Topic] = [
        Topic(id: 1, title: "Best tune for R1 2024?", author: "SpeedDemon", replies: 45, views: 1200),
        Topic(id: 2, title: "Track day prep guide", author: "TrackJunkie", replies: 32, views: 890),
        Topic(id: 3, title: "ECU flashing risks explained", author: "TunerPro", replies: 128, views: 5600),
        Topic(id: 4, title: "Show off your garage!", author: "MotoLife", replies: 256, views: 10200)
    ]
    
    var body: some View {
        NavigationStack {
            ZStack {
                // Background
                LinearGradient(
                    colors: [.revSyncBlack, .revSyncDarkGray],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea()
                
                ScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        // Trending Header
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Trending Topics")
                                .font(.title2.bold())
                                .foregroundStyle(.white)
                            Text("Join the conversation with other riders.")
                                .foregroundStyle(.secondary)
                        }
                        .padding(.horizontal)
                        .padding(.top)
                        
                        // Topics List
                        LazyVStack(spacing: 16) {
                            ForEach(trendingTopics) { topic in
                                TopicCard(topic: topic)
                                    .onTapGesture {
                                        HapticService.shared.selection()
                                    }
                            }
                        }
                        .padding(.horizontal)
                    }
                    .padding(.bottom, 40)
                }
            }
            .navigationTitle("Community")
        }
    }
}

struct Topic: Identifiable {
    let id: Int
    let title: String
    let author: String
    let replies: Int
    let views: Int
}

struct TopicCard: View {
    let topic: Topic
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 10) {
                Text(topic.title)
                    .font(.headline)
                    .foregroundStyle(.white)
                    .lineLimit(2)
                
                HStack(spacing: 6) {
                    Image(systemName: "person.circle.fill")
                        .foregroundStyle(Color.revSyncNeonBlue)
                    Text(topic.author)
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundStyle(.secondary)
                }
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 8) {
                HStack(spacing: 16) {
                    Label("\(topic.replies)", systemImage: "bubble.left.fill")
                        .foregroundStyle(Color.revSyncNeonPurple)
                    Label("\(topic.views)", systemImage: "eye.fill")
                        .foregroundStyle(Color.revSyncNeonGreen)
                }
                .font(.caption)
                
                Text("2h ago")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .glass(cornerRadius: 16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.white.opacity(0.1), lineWidth: 1)
        )
    }
}
