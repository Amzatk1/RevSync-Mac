//
//  VehicleDatabaseService.swift
//  RevSync
//
//  Created by RevSync on 20/10/2025.
//

import Foundation

// MARK: - Data Models
struct VehicleDatabase: Codable {
    let bikes: [VehicleMakeData]
    let cars: [VehicleMakeData]
}

struct VehicleMakeData: Codable, Identifiable, Hashable {
    var id: String { make }
    let make: String
    let models: [VehicleModelData]
}

struct VehicleModelData: Codable, Identifiable, Hashable {
    var id: String { name }
    let name: String
    let years: [String]
    let specs: VehicleSpecs?
}

// MARK: - Service
final class VehicleDatabaseService: ObservableObject {
    static let shared = VehicleDatabaseService()
    
    @Published private(set) var database: VehicleDatabase?
    private var cancellables = Set<AnyCancellable>()
    
    private init() {
        loadDatabase()
    }
    
    private func loadDatabase() {
        // Fetch from backend API
        APIClient.shared.send(VehicleDefinitionsRequest())
            .receive(on: DispatchQueue.main)
            .sink { completion in
                if case let .failure(error) = completion {
                    print("Failed to fetch vehicle definitions: \(error)")
                    // Fallback to local file if API fails
                    self.loadFromFilesystem()
                }
            } receiveValue: { [weak self] definitions in
                self?.database = self?.transformToDatabase(definitions)
            }
            .store(in: &cancellables)
    }
    
    private func transformToDatabase(_ definitions: [VehicleDefinitionDTO]) -> VehicleDatabase {
        var bikeMakes: [String: [VehicleDefinitionDTO]] = [:]
        var carMakes: [String: [VehicleDefinitionDTO]] = [:]
        
        for def in definitions {
            if def.vehicleType == "BIKE" {
                bikeMakes[def.make, default: []].append(def)
            } else {
                carMakes[def.make, default: []].append(def)
            }
        }
        
        let bikes = bikeMakes.map { make, defs -> VehicleMakeData in
            let models = Dictionary(grouping: defs, by: { $0.model }).map { modelName, modelDefs -> VehicleModelData in
                let years = modelDefs.map { String($0.year) }.sorted(by: >)
                // Use specs from the newest year
                let newest = modelDefs.max(by: { $0.year < $1.year })
                let specs = VehicleSpecs(stockHP: newest?.stockHp ?? 0, stockTorque: newest?.stockTorque ?? 0)
                return VehicleModelData(name: modelName, years: years, specs: specs)
            }.sorted(by: { $0.name < $1.name })
            return VehicleMakeData(make: make, models: models)
        }.sorted(by: { $0.make < $1.make })
        
        let cars = carMakes.map { make, defs -> VehicleMakeData in
            let models = Dictionary(grouping: defs, by: { $0.model }).map { modelName, modelDefs -> VehicleModelData in
                let years = modelDefs.map { String($0.year) }.sorted(by: >)
                let newest = modelDefs.max(by: { $0.year < $1.year })
                let specs = VehicleSpecs(stockHP: newest?.stockHp ?? 0, stockTorque: newest?.stockTorque ?? 0)
                return VehicleModelData(name: modelName, years: years, specs: specs)
            }.sorted(by: { $0.name < $1.name })
            return VehicleMakeData(make: make, models: models)
        }.sorted(by: { $0.make < $1.make })
        
        return VehicleDatabase(bikes: bikes, cars: cars)
    }
    
    private func loadFromFilesystem() {
        // This is a helper for the agent environment where Bundle.main might not update immediately
        let path = "/Users/ayooluwakarim/RevSyncApp/Resources/VehicleDatabase.json"
        let url = URL(fileURLWithPath: path)
        do {
            let data = try Data(contentsOf: url)
            database = try JSONDecoder().decode(VehicleDatabase.self, from: data)
        } catch {
            print("Failed to load VehicleDatabase from filesystem: \(error)")
        }
    }
    
    // MARK: - Public API
    
    func getMakes(for type: VehicleType) -> [String] {
        guard let db = database else { return [] }
        let makes = type == .bike ? db.bikes : db.cars
        return makes.map { $0.make }.sorted()
    }
    
    func getModels(for make: String, type: VehicleType) -> [String] {
        guard let db = database else { return [] }
        let makes = type == .bike ? db.bikes : db.cars
        guard let makeData = makes.first(where: { $0.make == make }) else { return [] }
        return makeData.models.map { $0.name }.sorted()
    }
    
    func getYears(for model: String, make: String, type: VehicleType) -> [String] {
        guard let db = database else { return [] }
        let data = type == .bike ? db.bikes : db.cars
        guard let makeData = data.first(where: { $0.make == make }),
              let modelData = makeData.models.first(where: { $0.name == model }) else {
            return []
        }
        return modelData.years.sorted(by: >) // Newest first
    }
    
    func getSpecs(for model: String, make: String, type: VehicleType) -> VehicleSpecs? {
        guard let db = database else { return nil }
        let data = type == .bike ? db.bikes : db.cars
        guard let makeData = data.first(where: { $0.make == make }),
              let modelData = makeData.models.first(where: { $0.name == model }) else {
            return nil
        }
        return modelData.specs
    }
}

// MARK: - API Request & DTOs
import Combine

struct VehicleDefinitionsRequest: APIRequest {
    typealias Response = [VehicleDefinitionDTO]
    var path: String { "/garage/definitions/" }
    var method: HTTPMethod { .GET }
    var requiresAuth: Bool { false }
}

struct VehicleDefinitionDTO: Codable {
    let id: Int
    let vehicleType: String
    let make: String
    let model: String
    let year: Int
    let stockHp: Double
    let stockTorque: Double
}

// MARK: - Internal Models
private struct RootDatabase: Codable {
    let bikes: [MakeData]
    let cars: [MakeData]
}

private struct MakeData: Codable {
    let make: String
    let models: [ModelData]
}

private struct ModelData: Codable {
    let name: String
    let years: [String]
    let specs: VehicleSpecs?
}
