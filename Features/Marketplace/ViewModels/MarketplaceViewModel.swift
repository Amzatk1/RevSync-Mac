//
//  MarketplaceViewModel.swift
//  RevSync
//
//  Created by RevSync on 20/10/2025.
//

import Foundation
import Combine
import CoreData

class MarketplaceViewModel: ObservableObject {
    @Published var featuredTunes: [TuneModel] = []
    @Published var trendingTunes: [TuneModel] = []
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    
    private let service = MarketplaceService.shared
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        loadData()
    }
    
    func loadData() {
        isLoading = true
        errorMessage = nil
        
        // Load cached data first
        loadFromCoreData()
        
        // Fetch tunes from the backend
        // For "featured", we might filter by high rating or specific tag
        // For "trending", we might sort by download count
        
        let featuredPublisher = service.getTunes(stage: 2, page: 1)
        let trendingPublisher = service.getTunes(page: 1)
        
        Publishers.Zip(featuredPublisher, trendingPublisher)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] completion in
                guard let self = self else { return }
                self.isLoading = false
                if case let .failure(error) = completion {
                    self.errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
                    // On error, we rely on cached data loaded above
                }
            } receiveValue: { [weak self] (featuredPage, trendingPage) in
                guard let self = self else { return }
                self.featuredTunes = featuredPage.results
                self.trendingTunes = trendingPage.results
                
                // Cache these results (via SyncService or manually? SyncService is simpler but we are here)
                // Actually SyncService already does this if we call it. 
                // We'll let SyncService handle background sync, or we can save here to be aggressive.
                // For now, relying on SyncService which is called in App.
            }
            .store(in: &cancellables)
    }
    
    private func loadFromCoreData() {
        let request: NSFetchRequest<TuneEntity> = TuneEntity.fetchRequest()
        // Sort by ... ID or name?
        request.sortDescriptors = [NSSortDescriptor(key: "name", ascending: true)]
        
        let context = PersistenceController.shared.container.viewContext
        context.perform { [weak self] in
            do {
                let entities = try context.fetch(request)
                let models = entities.map { TuneModel.fromCoreData($0) }
                DispatchQueue.main.async {
                    self?.featuredTunes = models // Fallback: show all as featured
                    // self?.trendingTunes = models // Duplicate? Or leave empty?
                }
            } catch {
                print("Failed to load cached tunes: \(error)")
            }
        }
    }
    
    func purchaseTune(_ tune: TuneModel, completion: @escaping (Bool) -> Void) {
        isLoading = true
        service.purchaseTune(tuneId: tune.id)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] result in
                self?.isLoading = false
                if case .failure = result {
                    completion(false)
                }
            } receiveValue: { _ in
                completion(true)
            }
            .store(in: &cancellables)
    }
}
