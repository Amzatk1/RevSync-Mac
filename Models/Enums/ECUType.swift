//
//  ECUType.swift
//


import Foundation

/// Represents supported ECU (Engine Control Unit) communication protocols or manufacturers.
/// Used for determining tune compatibility and flash methods.
enum ECUType: String, Codable, CaseIterable, Identifiable {
    case obdII = "OBDII"
    case can = "CAN"
    case kwp2000 = "KWP2000"
    case uds = "UDS"
    case other = "Other"

    /// User-friendly display name for UI.
    var description: String {
        switch self {
        case .obdII: return "OBD-II"
        case .can: return "CAN Bus"
        case .kwp2000: return "KWP2000"
        case .uds: return "UDS Protocol"
        case .other: return "Other / Custom"
        }
    }

    /// Conformance for Identifiable (used in SwiftUI Pickers).
    var id: String { rawValue }
}
