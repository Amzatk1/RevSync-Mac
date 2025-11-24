//
//  FlashViewModel.swift
//  RevSync
//
//  Created by RevSync on 24/11/2025.
//

import Foundation
import Combine

final class FlashViewModel: ObservableObject {
    // MARK: - Published State
    @Published var currentStep = 0
    @Published var progress: Double = 0.0
    @Published var logText: String = "Initializing..."
    @Published var isComplete = false
    @Published var isVoiceEnabled = true
    @Published var errorMessage: String? = nil
    
    // MARK: - Dependencies
    private let service: FlashService
    private let vehicleId: Int
    private let tuneId: Int
    private var jobId: Int?
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Steps
    let steps = [
        "Checking Hardware Connection...",
        "Verifying Battery Voltage (>12.5V)...",
        "Backing up Stock ECU...",
        "Running Final Safety Validation...",
        "Erasing ECU Memory...",
        "Writing New Maps...",
        "Verifying Checksum...",
        "Flash Complete!"
    ]
    
    init(vehicleId: Int, tuneId: Int, service: FlashService = .shared) {
        self.vehicleId = vehicleId
        self.tuneId = tuneId
        self.service = service
    }
    
    func startFlashSequence() {
        // 1. Create Job on Backend
        service.createJob(vehicleId: vehicleId, tuneId: tuneId)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] completion in
                if case let .failure(error) = completion {
                    self?.errorMessage = "Failed to start flash: \(error.localizedDescription)"
                }
            } receiveValue: { [weak self] job in
                self?.jobId = job.id
                self?.runSimulationSteps() // Start the client-side process
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
