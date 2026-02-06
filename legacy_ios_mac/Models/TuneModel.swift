// TuneModel.swift
// Represents a tune listing in the marketplace.

import Foundation
import CoreData

/// A performance tune listing.
struct TuneModel: Identifiable, Codable {
    var id: UUID
    var title: String
    var slug: String
    var description: String
    var vehicleMake: String
    var vehicleModel: String
    var vehicleYearStart: Int
    var vehicleYearEnd: Int
    var price: Double
    var tuner: TunerProfile?
    var createdAt: Date
    
    // Optional Extended Metadata (May be populated by distinct backend call or future migration)
    var stage: Int?
    var horsepowerGain: Double?
    var torqueGain: Double?
    var safetyRating: Double? // Changed to Double to match entity usage
    var fileSizeKb: Int?
    
    // Derived/Missing in basic listing:
    // compatibility, stage, gains might be optional or in details?
    // The backend serializer 'TuneListingSerializer' has:
    // id, tuner, title, slug, description, vehicle_make, vehicle_model,
    // vehicle_year_start, vehicle_year_end, price, created_at
    
    // Helpers
    var compatibleVehicles: [String] {
        ["\(vehicleMake) \(vehicleModel) (\(vehicleYearStart)-\(vehicleYearEnd))"]
    }
    
    enum CodingKeys: String, CodingKey {
        case id, title, slug, description, price
        case vehicleMake = "vehicle_make"
        case vehicleModel = "vehicle_model"
        case vehicleYearStart = "vehicle_year_start"
        case vehicleYearEnd = "vehicle_year_end"
        case tuner
        case createdAt = "created_at"
        
        // Extended
        case stage
        case horsepowerGain = "horsepower_gain"
        case torqueGain = "torque_gain"
        case safetyRating = "safety_rating"
        case fileSizeKb = "file_size_kb"
    }
    
    struct TunerProfile: Codable {
        var id: UUID
        var businessName: String
        var logoUrl: String?
        var verificationLevel: String
        var averageRating: Double
        
        enum CodingKeys: String, CodingKey {
            case id
            case businessName = "business_name"
            case logoUrl = "logo_url"
            case verificationLevel = "verification_level"
            case averageRating = "average_rating"
        }
    }
    
    // MARK: - Core Data Bridging
    
    func toCoreData(context: NSManagedObjectContext) {
        let entity = TuneEntity(context: context)
        entity.id = id
        entity.title = title
        entity.slug = slug
        entity.desc = description
        entity.price = price
        entity.vehicleMake = vehicleMake
        entity.vehicleModel = vehicleModel
        entity.vehicleYearStart = Int16(vehicleYearStart)
        entity.vehicleYearEnd = Int16(vehicleYearEnd)
        entity.tunerName = tuner?.businessName
        entity.tunerId = tuner?.id
        entity.createdAt = createdAt
    }

    static func fromCoreData(_ entity: TuneEntity) -> TuneModel {
        return TuneModel(
            id: entity.id ?? UUID(),
            title: entity.title ?? "",
            slug: entity.slug ?? "",
            description: entity.desc ?? "",
            vehicleMake: entity.vehicleMake ?? "",
            vehicleModel: entity.vehicleModel ?? "",
            vehicleYearStart: Int(entity.vehicleYearStart),
            vehicleYearEnd: Int(entity.vehicleYearEnd),
            price: entity.price,
            tuner: nil, // Link later or store if flattened
            createdAt: entity.createdAt ?? Date()
        )
    }
}
