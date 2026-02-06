// UserModel.swift
// Defines a user for RevSync.
//

import Foundation



/// A user model matching backend representation.
/// A user model matching backend representation.
struct UserModel: Identifiable, Codable {
    /// Unique identifier of the user (Backend ID).
    var id: Int

    /// Username.
    var username: String

    /// Email address.
    var email: String
    
    /// First name.
    var firstName: String?
    
    /// Last name.
    var lastName: String?
    
    /// Computed full name.
    var fullName: String {
        [firstName, lastName].compactMap { $0 }.joined(separator: " ")
    }

    /// User Role.
    var role: UserRole
    
    /// Verification status.
    var isVerified: Bool

    /// Nested Profile Data.
    var profile: UserProfile?

    // MARK: - Nested Types
    
    struct UserProfile: Codable {
        var bio: String?
        var country: String?
        var photoUrl: String?
        var experienceLevel: String?
        var ridingStyle: String?
        var riskTolerance: String?
        var isGaragePublic: Bool?
        var lastActive: Date?
        
        enum CodingKeys: String, CodingKey {
            case bio, country
            case photoUrl = "photo_url"
            case experienceLevel = "experience_level"
            case ridingStyle = "riding_style"
            case riskTolerance = "risk_tolerance"
            case isGaragePublic = "is_garage_public"
            case lastActive = "last_active"
        }
    }

    enum UserRole: String, Codable {
        case rider = "RIDER"
        case tuner = "TUNER"
        case creator = "CREATOR"
        case admin = "ADMIN"
    }
    
    // Helpers for UI compatibility
    var isCreator: Bool { role == .creator }
    var isTuner: Bool { role == .tuner }
}
