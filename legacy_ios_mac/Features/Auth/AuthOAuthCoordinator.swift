//
//  AuthOAuthCoordinator.swift
//  
//
//  Created by Ayooluwa  Karim on 20/10/2025.
//


//  AuthOAuthCoordinator.swift
//  RevSync
//
//  Handles Supabase OAuth redirect callbacks on macOS.
//  Parses tokens from URL fragments or query params and publishes an OAuthSession
//  for AuthManager (or a caller) to apply.
//

import Foundation
import Combine

// MARK: - OAuth Session Model
public struct OAuthSession: Equatable {
    public let provider: String?
    public let accessToken: String?
    public let refreshToken: String?
    public let expiresIn: TimeInterval?
    public let tokenType: String?
    public let code: String?

    public var expiresAt: Date? {
        guard let exp = expiresIn else { return nil }
        return Date().addingTimeInterval(exp)
    }
}

// MARK: - Notification
extension Notification.Name {
    static let AuthDidReceiveOAuthSession = Notification.Name("AuthDidReceiveOAuthSession")
}

// MARK: - Coordinator
final class AuthOAuthCoordinator {
    static let shared = AuthOAuthCoordinator()

    private let subject = PassthroughSubject<OAuthSession, Never>()
    var sessionPublisher: AnyPublisher<OAuthSession, Never> { subject.eraseToAnyPublisher() }

    private init() {}

    /// Handle incoming OAuth callback URL. Returns true if handled.
    @discardableResult
    func handleCallback(url: URL) -> Bool {
        guard isAuthCallback(url) else { return false }
        let session = parseSession(from: url)
        subject.send(session)
        NotificationCenter.default.post(name: .AuthDidReceiveOAuthSession, object: nil, userInfo: ["session": session])
        return true
    }

    // MARK: - Parsing
    private func isAuthCallback(_ url: URL) -> Bool {
        // Default scheme suggested earlier: revsync://auth-callback
        // You can refine host/path checks here if needed.
        return url.scheme?.lowercased() == "revsync"
    }

    private func parseSession(from url: URL) -> OAuthSession {
        // Supabase may return tokens in the URL fragment (after #) or as query params.
        var params = [String: String]()

        if let fragment = url.fragment { params.merge(Self.parseKV(fragment)) { _, new in new } }
        if let query = url.query { params.merge(Self.parseKV(query)) { _, new in new } }

        let provider = params["provider"]
        let accessToken = params["access_token"]
        let refreshToken = params["refresh_token"]
        let tokenType = params["token_type"]
        let expiresIn = params["expires_in"].flatMap { TimeInterval($0) }
        let code = params["code"]

        return OAuthSession(
            provider: provider,
            accessToken: accessToken,
            refreshToken: refreshToken,
            expiresIn: expiresIn,
            tokenType: tokenType,
            code: code
        )
    }

    private static func parseKV(_ string: String) -> [String: String] {
        var result: [String: String] = [:]
        string.split(separator: "&").forEach { pair in
            let parts = pair.split(separator: "=", maxSplits: 1).map(String.init)
            guard parts.count == 2 else { return }
            let key = parts[0].removingPercentEncoding ?? parts[0]
            let value = parts[1].removingPercentEncoding ?? parts[1]
            result[key] = value
        }
        return result
    }
}

// MARK: - Usage Notes
// 1) Register the URL type (e.g., scheme: revsync) in the target's Info → URL Types.
// 2) In your @main App (RevSyncApp.swift), implement `onOpenURL { url in
//       AuthOAuthCoordinator.shared.handleCallback(url: url)
//    }` to route callbacks here.
// 3) Subscribe in AuthManager or a small adapter to apply tokens when a session is received:
//    `AuthOAuthCoordinator.shared.sessionPublisher
//        .sink { session in
//            // If session.accessToken is present, apply directly; if code is present, exchange via backend or Supabase.
//        }`
