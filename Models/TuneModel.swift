// TuneModel.swift
// Represents a tune in the marketplace.
//

import Foundation
import CoreData

/// A performance tune authored by a creator.
/// A performance tune authored by a creator.
struct TuneModel: Identifiable, Codable {
    var id: Int
    var name: String
    var description: String
    var vehicleMake: String
    var vehicleModel: String
    var vehicleYearStart: Int
    var vehicleYearEnd: Int
    var ecuCompatibility: [String]
    var stage: Int
    var horsepowerGain: Double?
    var torqueGain: Double?
    var dynoChartUrl: String?
    var fileUrl: String
    var fileSizeKb: Int
    var price: Double
    var isActive: Bool
    var safetyRating: Int
    var creator: TunerProfile?
    
    // Helpers
    var compatibleVehicles: [String] {
        ["\(vehicleMake) \(vehicleModel) (\(vehicleYearStart)-\(vehicleYearEnd))"]
    }
    
    enum CodingKeys: String, CodingKey {
        case id, name, description, stage, price
        case vehicleMake = "vehicle_make"
        case vehicleModel = "vehicle_model"
        case vehicleYearStart = "vehicle_year_start"
        case vehicleYearEnd = "vehicle_year_end"
        case ecuCompatibility = "ecu_compatibility"
        case horsepowerGain = "horsepower_gain"
        case torqueGain = "torque_gain"
        case dynoChartUrl = "dyno_chart_url"
        case fileUrl = "file_url"
        case fileSizeKb = "file_size_kb"
        case isActive = "is_active"
        case safetyRating = "safety_rating"
        case creator
    }
    
    struct TunerProfile: Codable {
        var id: Int
        var businessName: String
        var logoUrl: String?
        var verificationLevel: String
        
        enum CodingKeys: String, CodingKey {
            case id
            case businessName = "business_name"
            case logoUrl = "logo_url"
            case verificationLevel = "verification_level"
        }
    }
    // MARK: - Core Data Bridging
    
    func toCoreData(context: NSManagedObjectContext) {
        let entity = TuneEntity(context: context)
        // casting ID to UUID (fake) or just not storing it properly if schema mismatch.
        // Assuming we update schema later. For now, we just populate other fields.
        entity.name = name
        entity.desc = description // "desc" in schema
        entity.price = price
        entity.horsepowerGain = horsepowerGain ?? 0.0
        entity.torqueGain = torqueGain ?? 0.0
        entity.stage = Int16(stage)
        entity.safetyRating = Double(safetyRating)
        entity.ecuCompatibility = ecuCompatibility.joined(separator: ",")
        entity.dynoChartUrl = dynoChartUrl
        // Missing fields in schema: vehicleMake, vehicleModel, fileUrl, etc.
    }

    static func fromCoreData(_ entity: TuneEntity) -> TuneModel {
        return TuneModel(
            id: 0, // Placeholder
            name: entity.name ?? "",
            description: entity.desc ?? "",
            vehicleMake: "Unknown", // Schema missing make
            vehicleModel: "Unknown", // Schema missing model
            vehicleYearStart: 0,
            vehicleYearEnd: 0,
            ecuCompatibility: (entity.ecuCompatibility ?? "").components(separatedBy: ","),
            stage: Int(entity.stage),
            horsepowerGain: entity.horsepowerGain,
            torqueGain: entity.torqueGain,
            dynoChartUrl: entity.dynoChartUrl,
            fileUrl: "",
            fileSizeKb: 0,
            price: entity.price,
            isActive: true,
            safetyRating: Int(entity.safetyRating),
            creator: nil
        )
    }
}
