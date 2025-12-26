//
//  OnboardingView.swift
//  RevSync
//
//  Created by RevSync on 20/10/2025.
//

import SwiftUI

struct OnboardingView: View {
    @StateObject private var viewModel = OnboardingViewModel()
    @AppStorage("hasCompletedOnboarding") private var hasCompletedOnboarding: Bool = false
    
    var body: some View {
        ZStack {
            // Background
            Color(NSColor.windowBackgroundColor)
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Content
                TabView(selection: $viewModel.currentStep) {
                    WelcomeStepView()
                        .tag(OnboardingStep.welcome)
                    
                    BikeSelectionStepView(viewModel: viewModel)
                        .tag(OnboardingStep.bikeSelection)
                    
                    RiderProfileStepView(viewModel: viewModel)
                        .tag(OnboardingStep.riderProfile)
                    
                    GoalsStepView(viewModel: viewModel)
                        .tag(OnboardingStep.goals)
                    
                    AnalysisStepView(viewModel: viewModel)
                        .tag(OnboardingStep.analysis)
                }
                #if os(iOS)
                .tabViewStyle(.page(indexDisplayMode: .never))
                #endif
                .animation(.easeInOut, value: viewModel.currentStep)
                
                // Navigation Buttons
                HStack {
                    if viewModel.currentStep != .welcome && viewModel.currentStep != .analysis {
                        Button("Back") {
                            viewModel.previousStep()
                        }
                        .buttonStyle(.plain)
                        .font(.headline)
                        .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    if viewModel.currentStep != .analysis {
                        Button(action: {
                            viewModel.nextStep()
                        }) {
                            HStack {
                                Text(viewModel.currentStep == .welcome ? "Get Started" : "Next")
                                Image(systemName: "arrow.right")
                            }
                            .font(.headline)
                            .foregroundColor(.white)
                            .padding(.horizontal, 32)
                            .padding(.vertical, 16)
                            .background(
                                LinearGradient(colors: [.blue, .purple], startPoint: .leading, endPoint: .trailing)
                            )
                            .clipShape(Capsule())
                            .shadow(color: .blue.opacity(0.3), radius: 10, x: 0, y: 5)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(40)
            }
        }
        .frame(minWidth: 800, minHeight: 600)
        .onChange(of: viewModel.currentStep) { _, newStep in
            if newStep == .complete {
                withAnimation {
                    hasCompletedOnboarding = true
                }
            }
        }
    }
}

#Preview {
    OnboardingView()
}
