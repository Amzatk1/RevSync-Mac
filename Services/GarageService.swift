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
        let vehicleType: VehicleType?
        let page: Int?
        var path: String { "/garage/" }
        var method: HTTPMethod { .GET }
        var queryItems: [URLQueryItem]? {
            var items: [URLQueryItem] = []
            if let page = page {
                items.append(URLQueryItem(name: "page", value: String(page)))
            }
            if let type = vehicleType {
                items.append(URLQueryItem(name: "vehicle_type", value: type.rawValue))
            }
            return items.isEmpty ? nil : items
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

    private struct VehicleSearchRequest: APIRequest {
        typealias Response = [VehicleDefinition]
        let query: String
        var path: String { "/garage/definitions/" }
        var method: HTTPMethod { .GET }
        var queryItems: [URLQueryItem]? {
            [URLQueryItem(name: "search", value: query)]
        }
    }

    // MARK: - Public API
    /// Lists vehicles.
    func list(vehicleType: VehicleType? = nil, page: Int? = nil) -> AnyPublisher<Paginated<VehicleModel>, Error> {
        api.send(VehicleListRequest(vehicleType: vehicleType, page: page))
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

    /// Searches for vehicle definitions.
    func searchDefinitions(query: String) -> AnyPublisher<[VehicleDefinition], Error> {
        api.send(VehicleSearchRequest(query: query))
            .eraseToAnyPublisher()
    }
}
