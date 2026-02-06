// DashboardView.swift
// Displays the dashboard feature with quick actions.
//

import SwiftUI

/// The default dashboard screen shown after login.
struct DashboardView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        ZStack {
            // Premium background gradient
            LinearGradient(
                stops: [
                    .init(color: Color.black.opacity(0.8), location: 0.0),
                    .init(color: Color(NSColor.windowBackgroundColor), location: 0.4),
                    .init(color: Color.blue.opacity(0.05), location: 1.0)
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            ScrollView {
                VStack(spacing: 40) {
                    header
                        .padding(.top, 60)
                    
                    quickActions
                        .frame(maxWidth: 800)
                    
                    aiSuggestions
                        .frame(maxWidth: 800)
                    
                    // Additional content or widgets could go here
                }
                .padding()
            }
        }
        .navigationTitle("Dashboard")
    }

    // MARK: - Header
    private var header: some View {
        VStack(spacing: 12) {
            Image(systemName: "bolt.fill") // More dynamic icon
                .font(.system(size: 48))
                .foregroundStyle(
                    LinearGradient(colors: [.yellow, .orange], startPoint: .top, endPoint: .bottom)
                )
                .shadow(color: .orange.opacity(0.5), radius: 10, x: 0, y: 0)
            
            Text("Welcome to RevSync")
                .font(.system(size: 42, weight: .bold, design: .rounded))
                .foregroundColor(.primary)
            
            Text("Your AI-Powered Performance Ecosystem")
                .font(.title2)
                .fontWeight(.medium)
                .foregroundStyle(.secondary)
        }
    }

    // MARK: - Quick Actions
    private var quickActions: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Get Started")
                .font(.title2)
                .fontWeight(.bold)
            
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 300), spacing: 20)], spacing: 20) {
                DashboardCard(
                    title: "Finish Profile",
                    subtitle: "Add avatar, bio, and social links.",
                    icon: "person.crop.circle.badge.plus",
                    gradient: LinearGradient(colors: [.blue, .cyan], startPoint: .topLeading, endPoint: .bottomTrailing)
                ) {
                    appState.selectedTab = .settings
                }

                DashboardCard(
                    title: "Add Vehicle",
                    subtitle: "Connect your bike or car.",
                    icon: appState.vehicleTypeFilter == .bike ? "bicycle" : "car.fill",
                    gradient: LinearGradient(colors: [.green, .mint], startPoint: .topLeading, endPoint: .bottomTrailing)
                ) {
                    appState.selectedTab = .garage
                }

                DashboardCard(
                    title: "Browse Tunes",
                    subtitle: "Find verified performance maps.",
                    icon: "cart.fill",
                    gradient: LinearGradient(colors: [.purple, .pink], startPoint: .topLeading, endPoint: .bottomTrailing)
                ) {
                    appState.selectedTab = .marketplace
                }
            }
        }
        .padding(.horizontal)
    }
    
    // MARK: - AI Suggestions
    private var aiSuggestions: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "sparkles")
                    .foregroundStyle(.yellow)
                Text("AI Suggestions")
                    .font(.title2)
                    .fontWeight(.bold)
            }
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 16) {
                    SuggestionCard(
                        title: "Optimize for Fuel Economy",
                        reason: "Based on your recent commuting style.",
                        icon: "leaf.fill",
                        color: .green
                    )
                    
                    SuggestionCard(
                        title: "Safety Check Recommended",
                        reason: "New safety parameters available for R1.",
                        icon: "exclamationmark.shield.fill",
                        color: .orange
                    )
                    
                    SuggestionCard(
                        title: "Try 'Track Day' Mode",
                        reason: "Perfect for your upcoming weekend.",
                        icon: "flag.checkered",
                        color: .red
                    )
                }
                .padding(.horizontal)
            }
        }
    }
}

#Preview {
    DashboardView()
        .environmentObject(AppState())
}
