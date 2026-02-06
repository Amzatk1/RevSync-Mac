//
//  OnboardingStepViews.swift
//  RevSync
//
//  Created by RevSync on 20/10/2025.
//

import SwiftUI

// MARK: - 1. Welcome Step
struct WelcomeStepView: View {
    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            
            Image(systemName: "bolt.car.fill") // Placeholder for Logo
                .font(.system(size: 80))
                .foregroundStyle(LinearGradient(colors: [.blue, .purple], startPoint: .topLeading, endPoint: .bottomTrailing))
                .shadow(color: .blue.opacity(0.5), radius: 20)
            
            VStack(spacing: 12) {
                Text("Welcome to RevSync")
                    .font(.system(size: 40, weight: .bold))
                    .multilineTextAlignment(.center)
                
                Text("The world's first AI-driven, safety-focused motorcycle tuning platform.")
                    .font(.title3)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            }
            
            Spacer()
        }
    }
}

// MARK: - 2. Bike Selection Step
struct BikeSelectionStepView: View {
    @ObservedObject var viewModel: OnboardingViewModel
    
    let makes = ["Yamaha", "Honda", "Kawasaki", "Suzuki", "Ducati", "BMW", "KTM", "Aprilia"]
    let models = ["R1", "R6", "MT-09", "MT-07", "ZX-10R", "ZX-6R", "CBR1000RR", "GSX-R1000", "Panigale V4", "S1000RR"]
    let modsList = ["Full Exhaust", "Slip-on Exhaust", "High-Flow Air Filter", "ECU Flash (Previous)", "Quickshifter", "Velocity Stacks"]
    
    var body: some View {
        ScrollView {
            VStack(spacing: 32) {
                HeaderView(title: "Your Machine", subtitle: "Tell us what you ride so we can calibrate safety limits.")
                
                VStack(spacing: 20) {
                    // Year / Make / Model
                    HStack {
                        Picker("Year", selection: $viewModel.selectedYear) {
                            ForEach(2000...2025, id: \.self) { year in
                                Text(String(year)).tag(year)
                            }
                        }
                        .pickerStyle(.menu)
                        
                        Picker("Make", selection: $viewModel.selectedMake) {
                            ForEach(makes, id: \.self) { make in
                                Text(make).tag(make)
                            }
                        }
                        .pickerStyle(.menu)
                    }
                    
                    Picker("Model", selection: $viewModel.selectedModel) {
                        ForEach(models, id: \.self) { model in
                            Text(model).tag(model)
                        }
                    }
                    .pickerStyle(.menu)
                    
                    Divider()
                    
                    // ECU Type
                    VStack(alignment: .leading) {
                        Text("ECU Type")
                            .font(.headline)
                        Picker("ECU", selection: $viewModel.selectedECU) {
                            ForEach(ECUType.allCases) { type in
                                Text(type.rawValue).tag(type)
                            }
                        }
                        .pickerStyle(.segmented)
                    }
                    
                    Divider()
                    
                    // Mods
                    VStack(alignment: .leading) {
                        Text("Modifications")
                            .font(.headline)
                        
                        LazyVGrid(columns: [GridItem(.adaptive(minimum: 140))], spacing: 12) {
                            ForEach(modsList, id: \.self) { mod in
                                ToggleButton(title: mod, isSelected: viewModel.selectedMods.contains(mod)) {
                                    viewModel.toggleMod(mod)
                                }
                            }
                        }
                    }
                }
                .padding()
                .background(Color.gray.opacity(0.1))
                .cornerRadius(16)
            }
            .padding()
        }
    }
}

// MARK: - 3. Rider Profile Step
struct RiderProfileStepView: View {
    @ObservedObject var viewModel: OnboardingViewModel
    
