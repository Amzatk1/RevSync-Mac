// SettingsView.swift
// Displays user and app settings.
//

import SwiftUI
import Combine

/// A modern, macOS‑native settings view with profile, account, and app preferences.
struct SettingsView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var services: AppServices

    // App preferences persisted via AppStorage
    enum AppearanceOption: String, CaseIterable, Identifiable { case system, light, dark; var id: String { rawValue }
        var label: String { switch self { case .system: return "System"; case .light: return "Light"; case .dark: return "Dark" } }
    }

    @AppStorage("settings.appearance") private var appearance: AppearanceOption = .system
    @AppStorage("settings.analyticsEnabled") private var analyticsEnabled: Bool = false
    @AppStorage("settings.notificationsEnabled") private var notificationsEnabled: Bool = true
    @AppStorage("settings.preferredVehicleType") private var preferredVehicleTypeRaw: String = "car"

    // UI state
    @State private var isLoggingOut: Bool = false
    @State private var logoutError: String? = nil
    @State private var showLogoutConfirm: Bool = false
    @State private var showProfileSheet: Bool = false

    @State private var cancellables = Set<AnyCancellable>()

    private var preferredVehicleType: VehicleType {
        VehicleType(rawValue: preferredVehicleTypeRaw) ?? .car
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                profileSection
                Divider()
                appPreferences
                Divider()
                privacySection
                Divider()
                aboutSection
            }
            .padding(20)
            .frame(maxWidth: 800, alignment: .leading)
        }
        .navigationTitle("Settings")
        .sheet(isPresented: $showProfileSheet) {
            if let username = appState.currentUser?.username {
                ProfileView(username: username)
                    .frame(minWidth: 520, minHeight: 420)
            } else {
                Text("Please sign in to view profile.")
            }
        }
        .onAppear {
            // Sync preferred vehicle type with global filter on first load
            appState.vehicleTypeFilter = preferredVehicleType == .bike ? .bike : .car
        }
        .onChange(of: appState.vehicleTypeFilter) { _, newVal in
            // Keep preference in sync when the user changes the global filter (e.g., from Sidebar)
            preferredVehicleTypeRaw = (newVal == .bike ? VehicleType.bike.rawValue : VehicleType.car.rawValue)
        }
        .overlay(alignment: .top) {
            if let msg = logoutError, !msg.isEmpty {
                errorBanner(msg).padding(.top, 8)
            }
        }
        .confirmationDialog("Sign out of RevSync?", isPresented: $showLogoutConfirm, titleVisibility: .visible) {
            Button(role: .destructive) { performLogout() } label: { Text("Sign Out") }
            Button("Cancel", role: .cancel) { }
        } message: {
            Text("You will need to sign in again to access your garage and purchases.")
        }
    }

    // MARK: - Sections
    private var profileSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Profile").font(.title3.weight(.semibold))
            HStack(alignment: .center, spacing: 16) {
                avatarView
                VStack(alignment: .leading, spacing: 4) {
                    Text(appState.currentUser?.username ?? "Signed out") // Use username or fullName
                        .font(.headline)
                    Text(appState.currentUser?.email ?? "")
                }
                Spacer()
                HStack(spacing: 10) {
                    Button {
                        showProfileSheet = true
                    } label: {
                        Label("Edit Profile", systemImage: "pencil")
                    }
                    .disabled(appState.currentUser == nil)

                    Button(role: .destructive) {
                        showLogoutConfirm = true
                    } label: {
                        if isLoggingOut { ProgressView() } else { Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right") }
                    }
                    .disabled(isLoggingOut || !appState.isAuthenticated)
                }
            }
            .padding(16)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 14).strokeBorder(Color.white.opacity(0.18)))
        }
    }

    private var appPreferences: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("App Preferences").font(.title3.weight(.semibold))
            Form {
                Section("Appearance") {
                    Picker("Theme", selection: $appearance) {
                        ForEach(AppearanceOption.allCases) { option in
                            Text(option.label).tag(option)
                        }
                    }
                    .help("Use System to match macOS appearance, or choose Light/Dark.")
                }

                Section("Marketplace Defaults") {
                    Picker("Vehicle Type", selection: $preferredVehicleTypeRaw) {
                        Text(VehicleType.bike.description).tag(VehicleType.bike.rawValue)
                        Text(VehicleType.car.description).tag(VehicleType.car.rawValue)
                    }
                    .pickerStyle(.segmented)
                    .onChange(of: preferredVehicleTypeRaw) { _, newVal in
                        // Push selection to global app filter
                        appState.vehicleTypeFilter = (VehicleType(rawValue: newVal) == .bike) ? .bike : .car
                    }
                }

                Section("Downloads & Storage") {
                    Button {
                        print("Download location picker to be implemented")
                    } label: { Label("Change downloads folder…", systemImage: "folder") }
                    
                    Button {
                        clearCache()
                    } label: { Label("Clear cache", systemImage: "trash") }
                }

                Section("Notifications") {
                    Toggle("Enable notifications", isOn: $notificationsEnabled)
                        .onChange(of: notificationsEnabled) { _, _ in
                            print("Notification toggling to be implemented")
                        }
                }

                Section("Analytics") {
                    Toggle("Help improve RevSync by sending anonymized analytics", isOn: $analyticsEnabled)
                        .help("We never collect personal data. Toggle affects only anonymized diagnostics.")
                }
            }
            .formStyle(.grouped)
        }
    }

    private var privacySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Privacy & Security").font(.title3.weight(.semibold))
            VStack(alignment: .leading, spacing: 8) {
                Label("Your tune files are stored securely on your device.", systemImage: "lock.shield")
                Label("Credentials are stored in the Keychain.", systemImage: "key.fill")
                Label("Marketplace purchases are processed via secure endpoints.", systemImage: "creditcard")
            }
            .font(.subheadline)
            .foregroundStyle(.secondary)
        }
    }

    private var aboutSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("About").font(.title3.weight(.semibold))
            let version = (Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String) ?? "—"
            let build = (Bundle.main.infoDictionary?["CFBundleVersion"] as? String) ?? "—"
            HStack { Text("Version"); Spacer(); Text("\(version) (\(build))").foregroundStyle(.secondary) }
            HStack { Text("License"); Spacer(); Text("Proprietary").foregroundStyle(.secondary) }
            HStack { Text("Acknowledgements"); Spacer(); Text("Third‑party notices").foregroundStyle(.secondary) }
        }
    }

    // MARK: - Components
    private var avatarView: some View {
        Group {
            if let urlString = appState.currentUser?.profile?.photoUrl, let url = URL(string: urlString) {
                RemoteImage(url: url)
                    .frame(width: 56, height: 56)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
            } else {
                ZStack {
                    RoundedRectangle(cornerRadius: 10).fill(.quaternary)
                    Image(systemName: "person.crop.square")
                        .imageScale(.large)
                        .foregroundStyle(.secondary)
                }
                .frame(width: 56, height: 56)
            }
        }
    }

    private func errorBanner(_ text: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: "exclamationmark.triangle.fill")
            Text(text).lineLimit(3)
        }
        .padding(10)
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 8))
        .foregroundStyle(.red)
        .padding(.horizontal)
    }

    // MARK: - Actions
    private func performLogout() {
        guard appState.isAuthenticated else { return }
        logoutError = nil
        isLoggingOut = true
        services.auth.logout()
            .receive(on: DispatchQueue.main)
            .sink { completion in
                isLoggingOut = false
                if case let .failure(error) = completion {
                    logoutError = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
                } else {
                    appState.logout()
                }
            } receiveValue: { _ in }
            .store(in: &cancellables)
    }
    
    private func clearCache() {
        URLCache.shared.removeAllCachedResponses()
        // In a real app, also clear disk cache for images/downloads
    }
}
