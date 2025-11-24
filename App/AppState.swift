// AppState.swift
// Global application state for RevSync.
//

import Foundation

/// An observable object holding top‑level application state.
final class AppState: ObservableObject {
    // MARK: - Authentication & User
    /// Access token for authenticated calls (source of truth is Keychain via AuthManager; this mirrors in-memory state).
    @Published var authToken: String = ""
    /// The currently logged-in user model, if available.
    @Published var currentUser: UserModel? = nil
    /// Derived auth flag to simplify view logic.
    var isAuthenticated: Bool { !authToken.isEmpty && currentUser != nil }

    // MARK: - Navigation
    /// The currently selected item in the sidebar.
    @Published var selectedTab: SidebarItem = .dashboard

    // MARK: - Selection & Filters
    /// Currently selected vehicle identifier (for detail and marketplace scoping).
    @Published var selectedVehicleId: String? = nil

    /// A global vehicle-type filter used across Marketplace and Garage.
    enum VehicleTypeFilter: String, CaseIterable, Identifiable { case bike, car; var id: String { rawValue } }
    @Published var vehicleTypeFilter: VehicleTypeFilter = .bike

    // MARK: - Convenience Helpers
    /// Apply authenticated session state.
    func applyAuth(token: String, user: UserModel) {
        authToken = token
        currentUser = user
    }

    /// Clear all auth-related state (used on logout or token invalidation).
    func logout() {
        authToken = ""
        currentUser = nil
        selectedVehicleId = nil
    }

    /// Select or clear the active vehicle context.
    func selectVehicle(id: String?) {
        selectedVehicleId = id
    }

    /// Set the global vehicle-type filter.
    func setVehicleType(_ type: VehicleTypeFilter) {
        vehicleTypeFilter = type
    }
}
