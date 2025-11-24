//
//  TunerDashboardView.swift
//  RevSync
//
//  Created by RevSync on 24/11/2025.
//

import SwiftUI

struct TunerDashboardView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel = TunerDashboardViewModel()
    
    var body: some View {
        NavigationStack {
            List {
                if viewModel.isLoading {
                    ProgressView()
                } else if viewModel.tunes.isEmpty {
                    ContentUnavailableView(
                        "No Tunes Yet",
                        systemImage: "waveform.path.ecg",
                        description: Text("Upload your first tune to start selling.")
                    )
                } else {
                    ForEach(viewModel.tunes) { tune in
                        NavigationLink(destination: EditTuneView(tune: tune)) {
                            HStack {
                                VStack(alignment: .leading) {
                                    Text(tune.name)
                                        .font(.headline)
                                    Text("$\(String(format: "%.2f", tune.price))")
                                        .font(.subheadline)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                Text(tune.vehicleMake + " " + tune.vehicleModel)
                                    .font(.caption)
                                    .padding(6)
                                    .background(Color.blue.opacity(0.1))
                                    .cornerRadius(6)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Tuner Dashboard")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    NavigationLink(destination: EditTuneView(tune: nil)) {
                        Image(systemName: "plus")
                    }
                }
            }
            .onAppear {
                viewModel.loadTunes()
            }
        }
    }
}

import Combine

final class TunerDashboardViewModel: ObservableObject {
    @Published var tunes: [TuneModel] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let service = MarketplaceService.shared
    private var cancellables = Set<AnyCancellable>()
    
    func loadTunes() {
        isLoading = true
        // Assuming we have an endpoint for "my created tunes" or filter by creator
        // For now, we'll fetch all and filter client side (MVP) or use a specific endpoint if available
        // Ideally: GET /marketplace/tunes/my/
        
        service.getTunes() // This gets ALL tunes. We need a "My Tunes" endpoint.
            .receive(on: DispatchQueue.main)
            .sink { [weak self] completion in
                self?.isLoading = false
                if case let .failure(error) = completion {
                    self?.errorMessage = error.localizedDescription
                }
            } receiveValue: { [weak self] tunes in
                // Filter for current user's tunes (Mock logic until backend endpoint exists)
                // In reality, backend should filter.
                self?.tunes = tunes 
            }
            .store(in: &cancellables)
    }
}
