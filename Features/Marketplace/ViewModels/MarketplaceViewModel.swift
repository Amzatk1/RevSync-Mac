//
//  MarketplaceViewModel.swift
//  RevSync
//
//  Created by RevSync on 20/10/2025.
//

import Foundation
import Combine

class MarketplaceViewModel: ObservableObject {
    @Published var featuredTunes: [TuneModel] = []
    @Published var trendingTunes: [TuneModel] = []
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    
    private let service = MarketplaceService()
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        loadData()
    }
    
    func loadData() {
        isLoading = true
        errorMessage = nil
        
        // Fetch tunes from the backend
        // For "featured", we might filter by high rating or specific tag
        // For "trending", we might sort by download count
        
        let featuredPublisher = service.list(stage: 2, page: 1)
        let trendingPublisher = service.list(page: 1)
        
        Publishers.Zip(featuredPublisher, trendingPublisher)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] completion in
                guard let self = self else { return }
                self.isLoading = false
                if case let .failure(error) = completion {
                    self.errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
                }
            } receiveValue: { [weak self] (featuredPage, trendingPage) in
                guard let self = self else { return }
                self.featuredTunes = featuredPage.results
                self.trendingTunes = trendingPage.results
            }
            .store(in: &cancellables)
    }
    
    func purchaseTune(_ tune: TuneModel, completion: @escaping (Bool) -> Void) {
        isLoading = true
        service.purchase(tuneId: tune.id)
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
