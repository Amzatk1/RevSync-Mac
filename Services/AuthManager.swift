//  AuthManager.swift
//  RevSync
//
//  Authentication manager using Django REST Framework + SimpleJWT.
//  Responsibilities:
//  • Email/password login, registration, token refresh, and logout
//  • Persist access/refresh tokens securely via KeychainStore
//  • Publish current user updates for the rest of the app
//

import Foundation
import Combine

/// Handles Authentication and token lifecycle for RevSync.
final class AuthManager: ObservableObject {
    // MARK: - Publishers
    /// Emits the current user whenever it changes (nil when logged out).
    let currentUserPublisher: CurrentValueSubject<UserModel?, Never> = .init(nil)

    // MARK: - Stored state
    @Published private(set) var accessToken: String = "" // in‑memory mirror; source of truth is Keychain

    // MARK: - Deps
    private let api = APIClient.shared
    private let keychain = KeychainStore.shared
    private var bag = Set<AnyCancellable>()

    // MARK: - Bootstrap
    init() {
        // Attempt to mirror an existing token from Keychain on launch.
        if let token = keychain.loadAccessToken() {
            self.accessToken = token
            // Optionally fetch user profile on launch if token exists
            self.fetchMe().sink(receiveCompletion: { _ in }, receiveValue: { _ in }).store(in: &bag)
        }
    }

    // MARK: - DTOs
    private struct TokenResponse: Decodable {
        let access: String
        let refresh: String
    }

    // MARK: - Requests
    
    /// Django Login (SimpleJWT)
    private struct LoginRequest: APIRequest {
        typealias Response = TokenResponse
        let email: String; let password: String
        var path: String { "/auth/login/" }
        var method: HTTPMethod { .POST }
        var body: Data? { jsonBody(["email": email, "password": password]) }
        var requiresAuth: Bool { false }
    }

    /// Django Registration
    private struct RegisterRequest: APIRequest {
        typealias Response = UserModel // Returns the created user
        let username: String; let email: String; let password: String
        var path: String { "/auth/register/" }
        var method: HTTPMethod { .POST }
        var body: Data? { jsonBody(["username": username, "email": email, "password": password, "role": "RIDER"]) }
        var requiresAuth: Bool { false }
    }

    /// Django Token Refresh
    private struct RefreshRequest: APIRequest {
        typealias Response = TokenResponse
        let refresh: String
        var path: String { "/auth/refresh/" }
        var method: HTTPMethod { .POST }
        var body: Data? { jsonBody(["refresh": refresh]) }
        var requiresAuth: Bool { false }
    }
    
    /// Get Current User
    private struct MeRequest: APIRequest {
        typealias Response = UserModel
        var path: String { "/users/me/" }
        var method: HTTPMethod { .GET }
        var requiresAuth: Bool { true }
    }

    // MARK: - Public API
    
    /// Performs an email/password login.
    /// Flow: 1. Get Tokens -> 2. Fetch User Profile
    func login(email: String, password: String) -> AnyPublisher<UserModel, Error> {
        api.send(LoginRequest(email: email, password: password))
            .flatMap { [weak self] tokens -> AnyPublisher<UserModel, Error> in
                guard let self = self else { return Fail(error: APIError.unknownError).eraseToAnyPublisher() }
                
                // Save tokens
                self.keychain.saveAccessToken(tokens.access)
                self.keychain.saveRefreshToken(tokens.refresh)
                self.accessToken = tokens.access
                
                // Fetch User
                return self.fetchMe()
            }
            .eraseToAnyPublisher()
    }

    /// Registers a new user account.
    /// Flow: 1. Register -> 2. Auto-Login
    func register(username: String, email: String, password: String) -> AnyPublisher<UserModel, Error> {
        api.send(RegisterRequest(username: username, email: email, password: password))
            .flatMap { [weak self] _ -> AnyPublisher<UserModel, Error> in
                // Auto login after registration
                return self?.login(email: email, password: password) ?? Fail(error: APIError.unknownError).eraseToAnyPublisher()
            }
            .eraseToAnyPublisher()
    }
    
    /// Fetches the current user's profile using the stored access token.
    func fetchMe() -> AnyPublisher<UserModel, Error> {
        api.send(MeRequest())
            .handleEvents(receiveOutput: { [weak self] user in
                self?.currentUserPublisher.send(user)
            })
            .eraseToAnyPublisher()
    }

    /// Refreshes the access token using the stored refresh token.
    func refresh() -> AnyPublisher<String, Error> {
        guard let refresh = keychain.loadRefreshToken() else { return Fail(error: APIError.unauthorized).eraseToAnyPublisher() }
        
        return api.send(RefreshRequest(refresh: refresh))
            .tryMap { [weak self] tokens in
                self?.keychain.saveAccessToken(tokens.access)
                // SimpleJWT rotate_refresh_tokens=True might return a new refresh token too
                self?.keychain.saveRefreshToken(tokens.refresh)
                self?.accessToken = tokens.access
                return tokens.access
            }
            .eraseToAnyPublisher()
    }

    /// Logs out locally.
    func logout() -> AnyPublisher<Void, Error> {
        // Clear local state
        self.keychain.deleteAccessToken()
        self.keychain.deleteRefreshToken()
        self.accessToken = ""
        self.currentUserPublisher.send(nil)
        return Just(()).setFailureType(to: Error.self).eraseToAnyPublisher()
    }
}
