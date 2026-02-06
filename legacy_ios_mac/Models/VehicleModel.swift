// VehicleModel.swift
// Represents a vehicle in the garage.
//

import Foundation
import CoreData



/// A vehicle model associated with a user.
/// A vehicle model associated with a user.
struct VehicleModel: Identifiable, Codable {
    var id: Int
    var name: String
    var make: String
    var model: String
    var year: Int
    var vehicleType: VehicleType
    var vin: String?
    var ecuId: String
    var ecuSoftwareVersion: String
    var modifications: [String]
    var photoUrl: String?
    var publicVisibility: Bool = true
    var ecuType: String?
    
    // Helpers
    var displayName: String { "\(year) \(make) \(model)" }
    
    enum CodingKeys: String, CodingKey {
        case id, name, make, model, year, vin, modifications
        case vehicleType = "vehicle_type"
        case ecuId = "ecu_id"
        case ecuSoftwareVersion = "ecu_software_version"
        case photoUrl = "photo_url"
        case publicVisibility = "public_visibility"
        case ecuType = "ecu_type"
    }
}

// Helper for Safety Analysis
struct VehicleSpecs: Codable, Equatable, Hashable {
    var stockHP: Double
    var stockTorque: Double
    
    static let defaultSpecs = VehicleSpecs(stockHP: 180, stockTorque: 100)
}

// MARK: - Core Data Integration
extension VehicleModel {
    func toCoreData(context: NSManagedObjectContext) {
        let entity = VehicleEntity(context: context)
        entity.id = Int64(id)
        entity.name = name
        entity.make = make
        entity.model = model
        entity.year = Int32(year)
        entity.vehicleType = vehicleType.rawValue
        entity.vin = vin
        // ... (rest unchanged)
        // TODO: Update CoreData Model to include these fields
        // entity.ecuId = ecuId
        // entity.ecuSoftwareVersion = ecuSoftwareVersion
        // Store modifications as JSON string or simple comma-separated
        // entity.modifications = try? JSONEncoder().encode(modifications)
        // entity.photoUrl = photoUrl
        // entity.publicVisibility = publicVisibility
        entity.lastUpdated = Date()
        // Note: ecuType not yet in CoreData schema, ignoring for now
    }
    
    static func fromCoreData(_ entity: VehicleEntity) -> VehicleModel {
        var mods: [String] = []
        // if let data = entity.modifications {
        //    mods = (try? JSONDecoder().decode([String].self, from: data)) ?? []
        // }
        
        return VehicleModel(
            id: Int(entity.id),
            name: entity.name ?? "",
            make: entity.make ?? "",
            model: entity.model ?? "",
            year: Int(entity.year),
            vehicleType: VehicleType(rawValue: entity.vehicleType ?? "") ?? .bike,
            vin: entity.vin,
            ecuId: "", 
            ecuSoftwareVersion: "", 
            modifications: mods,
            photoUrl: nil, 
            publicVisibility: true, 
            ecuType: nil 
        )
    }
}


