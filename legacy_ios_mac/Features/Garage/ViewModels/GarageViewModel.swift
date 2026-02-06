//  GarageViewModel.swift
//  Coordinates Garage UI with GarageService using Combine.
//

import Foundation
import Combine
import CoreData

final class GarageViewModel: ObservableObject {
    // MARK: - Published state
    @Published private(set) var vehicles: [VehicleModel] = []
    @Published var isLoading: Bool = false
    @Published var errorMessage: String? = nil

    // UI flags
    @Published var isShowingAddVehicle: Bool = false
    @Published var isShowingScanner: Bool = false

    // MARK: - Dependencies
    public let garageService: GarageService
    private let persistence: PersistenceController
    private var toast: ToastManager?
    var cancellables = Set<AnyCancellable>()

    // Pagination (if backend supports page numbers)
    private var nextPage: Int? = 1
    private var isFetchingMore = false

    // Remember last filter so we can refresh easily
    private var lastVehicleType: VehicleType? = nil

    // MARK: - Init
    init(service: GarageService = GarageService(), persistence: PersistenceController = .shared, toast: ToastManager? = nil) {
        self.garageService = service
        self.persistence = persistence
        self.toast = toast
        // Load cached data immediately
        loadFromCoreData()
    }
    
    func configure(toast: ToastManager) {
        self.toast = toast
    }

