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
        struct PaymentRequest: Codable {
            let tune_id: UUID
        }
        
        let request = PaymentRequest(tune_id: tuneId)
        
        // Construct URL manually since we haven't defined a Request object for this yet
        // In a full implementation, we'd add a struct conforming to APIRequest
        guard let url = URL(string: "\(api.baseURL)/payments/create-intent/") else {
            return Fail(error: URLError(.badURL)).eraseToAnyPublisher()
        }
        
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add Auth Token
        if let token = AuthManager.shared.accessToken {
            urlRequest.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        do {
            urlRequest.httpBody = try JSONEncoder().encode(request)
        } catch {
            return Fail(error: error).eraseToAnyPublisher()
        }
        
        return URLSession.shared.dataTaskPublisher(for: urlRequest)
            .map(\.data)
            .decode(type: PaymentIntentResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }
}
