//
//  PurchaseService.swift
//  RevSync
//
//  Created by RevSync on 24/11/2025.
//

import Foundation
import Combine

final class PurchaseService {
    static let shared = PurchaseService()
    private let api = APIClient.shared
    
    // MARK: - Requests
    
    private struct CreatePurchaseRequest: APIRequest {
        typealias Response = PurchaseModel
        let payload: CreatePurchasePayload
        var path: String { "/marketplace/purchases/" }
        var method: HTTPMethod { .POST }
        var body: Data? { jsonBody(payload) }
    }
    
    private struct CreatePurchasePayload: Encodable {
        let tune_id: Int
    }
    
    private struct GetMyPurchasesRequest: APIRequest {
        typealias Response = [PurchaseModel]
        var path: String { "/marketplace/purchases/my/" }
        var method: HTTPMethod { .GET }
    }
    
    // MARK: - Public API
    
    func purchaseTune(tuneId: Int) -> AnyPublisher<PurchaseModel, Error> {
        let payload = CreatePurchasePayload(tune_id: tuneId)
        return api.send(CreatePurchaseRequest(payload: payload))
            .eraseToAnyPublisher()
    }
    
    func getMyPurchases() -> AnyPublisher<[PurchaseModel], Error> {
        api.send(GetMyPurchasesRequest())
            .eraseToAnyPublisher()
    }
}

// MARK: - Models

struct PurchaseModel: Codable, Identifiable {
    let id: Int
    let tune: TuneModel
    let pricePaid: String
    let transactionId: String
    let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id, tune
        case pricePaid = "price_paid"
        case transactionId = "transaction_id"
        case createdAt = "created_at"
    }
}
