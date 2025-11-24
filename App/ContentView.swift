// ContentView.swift
// Top‑level view of the app.
//

import SwiftUI

/// Hosts the sidebar and the active feature view.
struct ContentView: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var services: AppServices
    @AppStorage("hasCompletedOnboarding") private var hasCompletedOnboarding: Bool = false

    var body: some View {
        Group {
            if !hasCompletedOnboarding {
                OnboardingView()
            } else {
                NavigationSplitView {
                    Sidebar()
                } detail: {
                    activeView()
                }
                .toolbar {
                    ToolbarItem(placement: .automatic) {
                        Picker("Vehicle Type", selection: $appState.vehicleTypeFilter) {
                            ForEach(AppState.VehicleTypeFilter.allCases) { type in
                                Text(type.rawValue.capitalized).tag(type)
                            }
                        }
                        .pickerStyle(.segmented)
                    }
                }
                .sheet(isPresented: Binding(
                    get: { !appState.isAuthenticated },
                    set: { _ in }
                )) {
                    LoginView()
                }
                .overlay(alignment: .bottom) {
                    if let toast = services.toast.currentToast {
                        ToastView(toast: toast)
                            .zIndex(100)
                    }
                }
            }
        }
    }

    /// Returns the view corresponding to the selected tab.
    @ViewBuilder
    private func activeView() -> some View {
        switch appState.selectedTab {
        case .dashboard:
            DashboardView()
        case .garage:
            GarageView()
        case .marketplace:
            MarketplaceView()
        case .installed:
            InstalledTunesView()
        case .community:
            CommunityView()
        case .academy:
            AcademyView()
        case .challenges:
            ChallengesView()
        case .creator:
            CreatorHubView()
        case .settings:
            SettingsView()
        }
    }
}
