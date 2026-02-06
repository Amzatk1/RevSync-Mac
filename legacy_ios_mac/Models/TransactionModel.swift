// TransactionModel.swift
// Represents a purchase transaction.
//

import Foundation

/// An order for a tune placed by a user.
/// An order for a tune placed by a user.
struct TransactionModel: Identifiable, Codable {
    /// Unique identifier for the transaction.
    var id: Int
    
    /// Identifier of the tune being purchased.
    var tuneId: Int
    
    /// Identifier of the user who placed the order.
    var userId: Int
    
    /// The amount paid.
    var pricePaid: Double
    
    /// The transaction ID (e.g. Stripe ID).
    var transactionId: String
    
    /// The date when the transaction was created.
    var createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case tuneId = "tune" // Backend returns full object or ID depending on serializer, assuming ID for write, object for read?
                             // Wait, PurchaseSerializer has `tune = TuneSerializer(read_only=True)` and `tune_id = PrimaryKeyRelatedField(write_only=True)`.
                             // So reading returns nested tune object.
                             // I should probably map `tune` object to `tuneId` or keep nested object.
                             // For simplicity, let's assume I want to store the ID.
                             // But if backend returns nested object, decoding `tuneId` from `tune.id` requires custom decoding.
                             // Let's check PurchaseSerializer again.
                             // `tune` field is `TuneSerializer`.
                             // So JSON is `{ "tune": { "id": 1, ... }, ... }`.
                             // I'll add `tune: TuneModel` and computed `tuneId`.
        case userId = "user" // Same for user.
        case pricePaid = "price_paid"
        case transactionId = "transaction_id"
        case createdAt = "created_at"
    }
    
    // Custom decoding to handle nested objects if needed, or just store nested objects.
    // Let's store nested objects to be safe and useful.
    var tune: TuneModel?
    var user: UserModel?
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(Int.self, forKey: .id)
        pricePaid = try container.decode(Double.self, forKey: .pricePaid)
        transactionId = try container.decode(String.self, forKey: .transactionId)
        createdAt = try container.decode(Date.self, forKey: .createdAt)
        
        // Handle nested objects
        if let tuneObj = try? container.decode(TuneModel.self, forKey: .tuneId) {
            tune = tuneObj
            tuneId = tuneObj.id
        } else {
            // Fallback if it's just an ID (unlikely with current serializer)
            tuneId = 0 
        }
        
        if let userObj = try? container.decode(UserModel.self, forKey: .userId) {
            user = userObj
            userId = userObj.id
        } else {
            userId = 0
        }
    }
    
    // Encodable conformance if needed (mostly for local storage)
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(pricePaid, forKey: .pricePaid)
        try container.encode(transactionId, forKey: .transactionId)
        try container.encode(createdAt, forKey: .createdAt)
        try container.encode(tune, forKey: .tuneId)
        try container.encode(user, forKey: .userId)
    }
}
