//
//  ProfileView.swift
//  RevSync
//
//  Created by RevSync on 20/10/2025.
//

import SwiftUI

struct ProfileView: View {
    let username: String
    @StateObject private var viewModel: ProfileViewModel
    
    init(username: String) {
        self.username = username
        _viewModel = StateObject(wrappedValue: ProfileViewModel(username: username))
    }
    
    var body: some View {
        ZStack {
            // Background
            LinearGradient(
                colors: [.revSyncBlack, .revSyncDarkGray],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()
            
            ScrollView {
                VStack(spacing: 24) {
                    if viewModel.isLoading {
                        ProgressView()
                            .padding(.top, 50)
                    } else {
                        // Header
                        VStack(spacing: 16) {
                            ZStack {
                                Circle()
                                    .stroke(LinearGradient(colors: [.revSyncNeonBlue, .revSyncNeonPurple], startPoint: .topLeading, endPoint: .bottomTrailing), lineWidth: 3)
                                    .frame(width: 88, height: 88)
                                    .shadow(color: .revSyncNeonBlue.opacity(0.5), radius: 10)
                                
                                Image(systemName: "person.circle.fill")
                                    .resizable()
                                    .frame(width: 80, height: 80)
                                    .foregroundStyle(.gray)
                                    .clipShape(Circle())
                            }
                            
                            VStack(spacing: 4) {
                                Text(viewModel.user?.username ?? "User")
                                    .font(.title)
                                    .fontWeight(.bold)
                                    .foregroundStyle(.white)
                                
                                Text("Member since 2024")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .padding(.top)
                        
                        // Follow & Message Buttons
                        if !viewModel.isCurrentUser {
                            HStack(spacing: 16) {
                                Button(action: {
                                    HapticService.shared.play(.medium)
                                    viewModel.toggleFollow()
                                }) {
                                    Text(viewModel.isFollowing ? "Following" : "Follow")
                                        .font(.headline)
                                        .foregroundStyle(viewModel.isFollowing ? .white : .revSyncBlack)
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 12)
                                        .background(viewModel.isFollowing ? Color.white.opacity(0.1) : Color.revSyncNeonBlue)
                                        .glass(cornerRadius: 12)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 12)
                                                .stroke(viewModel.isFollowing ? Color.white.opacity(0.2) : .clear, lineWidth: 1)
                                        )
                                }
                                .buttonStyle(.plain)
                                
                                NavigationLink(destination: ChatView(conversation: Conversation(id: 0, participants: [viewModel.user!], lastMessage: nil, unreadCount: 0, updatedAt: ""))) {
                                    Text("Message")
                                        .font(.headline)
                                        .foregroundStyle(Color.revSyncBlack)
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 12)
                                        .background(Color.revSyncNeonGreen)
                                        .cornerRadius(12)
                                        .neonGlow(color: .revSyncNeonGreen, radius: 10)
                                }
                                .buttonStyle(.plain)
                            }
                            .padding(.horizontal)
                        }
                        
                        // Stats
                        HStack(spacing: 0) {
                            NavigationLink(destination: UserListView(title: "Followers", users: [])) {
                                StatBox(value: "\(viewModel.followersCount ?? 0)", label: "Followers")
                            }
                            .buttonStyle(.plain)
                            
                            Divider().background(.white.opacity(0.2))
                            
                            NavigationLink(destination: UserListView(title: "Following", users: [])) {
                                StatBox(value: "\(viewModel.followingCount ?? 0)", label: "Following")
                            }
                            .buttonStyle(.plain)
                            
                            Divider().background(.white.opacity(0.2))
                            
                            StatBox(value: "\(viewModel.vehicles.count)", label: "Vehicles")
                        }
                        .padding()
                        .glass(cornerRadius: 16)
                        .padding(.horizontal)
                        
                        // Rider Profile
                        if let user = viewModel.user {
                            VStack(alignment: .leading, spacing: 16) {
                                Text("Rider Profile")
                                    .font(.headline)
                                    .padding(.horizontal, 4)
                                
                                HStack(spacing: 12) {
                                    ProfileBadge(icon: "figure.seated.seatbelt", label: user.profile?.ridingStyle ?? "Balanced", color: .revSyncNeonBlue)
                                    ProfileBadge(icon: "star.fill", label: user.profile?.experienceLevel ?? "Intermediate", color: .revSyncNeonPurple)
                                    ProfileBadge(icon: "exclamationmark.shield.fill", label: user.profile?.riskTolerance ?? "Moderate", color: .revSyncWarning)
                                }
                            }
                            .padding(.horizontal)
                        }
                        
                        // Privacy Settings (Current User Only)
                        if viewModel.isCurrentUser {
                            VStack(alignment: .leading) {
                                Toggle("Public Garage", isOn: Binding(
                                    get: { viewModel.showVehiclesPublic },
                                    set: { val in
                                        HapticService.shared.play(.light)
                                        viewModel.updatePrivacy(showVehiclesPublic: val)
                                    }
                                ))
                                .toggleStyle(SwitchToggleStyle(tint: .revSyncNeonBlue))
                            }
                            .padding()
                            .glass(cornerRadius: 12)
                            .padding(.horizontal)
                        }
                        
                        // Vehicles
                        if !viewModel.vehicles.isEmpty {
                            VStack(alignment: .leading, spacing: 16) {
                                Text("Garage Showcase")
                                    .font(.headline)
                                    .padding(.horizontal)
                                
                                ScrollView(.horizontal, showsIndicators: false) {
                                    HStack(spacing: 16) {
                                        ForEach(viewModel.vehicles) { vehicle in
                                             VehicleCard3D(vehicle: vehicle, isSelected: false)
                                                 .frame(width: 280, height: 400)
                                                 .scaleEffect(0.9)
                                        }
                                    }
                                    .padding(.horizontal)
                                }
                            }
                        }
                    }
                }
                .padding(.bottom, 40)
            }
        }
        .navigationTitle("Profile")
        .onAppear {
            viewModel.load()
        }
    }
}

struct StatBox: View {
    let value: String
    let label: String
    
    var body: some View {
        VStack(spacing: 4) {
             Text(value)
                 .font(.title3)
                 .fontWeight(.bold)
                 .foregroundStyle(.white)
             Text(label)
                 .font(.caption)
                 .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

struct ProfileBadge: View {
    let icon: String
    let label: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(color)
            Text(label)
                .font(.caption)
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .glass(cornerRadius: 12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(color.opacity(0.3), lineWidth: 1)
        )
    }
}
