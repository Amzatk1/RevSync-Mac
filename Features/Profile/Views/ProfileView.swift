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
        ScrollView {
            VStack(spacing: 20) {
                if viewModel.isLoading {
                    ProgressView()
                } else {
                    // Header
                    VStack {
                        Image(systemName: "person.circle.fill")
                            .resizable()
                            .frame(width: 80, height: 80)
                            .foregroundStyle(.gray)
                        
                        Text(viewModel.user?.username ?? "User")
                            .font(.title)
                            .fontWeight(.bold)
                        
                        Text("Member since 2024")
                            .foregroundStyle(.secondary)
                    }
                    .padding()
                    
                    // Follow Button
                    if !viewModel.isCurrentUser {
                        Button(action: {
                            viewModel.toggleFollow()
                        }) {
                            Text(viewModel.isFollowing ? "Following" : "Follow")
                                .font(.headline)
                                .foregroundStyle(viewModel.isFollowing ? .primary : .white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 10)
                                .background(viewModel.isFollowing ? Color.gray.opacity(0.2) : Color.blue)
                                .cornerRadius(8)
                        }
                        .buttonStyle(.plain)
                        .padding(.horizontal)
                    }
                    
                    // Stats
                    HStack(spacing: 40) {
                        VStack {
                            Text("\(viewModel.followersCount)")
                                .font(.headline)
                            Text("Followers")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        
                        VStack {
                            Text("\(viewModel.followingCount)")
                                .font(.headline)
                            Text("Following")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding()
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(12)
                    
                    // Rider Profile
                    if let user = viewModel.user {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Rider Profile")
                                .font(.headline)
                            
                            HStack(spacing: 12) {
                                ProfileBadge(icon: "figure.seated.seatbelt", label: user.profile?.ridingStyle ?? "Balanced", color: .blue)
                                ProfileBadge(icon: "star.fill", label: user.profile?.skillLevel ?? "Intermediate", color: .purple)
                                ProfileBadge(icon: "exclamationmark.shield.fill", label: user.profile?.riskTolerance ?? "Moderate", color: .orange)
                            }
                        }
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(12)
                        .cornerRadius(12)
                    }
                    
                    // Privacy Settings (Current User Only)
                    if viewModel.isCurrentUser {
                        Toggle("Public Garage", isOn: Binding(
                            get: { viewModel.showVehiclesPublic },
                            set: { viewModel.updatePrivacy(showVehiclesPublic: $0) }
                        ))
                        .padding()
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(12)
                        .padding(.horizontal)
                    }
                    
                    // Vehicles
                    if !viewModel.vehicles.isEmpty {
                        VStack(alignment: .leading) {
                            Text("Garage")
                                .font(.headline)
                                .padding(.horizontal)
                            
                            ForEach(viewModel.vehicles) { vehicle in
                                HStack {
                                    Image(systemName: "car.fill")
                                    Text(vehicle.name)
                                    Spacer()
                                }


                                .padding()
                                .background(Color.gray.opacity(0.05))
                                .cornerRadius(8)
                                .padding(.horizontal)
                            }
                        }
                    }
                }
            }
            .padding()
        }
        .navigationTitle("Profile")
        .onAppear {
            viewModel.load()
        }
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
        .padding(.vertical, 8)
        .background(Color(NSColor.controlBackgroundColor))
        .cornerRadius(8)
    }
}
