//
//  SyncService.swift
//  RevSync
//
//  Created by RevSync on 24/11/2025.
//

import Foundation
import CoreData
import Combine

class SyncService: ObservableObject {
    static let shared = SyncService()
    private let context = PersistenceController.shared.container.viewContext
    private let api = APIClient.shared
    private var cancellables = Set<AnyCancellable>()
    
    @Published var isSyncing = false
    
    func syncAll() {
        isSyncing = true
        
        // Chain sync operations
        syncVehicles()
            .flatMap { _ in self.syncTunes() }
            .sink(receiveCompletion: { completion in
                DispatchQueue.main.async {
                    self.isSyncing = false
                    if case .failure(let error) = completion {
                        print("Sync failed: \(error)")
                    } else {
                        print("Sync completed successfully")
                    }
                }
            }, receiveValue: { _ in })
            .store(in: &cancellables)
    }
    
    // MARK: - Vehicles
    func syncVehicles() -> AnyPublisher<Void, Error> {
        // 1. Fetch from API
        return api.send(GetGarageRequest())
            .handleEvents(receiveOutput: { [weak self] vehicles in
                // 2. Save to Core Data
                self?.saveVehiclesToCoreData(vehicles)
            })
            .map { _ in () }
            .eraseToAnyPublisher()
    }
    
    private func saveVehiclesToCoreData(_ vehicles: [VehicleModel]) {
        context.performAndWait {
            // Simple strategy: Delete all and re-insert (for MVP)
            // In production, use merge policy and unique constraints
            let fetchRequest: NSFetchRequest<NSFetchRequestResult> = Vehicle.fetchRequest()
            let deleteRequest = NSBatchDeleteRequest(fetchRequest: fetchRequest)
            
            do {
                try context.execute(deleteRequest)
                
                for vehicle in vehicles {
                    let cdVehicle = Vehicle(context: context)
                    cdVehicle.id = UUID(uuidString: String(vehicle.id)) // Assuming ID mapping
                    cdVehicle.name = vehicle.name
                    cdVehicle.make = vehicle.make
                    cdVehicle.model = vehicle.model
                    cdVehicle.year = Int16(vehicle.year)
                    cdVehicle.vin = vehicle.vin
                    // Map other fields...
                }
                try context.save()
            } catch {
                print("Core Data save error: \(error)")
            }
        }
    }
    
    // MARK: - Tunes
    func syncTunes() -> AnyPublisher<Void, Error> {
        // Placeholder for Tune sync logic
        return Just(()).setFailureType(to: Error.self).eraseToAnyPublisher()
    }
}
