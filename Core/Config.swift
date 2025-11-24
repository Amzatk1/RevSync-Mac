// Config.swift
// Application configuration values.
//

import Foundation

/// Centralized configuration values loaded from the app's Info.plist or `.xcconfig` files.
/// This struct provides environment-based keys and feature flags to be used throughout the app.
/// All values fallback to safe defaults if the corresponding keys are missing.
struct Config {
    /// The base URL for all API requests.
    static let apiBaseURL: URL = {
        let urlString = string(for: "API_BASE_URL")
        if urlString.isEmpty {
            return URL(string: "http://localhost:8000/api/v1")!
        }
        return URL(string: urlString) ?? URL(string: "http://localhost:8000/api/v1")!
    }()
    
    /// The Supabase project URL.
    static let supabaseURL: String = string(for: "SUPABASE_URL")
    
    /// The Supabase anonymous key.
    static let supabaseAnonKey: String = string(for: "SUPABASE_ANON_KEY")
    
    /// Feature flags dictionary loaded from Info.plist, keys are feature names and values are booleans.
    static let featureFlags: [String: Bool] = {
        guard let flags = Bundle.main.object(forInfoDictionaryKey: "FEATURE_FLAGS") as? [String: Any] else {
            return [:]
        }
        var boolFlags = [String: Bool]()
        for (key, value) in flags {
            if let boolValue = value as? Bool {
                boolFlags[key] = boolValue
            } else if let stringValue = value as? String {
                boolFlags[key] = (stringValue as NSString).boolValue
            }
        }
        return boolFlags
    }()
    
    /// Helper method to read a string value for a given Info.plist key.
    /// - Parameter key: The key to look up in the Info.plist.
    /// - Returns: The string value if present, or an empty string otherwise.
    private static func string(for key: String) -> String {
        return Bundle.main.object(forInfoDictionaryKey: key) as? String ?? ""
    }
}
