// KeychainStore.swift
// Secure storage for sensitive data (access/refresh tokens, user IDs, etc.).
//

import Foundation
import Security

/// A focused wrapper around the system Keychain with namespaced keys and optional access-group support.
final class KeychainStore {
    // MARK: - Singleton
    static let shared = KeychainStore()

    // MARK: - Namespacing
    /// A stable service namespace for all RevSync secrets.
    private let service = "com.revsync"

    /// Optional keychain access group (set when you enable Keychain Sharing in entitlements).
    private let accessGroup: String?

    // MARK: - Keys
    enum Key: String {
        /// Bearer access token used for authenticated API calls.
        case accessToken = "com.revsync.auth.token.access"
        /// Long‑lived refresh token for renewing access tokens.
        case refreshToken = "com.revsync.auth.token.refresh"
        /// Optional: Current user identifier mirror.
        case userId = "com.revsync.user.id"
    }

    // MARK: - Init
    /// - Parameter accessGroup: Optional keychain access group (e.g., "ABCDE12345.com.revsync.shared").
    init(accessGroup: String? = nil) {
        self.accessGroup = accessGroup
    }

    // MARK: - Public Token Convenience
    @discardableResult
    func saveAccessToken(_ token: String) -> Bool { saveString(token, for: .accessToken) }

    func loadAccessToken() -> String? { loadString(for: .accessToken) }

    func deleteAccessToken() { delete(for: .accessToken) }

    @discardableResult
    func saveRefreshToken(_ token: String) -> Bool { saveString(token, for: .refreshToken) }

    func loadRefreshToken() -> String? { loadString(for: .refreshToken) }

    func deleteRefreshToken() { delete(for: .refreshToken) }

    // MARK: - Generic String/Data APIs
    @discardableResult
    func saveString(_ value: String, for key: Key) -> Bool {
        guard let data = value.data(using: .utf8) else { return false }
        return saveData(data, account: key.rawValue)
    }

    func loadString(for key: Key) -> String? {
        guard let data = loadData(account: key.rawValue) else { return nil }
        return String(data: data, encoding: .utf8)
    }

    func delete(for key: Key) {
        deleteData(account: key.rawValue)
    }

    // MARK: - Low-level Data APIs
    /// Saves data; updates if an item already exists.
    @discardableResult
    func saveData(_ data: Data, account: String) -> Bool {
        var query: [String: Any] = baseQuery(account: account)
        // Remove any existing item first to guarantee a clean state.
        SecItemDelete(query as CFDictionary)
        query[kSecValueData as String] = data
        query[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        let status = SecItemAdd(query as CFDictionary, nil)
        return status == errSecSuccess
    }

    /// Attempts to update an existing item; falls back to add on not-found.
    @discardableResult
    func updateData(_ data: Data, account: String) -> Bool {
        let query = baseQuery(account: account)
        let attributes: [String: Any] = [
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        ]
        let status = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
        if status == errSecItemNotFound { return saveData(data, account: account) }
        return status == errSecSuccess
    }

    /// Loads data for a given account name.
    func loadData(account: String) -> Data? {
        var query: [String: Any] = baseQuery(account: account)
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess, let data = result as? Data else { return nil }
        return data
    }

    /// Deletes a keychain item for the account name.
    func deleteData(account: String) {
        let query = baseQuery(account: account)
        SecItemDelete(query as CFDictionary)
    }

    // MARK: - Helpers
    private func baseQuery(account: String) -> [String: Any] {
        var query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        // Add access group when configured (Keychain Sharing).
        if let group = accessGroup, !group.isEmpty {
            query[kSecAttrAccessGroup as String] = group
        }
        return query
    }
}
