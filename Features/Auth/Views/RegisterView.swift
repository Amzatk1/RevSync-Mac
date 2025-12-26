
//  RegisterView.swift
//  RevSync
//
//  Phase‑1 registration view:
//  • Email/password sign‑up via AuthManager (Supabase)
//  • Continue with Apple / Google buttons (hooks; OAuth wired later)
//  • Strong validation + clean error rendering
//

import SwiftUI
import Combine
import AuthenticationServices
import AppKit

struct RegisterView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var services: AppServices

    @State private var email: String = ""
    @State private var username: String = ""
    @State private var password: String = ""
    @State private var confirmPassword: String = ""
    @State private var isLoading: Bool = false
    @State private var errorMessage: String? = nil

    // Keep Combine subscriptions alive
    @State private var bag = Set<AnyCancellable>()

    private var isFormValid: Bool {
        !username.isEmpty && isValidEmail(email) && password.count >= 8 && password == confirmPassword
    }

    var body: some View {
        VStack(spacing: 20) {
            // Header
            VStack(spacing: 6) {
                Text("Create your account")
                    .font(.largeTitle).bold()
                Text("Join RevSync to browse and purchase tunes.")
                    .foregroundStyle(.secondary)
            }

            // Email / Password
            VStack(spacing: 12) {
                TextField("Username", text: $username)
                    .textContentType(.username)
                    .textFieldStyle(.roundedBorder)
                    .disabled(isLoading)
                
                TextField("Email", text: $email)
                    .textContentType(.emailAddress)
                    .textFieldStyle(.roundedBorder)
                    .disabled(isLoading)

                SecureField("Password (min 8 characters)", text: $password)
                    .textContentType(.newPassword)
                    .textFieldStyle(.roundedBorder)
                    .disabled(isLoading)

                SecureField("Confirm password", text: $confirmPassword)
                    .textContentType(.newPassword)
                    .textFieldStyle(.roundedBorder)
                    .disabled(isLoading)
                    .onSubmit(register)
            }
            .frame(maxWidth: 380)

            // Error
            if let message = errorMessage, !message.isEmpty {
                HStack(alignment: .top, spacing: 8) {
                    Image(systemName: "exclamationmark.triangle.fill")
                    Text(message)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .foregroundStyle(.red)
                .frame(maxWidth: 420, alignment: .leading)
            }

            // Primary button
            Button(action: register) {
                if isLoading { ProgressView() }
                else { Text("Sign Up").frame(maxWidth: .infinity) }
            }
            .buttonStyle(.borderedProminent)
            .disabled(!isFormValid || isLoading)
            .frame(maxWidth: 380)

            // Or divider
            HStack {
                Rectangle().frame(height: 1).opacity(0.1)
                Text("or")
                    .foregroundStyle(.secondary)
                Rectangle().frame(height: 1).opacity(0.1)
            }
            .padding(.vertical, 4)
            .frame(maxWidth: 380)

            // Social sign‑up buttons (Placeholder for future Phase)
            VStack(spacing: 10) {
                Text("Social signup coming soon")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: 380)

            // Terms / privacy note
            Text("By creating an account you agree to our Terms and Privacy Policy.")
                .font(.footnote)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.top, 4)
        }
        .padding(32)
        .frame(minWidth: 420)
    }

    // MARK: - Actions
    private func register() {
        guard isFormValid else {
            errorMessage = humanizeValidation()
            return
        }
        errorMessage = nil
        isLoading = true

        services.auth
            .register(username: username, email: email, password: password)
            .receive(on: DispatchQueue.main)
            .sink { completion in
                isLoading = false
                if case let .failure(error) = completion {
                    errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
                }
            } receiveValue: { user in
                // Apply to global state and let the presenting sheet dismiss naturally
                let token = services.auth.accessToken
                appState.applyAuth(token: token, user: user)
            }
            .store(in: &bag)
    }

    // MARK: - Validation helpers
    private func isValidEmail(_ value: String) -> Bool {
        // Lightweight email check (keep simple for client-side UX)
        value.contains("@") && value.contains(".") && !value.hasPrefix("@") && !value.hasSuffix("@")
    }

    private func humanizeValidation() -> String {
        if !isValidEmail(email) { return "Please enter a valid email address." }
        if password.count < 8 { return "Password must be at least 8 characters." }
        if password != confirmPassword { return "Passwords do not match." }
        return "Please complete all fields."
    }
}

#Preview {
    RegisterView()
        .environmentObject(AppState())
        .environmentObject(AppServices())
}

