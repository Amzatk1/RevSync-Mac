//
//  RegisterViewModel.swift
//  
//
//  Created by Ayooluwa  Karim on 20/10/2025.
//


//  RegisterViewModel.swift
//  RevSync
//
//  Handles email/password registration via AuthManager.
//  Emits `didRegister(user:)` on success so the caller can update AppState.
//

import Foundation
import Combine

final class RegisterViewModel: ObservableObject {
    // MARK: - Form State
    @Published var username: String = ""
    @Published var email: String = ""
    @Published var password: String = ""
    @Published var confirmPassword: String = ""

    @Published private(set) var isLoading: Bool = false
    @Published var errorMessage: String? = nil

    /// Emits the created user when registration succeeds.
    let didRegister = PassthroughSubject<UserModel, Never>()

    // MARK: - Dependencies
    private let auth: AuthManager
    private var cancellables = Set<AnyCancellable>()

    init(auth: AuthManager) {
        self.auth = auth
    }

    // MARK: - Actions
    func register() {
        guard validateForm() else { return }
        errorMessage = nil
        isLoading = true

        auth.register(username: username.trimmingCharacters(in: .whitespacesAndNewlines),
                      email: email.trimmingCharacters(in: .whitespacesAndNewlines),
                      password: password)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] completion in
                guard let self = self else { return }
                self.isLoading = false
                if case let .failure(error) = completion {
                    self.errorMessage = Self.humanize(error)
                }
            } receiveValue: { [weak self] user in
                self?.didRegister.send(user)
            }
            .store(in: &cancellables)
    }

    // MARK: - Validation
    private func validateForm() -> Bool {
        let username = username.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !username.isEmpty else {
            errorMessage = "Please enter a username."
            return false
        }
        
        let email = email.trimmingCharacters(in: .whitespacesAndNewlines)
        guard Self.isValidEmail(email) else {
            errorMessage = "Please enter a valid email address."
            return false
        }
        guard password.count >= 8 else {
            errorMessage = "Password must be at least 8 characters."
            return false
        }
        guard password == confirmPassword else {
            errorMessage = "Passwords do not match."
            return false
        }
        return true
    }

    // MARK: - Helpers
    private static func isValidEmail(_ value: String) -> Bool {
        value.contains("@") && value.contains(".") && !value.hasPrefix("@") && !value.hasSuffix("@")
    }

    private static func humanize(_ error: Error) -> String {
        if let localized = (error as? LocalizedError)?.errorDescription { return localized }
        if let api = error as? APIError {
            switch api {
            case .httpError(let code, let message):
                if code == 409 { return "An account with this email already exists." }
                return message ?? "Request failed (\(code))."
            case .decodingError:
                return "We couldn't read the server response. Please try again."
            case .networkError:
                return "Network error. Check your connection and try again."

            case .unauthorized:
                return "Session expired. Please log in again."
            case .unknownError:
                return "Something went wrong. Please try again."
            }
        }
        return error.localizedDescription
    }
}
