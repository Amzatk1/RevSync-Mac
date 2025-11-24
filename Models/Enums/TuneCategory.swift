//
//  TuneCategory.swift
//  
//
//  Created by Ayooluwa  Karim on 20/10/2025.
//


//
//  TuneCategory.swift
//  RevSync
//
//  Created by Ayooluwa Karim on 20/10/2025.
//

import Foundation

/// Represents the category or purpose of a tune in the marketplace.
/// Categories help users filter tunes by driving style or performance goal.
enum TuneCategory: String, Codable, CaseIterable, Identifiable {
    /// Focused on maximum horsepower, torque, and acceleration.
    case performance
    /// Tuned for optimal fuel efficiency and low emissions.
    case economy
    /// Calibrated for racetrack and competitive driving.
    case track
    /// Designed for off-road vehicles or rough terrain.
    case offRoad
    /// Custom or user-specific configurations.
    case custom

    /// Readable label for displaying in UI.
    var description: String {
        switch self {
        case .performance: return "Performance"
        case .economy:     return "Economy"
        case .track:       return "Track / Race"
        case .offRoad:     return "Off-Road"
        case .custom:      return "Custom"
        }
    }

    /// Conformance for Identifiable (useful in SwiftUI pickers).
    var id: String { rawValue }
}
