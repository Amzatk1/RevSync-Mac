//
//  VehicleType.swift
//  RevSync
//
//  Created by Ayooluwa Karim on 20/10/2025.
//

import Foundation

/// Represents supported vehicle classes in RevSync.
/// This is used throughout the app for filtering, compatibility, and UI.
enum VehicleType: String, Codable, CaseIterable, Identifiable {
    /// Motorcycles of any displacement.
    case bike
    /// Passenger cars and light vehicles.
    case car

    /// Human‑readable label for display in the UI.
    var description: String {
        switch self {
        case .bike: return "Bike"
        case .car:  return "Car"
        }
    }

    /// Conformance for Identifiable (useful in SwiftUI pickers).
    var id: String { rawValue }
}