    var body: some View {
        ScrollView {
            VStack(spacing: 32) {
                HeaderView(title: "Rider Profile", subtitle: "AI adapts tunes to your skill and riding style.")
                
                VStack(spacing: 24) {
                    // Skill Level
                    VStack(alignment: .leading) {
                        Text("Skill Level")
                            .font(.headline)
                        Picker("Skill", selection: $viewModel.skillLevel) {
                            ForEach(OnboardingViewModel.SkillLevel.allCases) { level in
                                Text(level.rawValue).tag(level)
                            }
                        }
                        .pickerStyle(.segmented)
                    }
                    
                    // Riding Style
                    VStack(alignment: .leading) {
                        Text("Primary Riding Style")
                            .font(.headline)
                        Picker("Style", selection: $viewModel.ridingStyle) {
                            ForEach(OnboardingViewModel.RidingStyle.allCases) { style in
                                Text(style.rawValue).tag(style)
                            }
                        }
                        .pickerStyle(.menu)
                    }
                    
                    Divider()
                    
                    // Risk Tolerance
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Tuning Risk Tolerance")
                            .font(.headline)
                        
                        Text("This determines how aggressive the recommended tunes will be.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        
                        Picker("Risk", selection: $viewModel.riskTolerance) {
                            ForEach(OnboardingViewModel.RiskTolerance.allCases) { risk in
                                Text(risk.rawValue).tag(risk)
                            }
                        }
                        .pickerStyle(.segmented)
                        
                        // Dynamic explanation
                        Text(riskDescription(for: viewModel.riskTolerance))
                            .font(.caption)
                            .foregroundStyle(riskColor(for: viewModel.riskTolerance))
                            .padding(.top, 4)
                    }
                }
                .padding()
                .background(Color.gray.opacity(0.1))
                .cornerRadius(16)
            }
            .padding()
        }
    }
    
    func riskDescription(for risk: OnboardingViewModel.RiskTolerance) -> String {
        switch risk {
        case .conservative: return "Prioritizes engine longevity and reliability over raw power."
        case .balanced: return "The sweet spot. Good power gains with safe margins."
        case .aggressive: return "Maximum performance. Pushes components to their limits. Requires strict maintenance."
        }
    }
    
    func riskColor(for risk: OnboardingViewModel.RiskTolerance) -> Color {
        switch risk {
        case .conservative: return .green
        case .balanced: return .blue
        case .aggressive: return .orange
        }
    }
}

// MARK: - 4. Analysis Step
struct AnalysisStepView: View {
    @ObservedObject var viewModel: OnboardingViewModel
    
    var body: some View {
        VStack(spacing: 40) {
            Spacer()
            
            ZStack {
                Circle()
                    .stroke(lineWidth: 4)
                    .opacity(0.3)
                    .foregroundStyle(.blue)
                
                Circle()
                    .trim(from: 0.0, to: CGFloat(min(viewModel.analysisProgress, 1.0)))
                    .stroke(style: StrokeStyle(lineWidth: 4, lineCap: .round, lineJoin: .round))
                    .foregroundStyle(LinearGradient(colors: [.blue, .purple], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .rotationEffect(Angle(degrees: 270.0))
                    .animation(.linear, value: viewModel.analysisProgress)
                
                VStack {
                    Image(systemName: "brain.head.profile")
                        .font(.system(size: 50))
                        .foregroundStyle(.primary)
                    Text("\(Int(viewModel.analysisProgress * 100))%")
                        .font(.title.bold())
                }
            }
            .frame(width: 200, height: 200)
            
            Text(viewModel.analysisStatus)
                .font(.headline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .transition(.opacity)
                .id(viewModel.analysisStatus) // Force transition
            
            Spacer()
        }
        .padding()
    }
}

// MARK: - Components

struct HeaderView: View {
    let title: String
    let subtitle: String
    
    var body: some View {
        VStack(spacing: 8) {
            Text(title)
                .font(.largeTitle.bold())
            Text(subtitle)
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
    }
}

struct ToggleButton: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(isSelected ? Color.blue : Color.gray.opacity(0.2))
                .foregroundStyle(isSelected ? .white : .primary)
                .cornerRadius(20)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(isSelected ? Color.blue : Color.clear, lineWidth: 1)
                )
        }
        .buttonStyle(.plain)
    }
}
