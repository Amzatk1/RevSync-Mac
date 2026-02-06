//
//  FlashService.swift
//  RevSync
//
//  Created by RevSync on 24/11/2025.
//

import Foundation
import Combine

final class FlashService {
    static let shared = FlashService()
    private let api = APIClient.shared
    
    // MARK: - Requests
    
    private struct CreateFlashJobRequest: APIRequest {
        typealias Response = FlashJobModel
        let payload: CreateFlashJobPayload
        var path: String { "/garage/flash-jobs/" }
        var method: HTTPMethod { .POST }
        var body: Data? { jsonBody(payload) }
    }
    
    private struct CreateFlashJobPayload: Encodable {
        let vehicle_id: Int
        let listing_id: UUID
    }
    
    // ...
    
    func createJob(vehicleId: Int, listingId: UUID) -> AnyPublisher<FlashJobModel, Error> {
        let payload = CreateFlashJobPayload(vehicle_id: vehicleId, listing_id: listingId)
        return api.send(CreateFlashJobRequest(payload: payload))
            .eraseToAnyPublisher()
    }
    
    func updateJob(id: Int, status: FlashJobModel.Status? = nil, progress: Int? = nil, logs: [String]? = nil) -> AnyPublisher<FlashJobModel, Error> {
        let payload = UpdateFlashJobPayload(
            status: status?.rawValue,
            progress: progress,
            logs: logs
        )
        return api.send(UpdateFlashJobRequest(jobId: id, payload: payload))
            .eraseToAnyPublisher()
    }
}

// MARK: - Models

struct FlashJobModel: Codable, Identifiable {
    let id: Int
    let status: Status
    let progress: Int
    let logs: [String]
    let createdAt: Date
    
    enum Status: String, Codable {
        case pending = "PENDING"
        case flashing = "FLASHING"
        case completed = "COMPLETED"
        case failed = "FAILED"
    }
    
    enum CodingKeys: String, CodingKey {
        case id, status, progress, logs
        case createdAt = "created_at"
    }
}
