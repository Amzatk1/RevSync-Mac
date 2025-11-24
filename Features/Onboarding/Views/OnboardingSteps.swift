//
//  OnboardingSteps.swift
//  RevSync
//
//  Created by RevSync on 20/10/2025.
//

import SwiftUI

// MARK: - Welcome Step
struct WelcomeStepView: View {
    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            
            Image(systemName: "bolt.fill")
                .font(.system(size: 80))
                .foregroundStyle(LinearGradient(colors: [.yellow, .orange], startPoint: .top, endPoint: .bottom))
                .shadow(color: .orange.opacity(0.5), radius: 20, x: 0, y: 10)
            
            VStack(spacing: 12) {
                Text("Welcome to RevSync")
                    .font(.system(size: 40, weight: .bold, design: .rounded))
                    .multilineTextAlignment(.center)
                
                Text("The world's first AI-powered motorcycle tuning ecosystem.")
                    .font(.title3)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }
            
            Spacer()
        }
    }
}

// MARK: - Bike Selection Step
struct BikeSelectionStepView: View {
    @ObservedObject var viewModel: OnboardingViewModel
    
    var body: some View {
        VStack(spacing: 32) {
            Text("Tell us about your ride")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            VStack(spacing: 20) {
                Picker("Vehicle Type", selection: $viewModel.vehicleType) {
                    Text("Motorcycle").tag(VehicleType.bike)
                    Text("Car").tag(VehicleType.car)
                }
                .pickerStyle(.segmented)
                .frame(maxWidth: 300)
                
                // Make Selection
                VStack(alignment: .leading) {
                    Text("Make")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Picker("Select Make", selection: $viewModel.make) {
                        Text("Select Make").tag("")
                        ForEach(viewModel.availableMakes, id: \.self) { make in
                            Text(make).tag(make)
                        }
                    }
                    .pickerStyle(.menu)
                    .frame(maxWidth: .infinity)
                    .padding(8)
                    .background(Color(NSColor.controlBackgroundColor))
                    .cornerRadius(8)
                }
                
                // Model Selection
                VStack(alignment: .leading) {
                    Text("Model")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Picker("Select Model", selection: $viewModel.model) {
                        Text("Select Model").tag("")
                        ForEach(viewModel.availableModels, id: \.self) { model in
                            Text(model).tag(model)
                        }
                    }
                    .pickerStyle(.menu)
                    .frame(maxWidth: .infinity)
                    .padding(8)
                    .background(Color(NSColor.controlBackgroundColor))
                    .cornerRadius(8)
                    .disabled(viewModel.make.isEmpty)
                }
                
                // Year Selection
                VStack(alignment: .leading) {
                    Text("Year")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Picker("Select Year", selection: $viewModel.year) {
                        Text("Select Year").tag("")
                        ForEach(viewModel.availableYears, id: \.self) { year in
                            Text(year).tag(year)
                        }
                    }
                    .pickerStyle(.menu)
                    .frame(maxWidth: .infinity)
                    .padding(8)
                    .background(Color(NSColor.controlBackgroundColor))
                    .cornerRadius(8)
                    .disabled(viewModel.model.isEmpty)
                }
            }
            .frame(maxWidth: 400)
            
            Spacer()
        }
        .padding(.top, 40)
    }
}

// MARK: - Rider Profile Step
struct RiderProfileStepView: View {
    @ObservedObject var viewModel: OnboardingViewModel
    
    let skillLevels = ["Beginner", "Intermediate", "Advanced", "Pro"]
    let ridingStyles = ["Street", "Track", "Off-Road", "Touring"]
    
    var body: some View {
        VStack(spacing: 32) {
            Text("Your Rider Profile")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            VStack(spacing: 24) {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Skill Level")
                        .font(.headline)
                    Picker("Skill Level", selection: $viewModel.skillLevel) {
                        ForEach(skillLevels, id: \.self) { level in
                            Text(level).tag(level)
                        }
                    }
                    .pickerStyle(.segmented)
                }
                
                VStack(alignment: .leading, spacing: 12) {
                    Text("Riding Style")
                        .font(.headline)
                    Picker("Riding Style", selection: $viewModel.ridingStyle) {
                        ForEach(ridingStyles, id: \.self) { style in
                            Text(style).tag(style)
                        }
                    }
                    .pickerStyle(.segmented)
                }
            }
            .frame(maxWidth: 400)
            
            Spacer()
        }
        .padding(.top, 40)
    }
}

// MARK: - Goals Step
struct GoalsStepView: View {
    @ObservedObject var viewModel: OnboardingViewModel
    
    var body: some View {
        VStack(spacing: 32) {
            Text("What are your goals?")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 150), spacing: 16)], spacing: 16) {
                ForEach(viewModel.availableGoals, id: \.self) { goal in
                    GoalCard(title: goal, isSelected: viewModel.selectedGoals.contains(goal)) {
                        if viewModel.selectedGoals.contains(goal) {
                            viewModel.selectedGoals.remove(goal)
                        } else {
                            viewModel.selectedGoals.insert(goal)
                        }
                    }
                }
            }
            .frame(maxWidth: 600)
            
            Spacer()
        }
        .padding(.top, 40)
    }
}

struct GoalCard: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 16, weight: .medium))
                .foregroundColor(isSelected ? .white : .primary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 20)
                .padding(.horizontal, 12)
                .background(
                    ZStack {
                        if isSelected {
                            LinearGradient(colors: [.blue, .purple], startPoint: .topLeading, endPoint: .bottomTrailing)
                        } else {
                            Color(NSColor.controlBackgroundColor)
                        }
                    }
                )
                .cornerRadius(12)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(isSelected ? Color.clear : Color.white.opacity(0.1), lineWidth: 1)
                )
                .shadow(color: isSelected ? .blue.opacity(0.3) : .clear, radius: 8, x: 0, y: 4)
        }
        .buttonStyle(.plain)
        .animation(.spring(response: 0.3), value: isSelected)
    }
}

// MARK: - Completion Step
struct CompletionStepView: View {
    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 80))
                .foregroundStyle(LinearGradient(colors: [.green, .mint], startPoint: .top, endPoint: .bottom))
                .shadow(color: .green.opacity(0.5), radius: 20, x: 0, y: 10)
            
            VStack(spacing: 12) {
                Text("You're All Set!")
                    .font(.system(size: 40, weight: .bold, design: .rounded))
                
                Text("Your profile has been created. Let's get tuning.")
                    .font(.title3)
                    .foregroundStyle(.secondary)
            }
            
            Spacer()
        }
    }
}
