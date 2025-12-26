//
//  UserListView.swift
//  RevSync
//
//  Created by RevSync on 22/10/2025.
//

import SwiftUI

struct UserListView: View {
    let title: String
    let users: [UserModel] // Using User model
    
    var body: some View {
        ZStack {
            // Background
            LinearGradient(
                colors: [.revSyncBlack, .revSyncDarkGray],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()
            
            if users.isEmpty {
                ContentUnavailableView("No users found", systemImage: "person.2.slash", description: Text("This list is empty."))
            } else {
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(users) { user in
                            UserRow(user: user)
                        }
                    }
                    .padding()
                }
            }
        }
        .navigationTitle(title)
    }
}

struct UserRow: View {
    let user: UserModel
    @State private var isFollowing: Bool = false // Local state for mock
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "person.circle.fill")
                .resizable()
                .frame(width: 40, height: 40)
                .foregroundStyle(.gray)
                .overlay(
                    Circle().stroke(Color.revSyncNeonBlue, lineWidth: 1)
                )
            
            VStack(alignment: .leading) {
                Text(user.username)
                    .font(.headline)
                    .foregroundStyle(.white)
                Text("Rider")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            
            Spacer()
            
            Button(action: {
                HapticService.shared.play(.medium)
                isFollowing.toggle()
            }) {
                Text(isFollowing ? "Following" : "Follow")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundStyle(isFollowing ? .white : .revSyncBlack)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 6)
                    .background(isFollowing ? Color.white.opacity(0.1) : Color.revSyncNeonBlue)
                    .clipShape(Capsule())
                    .overlay(
                        Capsule().stroke(isFollowing ? Color.white.opacity(0.2) : .clear, lineWidth: 1)
                    )
            }
            .buttonStyle(.plain)
        }
        .padding()
        .glass(cornerRadius: 12)
    }
}
