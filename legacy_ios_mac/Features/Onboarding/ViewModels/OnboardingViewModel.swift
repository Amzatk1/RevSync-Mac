//
//  OnboardingViewModel.swift
//  RevSync
//
//  Created by RevSync on 20/10/2025.
//

import SwiftUI
import Combine

enum OnboardingStep: Int, CaseIterable {
    case welcome = 0
    case bikeSelection
    case riderProfile
    case goals
    case analysis
    case complete
}

final class OnboardingViewModel: ObservableObject {
    // MARK: - Published State
    @Published var currentStep: OnboardingStep = .welcome
    @Published var isNextEnabled: Bool = true // Default true for welcome
    
    // Bike Selection
    @Published var selectedYear: Int = 2024
    @Published var selectedMake: String = "Yamaha"
    @Published var selectedModel: String = "R1"
    @Published var mileage: String = ""
    @Published var selectedMods: Set<String> = []
    @Published var selectedECU: ECUType = .obdII
    
    // Rider Profile
    @Published var skillLevel: SkillLevel = .intermediate
    @Published var ridingStyle: RidingStyle = .sport
    @Published var riskTolerance: RiskTolerance = .balanced
    
    // Goals
    @Published var selectedGoals: Set<String> = []

    // MARK: - Enums
    enum SkillLevel: String, CaseIterable, Identifiable {
        case beginner = "Beginner"
        case intermediate = "Intermediate"
        case advanced = "Advanced"
        case pro = "Pro"
        var id: String { rawValue }
    }
    
    enum RidingStyle: String, CaseIterable, Identifiable {
        case commuter = "Commuter"
        case sport = "Sport"
        case track = "Track"
        case offroad = "Off-Road"
        var id: String { rawValue }
    }
    
    enum RiskTolerance: String, CaseIterable, Identifiable {
        case conservative = "Conservative"
        case balanced = "Balanced"
        case aggressive = "Aggressive"
        var id: String { rawValue }
    }

    
    // Analysis
    @Published var analysisProgress: Double = 0.0
    @Published var analysisStatus: String = "Initializing AI Safety Engine..."
    
    // Dependencies
    private let authManager: AuthManager
    private let garageService: GarageService
    
    init(authManager: AuthManager = AuthManager(), garageService: GarageService = GarageService()) {
        self.authManager = authManager
        self.garageService = garageService
    }
    
    // MARK: - Actions
    func nextStep() {
        if currentStep == .analysis {
            // Analysis is auto-progressed
            return
        }
        
        if let next = OnboardingStep(rawValue: currentStep.rawValue + 1) {
            withAnimation {
                currentStep = next
            }
            
            if next == .analysis {
                startAnalysis()
            }
        }
    }
    
    func previousStep() {
        if let prev = OnboardingStep(rawValue: currentStep.rawValue - 1) {
            withAnimation {
                currentStep = prev
            }
        }
    }
    
    func toggleMod(_ mod: String) {
        if selectedMods.contains(mod) {
            selectedMods.remove(mod)
        } else {
            selectedMods.insert(mod)
        }
    }
    
    func toggleGoal(_ goal: String) {
        if selectedGoals.contains(goal) {
            selectedGoals.remove(goal)
        } else {
            selectedGoals.insert(goal)
        }
    }
    
    // MARK: - Analysis Simulation
    private func startAnalysis() {
        analysisProgress = 0.0
        analysisStatus = "Connecting to RevSync Neural Network..."
        
        // Simulate AI processing steps
        let steps = [
            (0.2, "Analyzing Vehicle Telemetry Compatibility..."),
            (0.4, "Calibrating Safety Envelopes for \(selectedModel)..."),
            (0.6, "Matching Rider Profile: \(ridingStyle.rawValue)..."),
            (0.8, "Optimizing Tune Recommendations..."),
            (1.0, "Profile Generated Successfully.")
        ]
        
        var delay: TimeInterval = 0
        
        for (progress, status) in steps {
            delay += 1.5
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                withAnimation {
                    self.analysisProgress = progress
                    self.analysisStatus = status
                }
                
                if progress == 1.0 {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                        self.completeOnboarding()
                    }
                }
            }
        }
    }
    
    private func completeOnboarding() {
        // Save Profile and Vehicle
        // In a real app, we'd call API/CoreData here
        
        // For now, just mark as complete in AppStorage (handled by View/App)
        withAnimation {
            currentStep = .complete
        }
    }
}
