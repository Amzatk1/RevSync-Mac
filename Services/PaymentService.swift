//
//  PaymentService.swift
//  RevSync
//
//  Created by RevSync on 24/11/2025.
//

import Foundation
import Combine

struct PaymentIntentResponse: Codable {
    let clientSecret: String
    let paymentIntentId: String
}

class PaymentService {
    static let shared = PaymentService()
    private let api = APIClient.shared
    
    func createPaymentIntent(tuneId: UUID) -> AnyPublisher<PaymentIntentResponse, Error> {
        struct CreateIntentRequest: APIRequest {
            typealias Response = PaymentIntentResponse
            let tuneId: UUID
            var path: String { "/payments/create-intent/" }
            var method: HTTPMethod { .POST }
            var body: Data? { jsonBody(["tune_id": tuneId]) }
        }
        
        return api.send(CreateIntentRequest(tuneId: tuneId))
            .eraseToAnyPublisher()
    }
}