    // MARK: - Loading
    func loadVehicles(vehicleType: VehicleType? = nil, reset: Bool = true) {
        if reset { isLoading = true; nextPage = 1 }
        errorMessage = nil
        lastVehicleType = vehicleType

        garageService.list(vehicleType: vehicleType, page: nextPage)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] (completion: Subscribers.Completion<Error>) in
                guard let self = self else { return }
                self.isLoading = false
                self.isFetchingMore = false
                if case let .failure(error) = completion {
                    let msg = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
                    self.errorMessage = msg
                    self.toast?.showError("Failed to load vehicles: \(msg)")
                    // On error, we still have Core Data content shown
                }
            } receiveValue: { [weak self] (page: Paginated<VehicleModel>) in
                guard let self = self else { return }
                
                // Update Core Data with fresh results
                self.syncToCoreData(vehicles: page.results, isReset: reset)
                
                // Update in-memory list from Core Data to ensure consistency
                self.loadFromCoreData()
                
                if let _ = page.count, !page.results.isEmpty {
                    if let currentPage = self.nextPage { self.nextPage = currentPage + 1 }
                } else if page.results.isEmpty {
                    self.nextPage = nil
                }
            }
            .store(in: &cancellables)
    }

    func loadMoreIfNeeded(currentItem item: VehicleModel?) {
        guard let item = item else { return }
        let thresholdIndex = vehicles.index(vehicles.endIndex, offsetBy: -5, limitedBy: vehicles.startIndex) ?? vehicles.startIndex
        if vehicles.firstIndex(where: { $0.id == item.id }) == thresholdIndex {
            fetchNextPage()
        }
    }

    private func fetchNextPage() {
        guard !isFetchingMore, let page = nextPage else { return }
        isFetchingMore = true
        garageService.list(vehicleType: lastVehicleType, page: page)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] (completion: Subscribers.Completion<Error>) in
                guard let self = self else { return }
                self.isFetchingMore = false
                if case let .failure(error) = completion {
                    let msg = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
                    self.errorMessage = msg
                    self.toast?.showError("Failed to load more vehicles: \(msg)")
                }
            } receiveValue: { [weak self] (page: Paginated<VehicleModel>) in
                guard let self = self else { return }
                self.vehicles.append(contentsOf: page.results)
                if page.results.isEmpty { self.nextPage = nil } else { self.nextPage = (self.nextPage ?? 1) + 1 }
                // Sync appended results to Core Data
                self.syncToCoreData(vehicles: page.results, isReset: false)
            }
            .store(in: &cancellables)
    }

    // MARK: - Mutations (optimistic)
    func addVehicle(_ vehicle: VehicleModel) {
        errorMessage = nil
        // optimistic insert
        vehicles.insert(vehicle, at: 0)
        
        // Persist optimistically
        persistence.performBackground { context in
            vehicle.toCoreData(context: context)
        }

        garageService.create(vehicle)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] (completion: Subscribers.Completion<Error>) in
                guard let self = self else { return }
                if case let .failure(error) = completion {
                    // rollback optimistic insert
                    self.vehicles.removeAll { $0.id == vehicle.id }
                    let msg = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
                    self.errorMessage = msg
                    self.toast?.showError("Failed to add vehicle: \(msg)")
                    // Rollback Core Data
                    self.persistence.performBackground { context in
                        let request: NSFetchRequest<VehicleEntity> = VehicleEntity.fetchRequest()
                        request.predicate = NSPredicate(format: "id == %d", vehicle.id)
                        if let entity = try? context.fetch(request).first {
                            context.delete(entity)
                        }
                    }
                }
            } receiveValue: { [weak self] (created: VehicleModel) in
                guard let self = self else { return }
                // replace optimistic item with canonical server version (in case IDs/fields differ)
                if let idx = self.vehicles.firstIndex(where: { $0.id == vehicle.id }) {
                    self.vehicles[idx] = created
                } else {
                    self.vehicles.insert(created, at: 0)
                }
                // Update Core Data with server version
                self.persistence.performBackground { context in
                    created.toCoreData(context: context)
                }
                self.toast?.showSuccess("Vehicle added successfully")
            }
            .store(in: &cancellables)
    }

    func updateVehicle(id: Int, with updated: VehicleModel) {
        errorMessage = nil
        guard let index = vehicles.firstIndex(where: { $0.id == id }) else { return }
        let previous = vehicles[index]
        // optimistic update
        vehicles[index] = updated
        
        // Persist optimistically
        persistence.performBackground { context in
            updated.toCoreData(context: context)
        }

        garageService.update(id: id, vehicle: updated)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] (completion: Subscribers.Completion<Error>) in
                guard let self = self else { return }
                if case let .failure(error) = completion {
                    // rollback
                    self.vehicles[index] = previous
                    let msg = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
                    self.errorMessage = msg
                    self.toast?.showError("Failed to update vehicle: \(msg)")
                    
                    // Rollback Core Data
                    self.persistence.performBackground { context in
                        previous.toCoreData(context: context)
                    }
                }
            } receiveValue: { [weak self] (server: VehicleModel) in
                guard let self = self else { return }
                self.vehicles[index] = server
                // Update Core Data
                self.persistence.performBackground { context in
                    server.toCoreData(context: context)
                }
                self.toast?.showSuccess("Vehicle updated")
            }
            .store(in: &cancellables)
    }

    func deleteVehicle(id: Int) {
        errorMessage = nil
        guard let index = vehicles.firstIndex(where: { $0.id == id }) else { return }
        let removed = vehicles.remove(at: index) // optimistic remove
        
        // Remove from Core Data optimistically
        persistence.performBackground { context in
            let request: NSFetchRequest<VehicleEntity> = VehicleEntity.fetchRequest()
            request.predicate = NSPredicate(format: "id == %d", id)
            if let entity = try? context.fetch(request).first {
                context.delete(entity)
            }
        }

        garageService.delete(id: id)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] (completion: Subscribers.Completion<Error>) in
                guard let self = self else { return }
                if case let .failure(error) = completion {
                    // rollback
                    self.vehicles.insert(removed, at: index)
                    let msg = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
                    self.errorMessage = msg
                    self.toast?.showError("Failed to delete vehicle: \(msg)")
                    
                    // Restore to Core Data
                    self.persistence.performBackground { context in
                        removed.toCoreData(context: context)
                    }
                }
            } receiveValue: { [weak self] (_: Void) in
                guard let self = self else { return }
                self.toast?.showSuccess("Vehicle deleted")
            }
            .store(in: &cancellables)
    }
    
    // Convenience
    func refresh() { loadVehicles(vehicleType: lastVehicleType, reset: true) }

    // MARK: - Core Data Helpers
    private func loadFromCoreData() {
        let request: NSFetchRequest<VehicleEntity> = VehicleEntity.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(keyPath: \VehicleEntity.lastUpdated, ascending: false)]
        
        do {
            let entities = try persistence.container.viewContext.fetch(request)
            self.vehicles = entities.map { VehicleModel.fromCoreData($0) }
        } catch {
            print("Failed to fetch vehicles from Core Data: \(error)")
        }
    }
    
    private func syncToCoreData(vehicles: [VehicleModel], isReset: Bool) {
        persistence.performBackground { context in
            if isReset {
                // For a full reset, we might want to clear old cache or just upsert.
                // Simple approach: Delete all and re-insert (careful with offline changes!)
                // Better approach: Upsert based on ID.
                let fetchRequest: NSFetchRequest<NSFetchRequestResult> = VehicleEntity.fetchRequest()
                let deleteRequest = NSBatchDeleteRequest(fetchRequest: fetchRequest)
                _ = try? context.execute(deleteRequest)
            }
            
            for vehicle in vehicles {
                vehicle.toCoreData(context: context)
            }
        }
    }
}

