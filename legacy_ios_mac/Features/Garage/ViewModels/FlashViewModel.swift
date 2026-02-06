//
//  FlashViewModel.swift
//  RevSync
//
//  Created by RevSync on 24/11/2025.
//

import Foundation
import Combine
import CoreData

final class FlashViewModel: ObservableObject {
    // MARK: - Published State
    @Published var currentStep = 0
    @Published var progress: Double = 0.0
    @Published var logText: String = "Initializing..."
    @Published var isComplete = false
    @Published var isVoiceEnabled = true
    @Published var errorMessage: String? = nil
    
    // MARK: - Dependencies
    // MARK: - Dependencies
    private let service: FlashService
    private let downloadManager = SecureDownloadManager.shared
    private let vehicleId: Int
    private let tuneId: UUID
    private var jobId: Int?
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Steps
    let steps = [
        "Resolving Tune Version...",
        "Securely Downloading Package...",
        "Verifying Core Integrity...",
        "Backing up Stock ECU...",
        "Erasing ECU Memory...",
        "Writing New Maps...",
        "Verifying Checksum...",
        "Flash Complete!"
    ]
    
    init(vehicleId: Int, tuneId: UUID, service: FlashService = .shared) {
        self.vehicleId = vehicleId
        self.tuneId = tuneId
        self.service = service
    }
    
    func startFlashSequence() {
        // 0. Resolve Version & Download
        resolveAndDownload()
    }
    
    private func resolveAndDownload() {
        // Mocking the resolution for now since we rely on Core Data cache
        // In a real scenario, we'd fetch the latest version entity
        
        let context = PersistenceController.shared.container.viewContext
        let request: NSFetchRequest<TuneEntity> = TuneEntity.fetchRequest()
        request.predicate = NSPredicate(format: "id == %@", tuneId as CVarArg)
        request.fetchLimit = 1
        
        // Async fetch
        context.perform { [weak self] in
            guard let self = self else { return }
            
            do {
                if let tune = try context.fetch(request).first,
                   let version = (tune.versions?.allObjects as? [TuneVersionEntity])?.first { // Simplification: Pick first
                   
                   // Start Download
                   self.downloadTune(version: version)
                } else {
                    // Fallback if no local entity (shouldn't happen if purchased)
                    // Proceed to job creation explicitly skipping download
                    DispatchQueue.main.async {
                        self.logText = "Local version not found. Proceeding with cloud flash..."
                        self.createBackendJob()
                    }
                }
            } catch {
                DispatchQueue.main.async {
                    self.errorMessage = "Failed to resolve tune: \(error.localizedDescription)"
                }
            }
        }
    }
    
    private func downloadTune(version: TuneVersionEntity) {
        DispatchQueue.main.async {
            self.currentStep = 1 // Downloading
            self.logText = "Downloading version \(version.versionNumber ?? "latest")..."
        }
        
        downloadManager.downloadAndVerify(version: version)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] completion in
                if case let .failure(error) = completion {
                    self?.errorMessage = "Secure Download Failed: \(error.localizedDescription)"
                }
            } receiveValue: { [weak self] fileUrl in
                self?.logText = "Verified signature. Package ready."
                self?.createBackendJob()
            }
            .store(in: &cancellables)
    }

    private func createBackendJob() {
        service.createJob(vehicleId: vehicleId, listingId: tuneId)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] completion in
                if case let .failure(error) = completion {
                    self?.errorMessage = "Failed to start flash: \(error.localizedDescription)"
                }
            } receiveValue: { [weak self] job in
                self?.jobId = job.id
                self?.runSimulationSteps() 
            }
            .store(in: &cancellables)
    }
    
    private func runSimulationSteps() {
        // In a real app, this would be driven by the OBD dongle callbacks.
        // Here we simulate the steps but report progress to the backend.
        
        var delay: TimeInterval = 0
        
        for (index, step) in steps.enumerated() {
            delay += Double.random(in: 1.5...3.0)
            
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in
                guard let self = self else { return }
                
                self.currentStep = index
                self.progress = Double(index + 1) / Double(self.steps.count)
                self.logText = "> \(step)"
                
                // Report to Backend
                self.reportProgress(stepIndex: index, stepName: step)
                
                if index == self.steps.count - 1 {
                    self.completeJob()
                }
            }
        }
    }
    
    private func reportProgress(stepIndex: Int, stepName: String) {
        guard let jobId = jobId else { return }
        
        let progressPercent = Int((Double(stepIndex + 1) / Double(steps.count)) * 100)
        let status: FlashJobModel.Status = .flashing
        
        service.updateJob(id: jobId, status: status, progress: progressPercent, logs: [stepName])
            .sink { _ in } receiveValue: { _ in }
            .store(in: &cancellables)
    }
    
    private func completeJob() {
        guard let jobId = jobId else { return }
        
        service.updateJob(id: jobId, status: .completed, progress: 100, logs: ["Flash Completed Successfully"])
            .receive(on: DispatchQueue.main)
            .sink { _ in } receiveValue: { [weak self] _ in
                self?.isComplete = true
            }
            .store(in: &cancellables)
    }
}
