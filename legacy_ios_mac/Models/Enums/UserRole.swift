//
//  UserRole.swift
//  
//
//  Created by Ayooluwa  Karim on 20/10/2025.
//


//
//  UserRole.swift
//  RevSync
//
//  Created by Ayooluwa Karim on 20/10/2025.
//

import Foundation

/// Defines the available roles a user can have within RevSync.
/// Used to determine feature access and permissions.
enum UserRole: String, Codable, CaseIterable, Identifiable {
    /// Standard user with default access.
    case user
    /// Content creator with privileges to upload and manage tunes.
    case creator
    /// Administrative user with full platform access.
    case admin

    /// Human-readable label for UI display.
    var description: String {
        switch self {
        case .user: return "User"
        case .creator: return "Creator"
        case .admin: return "Admin"
        }
    }

    /// Conformance for Identifiable (useful in SwiftUI pickers or lists).
    var id: String { rawValue }
}
