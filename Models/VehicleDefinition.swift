// VehicleDefinition.swift
// Represents a reference vehicle from the database.
//

import Foundation

/// A definition of a vehicle supported by the platform.
struct VehicleDefinition: Identifiable, Codable {
    var id: Int
    var vehicleType: VehicleType
    var make: String
    var model: String
    var year: Int
    var stockHP: Double
    var stockTorque: Double
    
    enum CodingKeys: String, CodingKey {
        case id, make, model, year
        case vehicleType = "vehicle_type"
        case stockHP = "stock_hp"
        case stockTorque = "stock_torque"
    }
}

// Enum removed to avoid ambiguity with Models/Enums/VehicleType.swift
