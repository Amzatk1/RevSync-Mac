// TuneModel.swift
// Represents a tune in the marketplace.
//

import Foundation

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
    // Placeholder for Core Data integration properties and methods.
}
