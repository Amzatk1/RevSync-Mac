//  LoginViewModel.swift
//  Handles login form state and actions.
//

import Foundation
import Combine

/// A view model that manages user input and login calls.
final class LoginViewModel: ObservableObject {
    // MARK: - Form State
    @Published var email: String = ""
    @Published var password: String = ""
    @Published var isLoading: Bool = false
    @Published var errorMessage: String? = nil

    /// Emits a user when login succeeds.
    let didLogin = PassthroughSubject<UserModel, Never>()

    // MARK: - Dependencies
    private let auth: AuthManager
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Init
    /// Dependency-injected initializer for testability.
    init(auth: AuthManager) {
        self.auth = auth
    }

    // MARK: - Actions
    /// Attempts to log in using the provided credentials via AuthManager.
    func login() {
        guard validateForm() else { return }
        errorMessage = nil
        isLoading = true

        auth.login(email: email, password: password)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] completion in
                guard let self = self else { return }
                self.isLoading = false
                if case let .failure(error) = completion {
                    self.errorMessage = Self.humanize(error)
                }
            } receiveValue: { [weak self] user in
                self?.didLogin.send(user)
            }
            .store(in: &cancellables)
    }

    // MARK: - Helpers
    private func validateForm() -> Bool {
        !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !password.isEmpty
    }

    /// Converts various API errors into readable messages for the UI.
    private static func humanize(_ error: Error) -> String {
        if let localized = (error as? LocalizedError)?.errorDescription { return localized }
        if let api = error as? APIError {
            switch api {
            case .httpError(let code, let message):
                if code == 401 { return "Invalid email or password." }
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
