//
//  EditTuneViewModel.swift
//  RevSync
//
//  Created by RevSync on 24/11/2025.
//

import Foundation
import Combine

final class EditTuneViewModel: ObservableObject {
    @Published var name = ""
    @Published var description = ""
    @Published var price = ""
    @Published var make = ""
    @Published var model = ""
    @Published var yearStart = ""
    @Published var yearEnd = ""
    
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var shouldDismiss = false
    
    private let service = MarketplaceService.shared
    private var cancellables = Set<AnyCancellable>()
    
    let tune: TuneModel?
    
    init(tune: TuneModel?) {
        self.tune = tune
        if let tune = tune {
            name = tune.name
            description = tune.description
            price = String(tune.price)
            make = tune.vehicleMake
            model = tune.vehicleModel
            yearStart = String(tune.vehicleYearStart)
            yearEnd = String(tune.vehicleYearEnd)
        }
    }
    
    func save() {
        guard let priceValue = Double(price),
              let start = Int(yearStart),
              let end = Int(yearEnd) else {
            errorMessage = "Please enter valid numbers."
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        if tune == nil {
            service.createTune(
                name: name,
                description: description,
                price: priceValue,
                vehicleMake: make,
                vehicleModel: model,
                yearStart: start,
                yearEnd: end
            )
            .receive(on: DispatchQueue.main)
            .sink { [weak self] (completion: Subscribers.Completion<Error>) in
                self?.isLoading = false
                if case let .failure(error) = completion {
                    self?.errorMessage = error.localizedDescription
                }
            } receiveValue: { [weak self] _ in
                self?.shouldDismiss = true
            }
            .store(in: &cancellables)
        } else {
            // Update logic would go here
            // For now just dismiss as if successful
            isLoading = false
            shouldDismiss = true
        }
    }
}
