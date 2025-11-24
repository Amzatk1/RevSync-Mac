//  GarageService.swift
//  Real Django calls for vehicles (Phase‑1)
//

import Foundation
import Combine

/// Provides CRUD operations for the user's garage.
final class GarageService {
    private let api = APIClient.shared

    // MARK: - Requests
    private struct VehicleListRequest: APIRequest {
        typealias Response = Paginated<VehicleModel>
        let page: Int?
        var path: String { "/garage/" }
        var method: HTTPMethod { .GET }
        var queryItems: [URLQueryItem]? {
            if let page = page {
                return [URLQueryItem(name: "page", value: String(page))]
            }
            return nil
        }
    }

    private struct VehicleDetailRequest: APIRequest {
        typealias Response = VehicleModel
        let id: Int
        var path: String { "/garage/\(id)/" }
        var method: HTTPMethod { .GET }
    }

    private struct VehicleCreateRequest: APIRequest {
        typealias Response = VehicleModel
        let payload: VehicleModel
        var path: String { "/garage/" }
        var method: HTTPMethod { .POST }
        var body: Data? { jsonBody(payload) }
    }

    private struct VehicleUpdateRequest: APIRequest {
        typealias Response = VehicleModel
        let id: Int
        let payload: VehicleModel
        var path: String { "/garage/\(id)/" }
        var method: HTTPMethod { .PUT } // or PATCH
        var body: Data? { jsonBody(payload) }
    }

    private struct VehicleDeleteRequest: APIRequest {
        struct Empty: Decodable {}
        typealias Response = Empty
        let id: Int
        var path: String { "/garage/\(id)/" }
        var method: HTTPMethod { .DELETE }
    }

    // MARK: - Public API
    /// Lists vehicles.
    func list(page: Int? = nil) -> AnyPublisher<Paginated<VehicleModel>, Error> {
        api.send(VehicleListRequest(page: page))
            .eraseToAnyPublisher()
    }

    /// Fetches a single vehicle by id.
    func get(id: Int) -> AnyPublisher<VehicleModel, Error> {
        api.send(VehicleDetailRequest(id: id)).eraseToAnyPublisher()
    }

    /// Creates a new vehicle entry.
    func create(_ vehicle: VehicleModel) -> AnyPublisher<VehicleModel, Error> {
        api.send(VehicleCreateRequest(payload: vehicle))
            .eraseToAnyPublisher()
    }

    /// Updates an existing vehicle by id.
    func update(id: Int, vehicle: VehicleModel) -> AnyPublisher<VehicleModel, Error> {
        api.send(VehicleUpdateRequest(id: id, payload: vehicle))
            .eraseToAnyPublisher()
    }

    /// Deletes a vehicle by id.
    func delete(id: Int) -> AnyPublisher<Void, Error> {
        api.send(VehicleDeleteRequest(id: id))
            .map { _ in () }
            .eraseToAnyPublisher()
    }
}
