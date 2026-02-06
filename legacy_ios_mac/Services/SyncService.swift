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
        // Fetch first page of vehicles from API
        return GarageService().list(page: 1) // Using new instance as workaround or shared if public
            .handleEvents(receiveOutput: { [weak self] page in
                self?.saveVehiclesToCoreData(page.results)
            })
            .map { _ in () }
            .eraseToAnyPublisher()
    }
    
    private func saveVehiclesToCoreData(_ vehicles: [VehicleModel]) {
        context.perform {
            // Simple strategy: Delete all and replace for now (or update existing)
            // For MVP, replacing ensures consistency without complex merging
            let fetchRequest: NSFetchRequest<NSFetchRequestResult> = VehicleEntity.fetchRequest()
            let deleteRequest = NSBatchDeleteRequest(fetchRequest: fetchRequest)
            
            do {
                try self.context.execute(deleteRequest)
                
                for vehicle in vehicles {
                    vehicle.toCoreData(context: self.context)
                }
                
                try self.context.save()
            } catch {
                print("Failed to save vehicles to Core Data: \(error)")
            }
        }
    }
    
    // MARK: - Tunes
    func syncTunes() -> AnyPublisher<Void, Error> {
        // Fetch tunes from marketplace (Phase 1: just first page)
        return MarketplaceService.shared.getTunes(page: 1)
            .handleEvents(receiveOutput: { [weak self] page in
                self?.saveTunesToCoreData(page.results)
            })
            .map { _ in () }
            .eraseToAnyPublisher()
    }
    
    private func saveTunesToCoreData(_ tunes: [TuneModel]) {
        context.perform {
             // Clean slate for cache
            let fetchRequest: NSFetchRequest<NSFetchRequestResult> = TuneEntity.fetchRequest()
            let deleteRequest = NSBatchDeleteRequest(fetchRequest: fetchRequest)
             
            do {
                _ = try self.context.execute(deleteRequest)
                
                for tune in tunes {
                    tune.toCoreData(context: self.context)
                }
                
                try self.context.save()
            } catch {
                print("Failed to save tunes to Core Data: \(error)")
            }
        }
    }
}
