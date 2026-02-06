//
//  SafetyAnalysisService.swift
//  RevSync
//
//  Created by RevSync on 20/10/2025.
//

import Foundation
import Combine

struct SafetyReport {
    let overallScore: Int
    let engineScore: Int
    let fuelScore: Int
    let ignitionScore: Int
    let warnings: [String]
    let isSafe: Bool
}

class SafetyAnalysisService: ObservableObject {
    static let shared = SafetyAnalysisService()
    
    private init() {}
    
    private let api = APIClient.shared

    // MARK: - Requests
    private struct AnalyzeRequest: APIRequest {
        struct Body: Encodable {
            let listing_id: UUID
            let vehicle_id: Int
        }
        typealias Response = SafetyReportResponse
        let tuneId: UUID
        let vehicleId: Int
        
        var path: String { "/safety/analyze/" }
        var method: HTTPMethod { .POST }
        var body: Data? { jsonBody(Body(listing_id: tuneId, vehicle_id: vehicleId)) }
    }

    // MARK: - DTOs
    struct SafetyReportResponse: Decodable {
        let id: Int
        let riskScore: Int 
        let status: String 
        let recommendations: [String]
        let analysisResult: [String: String]? 
    }

    // MARK: - Public API
    /// Analyzes a tune against a specific vehicle using the backend Safety Engine.
    func analyze(tuneId: UUID, vehicleId: Int) -> AnyPublisher<SafetyReport, Error> {
        api.send(AnalyzeRequest(tuneId: tuneId, vehicleId: vehicleId))
            .map { response in
                self.mapToDomain(response)
            }
            .eraseToAnyPublisher()
    }
    
    private func mapToDomain(_ response: SafetyReportResponse) -> SafetyReport {
        // Backend: Risk Score 0-100 (Higher is Riskier)
        // UI: Safety Score 0-10 (Higher is Safer)
        let safetyScore = max(0, min(10, (100 - response.riskScore) / 10))
        
        return SafetyReport(
            overallScore: safetyScore,
            // For now, assume uniform sub-scores until backend provides breakdown
            engineScore: safetyScore,
            fuelScore: safetyScore,
            ignitionScore: safetyScore,
            warnings: response.recommendations,
            isSafe: response.status == "SAFE"
        )
    }
    
    // Keep client-side fallback for offline/preview if needed, or remove it.
    // For now, we'll remove the old `analyze` methods to enforce backend usage.
}
