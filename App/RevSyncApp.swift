// RevSyncApp.swift
// macOS SwiftUI App
//

import SwiftUI
import Combine

/// Simple service container to inject shared services via Environment.
final class AppServices: ObservableObject {
    let api = APIClient.shared
    let auth = AuthManager()
    let garage = GarageService()
    let marketplace = MarketplaceService()
    let toast = ToastManager()
}

/// The main entry point of the RevSync app.
@main
struct RevSyncApp: App {
    /// Shared application state.
    @StateObject private var appState = AppState()

    /// Onboarding completion flag.
    @AppStorage("hasCompletedOnboarding") private var hasCompletedOnboarding: Bool = false
    /// Last-known signed-in auth token (kept minimal; long-term storage should remain in Keychain).
    @AppStorage("authToken") private var storedAuthToken: String = ""

    /// Shared services container.
    @StateObject private var services = AppServices()

    /// Core Data persistence controller.
    private let persistenceController = PersistenceController.shared

    /// Combine store for app-level subscriptions.
    @State private var cancellables = Set<AnyCancellable>()

    /// Represents the different tabs available in the app.
    enum Tab: String, CaseIterable, Identifiable {
        case marketplace
        case community
        case academy
        case challenges
        case settings

        var id: String { self.rawValue }
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .environmentObject(services)
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
                .onAppear {
                    // Provide APIClient a live token source from AuthManager
                    APIClient.shared.tokenProvider = { [weak services] in
                        let token = services?.auth.accessToken
                        return (token?.isEmpty ?? true) ? nil : token
                    }

                    // Sync AuthManager state to AppState
                    services.auth.$accessToken
                        .receive(on: DispatchQueue.main)
                        .assign(to: &$appState.authToken)
                    
                    services.auth.currentUserPublisher
                        .receive(on: DispatchQueue.main)
                        .assign(to: &$appState.currentUser)
                }
                .onChange(of: appState.authToken) { newToken in
                    storedAuthToken = newToken
                }
        }
    }
}
