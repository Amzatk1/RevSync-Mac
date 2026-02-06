//  Sidebar.swift
//  RevSync
//
//  A clean macOS-style sidebar that reflects authentication state
//  and exposes a quick vehicle-type filter for the marketplace.
//  Upgraded: adds a universal search (vehicles, tunes, users, settings) with scope controls.

import SwiftUI
import Combine

/// Global notification so feature views can react to universal search
extension Notification.Name {
    static let RevSyncDidSubmitGlobalSearch = Notification.Name("RevSyncDidSubmitGlobalSearch")
}

/// Payload keys for the global search notification
private enum GlobalSearchKeys {
    static let query = "query"
    static let scope = "scope"
}

/// Search domains supported by the global search
private enum SearchScope: String, CaseIterable, Identifiable {
    case all, vehicles, tunes, users, settings
    var id: String { rawValue }
    var label: String {
        switch self {
        case .all: return "All"
        case .vehicles: return "Vehicles"
        case .tunes: return "Tunes"
        case .users: return "Users"
        case .settings: return "Settings"
        }
    }
    var systemImage: String {
        switch self {
        case .all: return "magnifyingglass"
        case .vehicles: return "car"
        case .tunes: return "music.note.list"
        case .users: return "person.2"
        case .settings: return "gear"
        }
    }
}

/// Top-level destinations shown in the sidebar.
enum SidebarItem: Hashable, Identifiable {
    case dashboard
    case garage
    case marketplace
    case installed
    case community
    case academy
    case challenges
    case creator
    case settings

    var id: Self { self }

    var title: String {
        switch self {
        case .dashboard:   return "Dashboard"
        case .garage:      return "Garage"
        case .marketplace: return "Marketplace"
        case .installed:   return "Installed"
        case .community:   return "Community"
        case .academy:     return "Academy"
        case .challenges:  return "Challenges"
        case .creator:     return "Creator Hub"
        case .settings:    return "Settings"
        }
    }

    var systemImage: String {
        switch self {
        case .dashboard:   return "rectangle.grid.2x2"
        case .garage:      return "car"
        case .marketplace: return "cart"
        case .installed:   return "tray.and.arrow.down"
        case .community:   return "person.3"
        case .academy:     return "graduationcap"
        case .challenges:  return "trophy"
        case .creator:     return "wand.and.stars"
        case .settings:    return "gear"
        }
    }
}

struct Sidebar: View {
    @EnvironmentObject private var appState: AppState

    // MARK: - Universal Search State
    @State private var searchText: String = ""
    @State private var searchScope: SearchScope = .all

    var body: some View {
        List(selection: $appState.selectedTab) {
            // MARK: - Universal Search
            Section {
                VStack(spacing: 8) {
                    HStack(spacing: 8) {
                        Image(systemName: "magnifyingglass")
                            .foregroundStyle(.secondary)
                        TextField("Search vehicles, tunes, users, settings…", text: $searchText, onCommit: dispatchSearch)
                            .textFieldStyle(.plain)
                            .disableAutocorrection(true)
                            .onSubmit { dispatchSearch() }
                        if !searchText.isEmpty {
                            Button {
                                searchText.removeAll()
                            } label: {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundStyle(.tertiary)
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel("Clear search")
                        }
                    }
                    .padding(8)
                    .background(
                        RoundedRectangle(cornerRadius: 10, style: .continuous)
                            .fill(.ultraThinMaterial)
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 10, style: .continuous)
                            .strokeBorder(Color.white.opacity(0.18))
                    )

                    Picker("Scope", selection: $searchScope) {
                        ForEach(SearchScope.allCases) { s in
                            Label(s.label, systemImage: s.systemImage).tag(s)
                        }
                    }
                    .pickerStyle(.segmented)
                    .help("Choose where to search")
                }
                .padding(.vertical, 4)
            }

            // MARK: - General
            Section("General") {
                sidebarRow(.dashboard)
            }

            // MARK: - Auth-gated sections
            if appState.isAuthenticated {
                Section("My Garage") {
                    sidebarRow(.garage)
                }

                Section("Marketplace") {
                    sidebarRow(.marketplace)

                    // Quick filter chip for vehicle type (Bike | Car)
                    Picker("Vehicle Type", selection: $appState.vehicleTypeFilter) {
                        Text("Bike").tag(AppState.VehicleTypeFilter.bike)
                        Text("Car").tag(AppState.VehicleTypeFilter.car)
                    }
                    .pickerStyle(.segmented)
                    .padding(.vertical, 4)
                    .accessibilityLabel("Marketplace Vehicle Type Filter")
                }

                Section("Tools & Community") {
                    sidebarRow(.installed)
                    sidebarRow(.community)
                    sidebarRow(.academy)
                    sidebarRow(.challenges)
                    // Show Creator Hub if the user is a creator (simple flag from model)
                    if appState.currentUser?.isCreator == true {
                        sidebarRow(.creator)
                    }
                }

                Section("App") {
                    sidebarRow(.settings)
                }
            } else {
                // Not signed in — keep sidebar minimal
                Section("App") {
                    sidebarRow(.settings)
                }
            }
        }
        .listStyle(.sidebar)
    }

    // MARK: - Helpers
    private func dispatchSearch() {
        let q = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !q.isEmpty else { return }

        // Route to a reasonable destination based on scope
        switch searchScope {
        case .all, .vehicles, .tunes:
            appState.selectedTab = .marketplace
        case .users:
            appState.selectedTab = .community
        case .settings:
            appState.selectedTab = .settings
        }

        NotificationCenter.default.post(name: .RevSyncDidSubmitGlobalSearch,
                                        object: nil,
                                        userInfo: [GlobalSearchKeys.query: q, GlobalSearchKeys.scope: searchScope.rawValue])
    }

    @ViewBuilder
    private func sidebarRow(_ item: SidebarItem) -> some View {
        Label(item.title, systemImage: item.systemImage)
            .tag(item)
    }
}

#Preview {
    Sidebar()
        .environmentObject(AppState())
}
