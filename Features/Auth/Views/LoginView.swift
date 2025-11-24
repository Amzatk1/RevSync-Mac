//  LoginView.swift
//  RevSync
//
//  Phase‑1 login view:
//  • Email/password login via AuthManager (Supabase)
//  • Buttons for Sign in with Apple and Google (hooks ready; integration wired later)
//  • Clean error rendering and loading states
//

import SwiftUI
import Combine
import AuthenticationServices
import AppKit

struct LoginView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var services: AppServices

    @StateObject private var viewModel: LoginViewModel
    
    init() {
        _viewModel = StateObject(wrappedValue: LoginViewModel(auth: AuthManager()))
    }

    @State private var showRegister: Bool = false

    var body: some View {
        VStack(spacing: 20) {
            // Header
            VStack(spacing: 6) {
                Text("Welcome back")
                    .font(.largeTitle).bold()
                Text("Sign in to continue to RevSync")
                    .foregroundStyle(.secondary)
            }

            // Email / Password
            VStack(spacing: 12) {
                TextField("Email", text: $viewModel.email)
                    .textContentType(.username)
                    .textFieldStyle(.roundedBorder)
                    .disabled(viewModel.isLoading)
                SecureField("Password", text: $viewModel.password)
                    .textContentType(.password)
                    .textFieldStyle(.roundedBorder)
                    .disabled(viewModel.isLoading)
            }
            .frame(maxWidth: 380)

            // Error
            if let message = viewModel.errorMessage, !message.isEmpty {
                HStack(alignment: .top, spacing: 8) {
                    Image(systemName: "exclamationmark.triangle.fill")
                    Text(message)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .foregroundStyle(.red)
                .frame(maxWidth: 420, alignment: .leading)
            }

            // Primary button
            Button(action: { viewModel.login() }) {
                if viewModel.isLoading {
                    ProgressView()
                } else {
                    Text("Sign In")
                        .frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(viewModel.isLoading || viewModel.email.isEmpty || viewModel.password.isEmpty)
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

            // Social sign-in buttons (Placeholder for future Phase)
            VStack(spacing: 10) {
                Text("Social login coming soon")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: 380)

            // Register link
            HStack(spacing: 6) {
                Text("Don't have an account?")
                    .foregroundStyle(.secondary)
                Button("Create one") { showRegister = true }
            }
            .padding(.top, 6)
        }
        .padding(32)
        .frame(minWidth: 420)
        .sheet(isPresented: $showRegister) {
            // If you already added RegisterView, present it. Otherwise, keep this until file exists.
            #if canImport(SwiftUI)
            RegisterView()
                .environmentObject(appState)
                .environmentObject(services)
            #endif
        }
        .onReceive(viewModel.didLogin) { user in
             let token = services.auth.accessToken
             appState.applyAuth(token: token, user: user)
        }
    }
}

#Preview {
    LoginView()
        .environmentObject(AppState())
        .environmentObject(AppServices())
}
