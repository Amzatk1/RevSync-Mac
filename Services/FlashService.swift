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
        let vehicle: Int
        let tune: Int
    }
    
    private struct UpdateFlashJobRequest: APIRequest {
        typealias Response = FlashJobModel
        let jobId: Int
        let payload: UpdateFlashJobPayload
        var path: String { "/garage/flash-jobs/\(jobId)/" }
        var method: HTTPMethod { .PATCH }
        var body: Data? { jsonBody(payload) }
    }
    
    private struct UpdateFlashJobPayload: Encodable {
        let status: String?
        let progress: Int?
        let logs: [String]?
    }
    
    // MARK: - Public API
    
    func createJob(vehicleId: Int, tuneId: Int) -> AnyPublisher<FlashJobModel, Error> {
        let payload = CreateFlashJobPayload(vehicle: vehicleId, tune: tuneId)
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
