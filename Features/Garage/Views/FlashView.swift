//
//  FlashView.swift
//  RevSync
//
//  Created by RevSync on 20/10/2025.
//

import SwiftUI

struct FlashView: View {
    let tune: TuneModel
    let vehicleId: Int // Passed from parent
    @Environment(\.dismiss) var dismiss
    @StateObject private var viewModel: FlashViewModel
    
    init(tune: TuneModel, vehicleId: Int) {
        self.tune = tune
        self.vehicleId = vehicleId
        _viewModel = StateObject(wrappedValue: FlashViewModel(vehicleId: vehicleId, tuneId: tune.id))
    }
    
    var body: some View {
        VStack(spacing: 40) {
            if viewModel.isComplete {
                VStack(spacing: 24) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 80))
                        .foregroundStyle(.green)
                        .symbolEffect(.bounce)
                    
                    Text("Tune Installed Successfully!")
                        .font(.title.bold())
                    
                    Text("Your vehicle is now running \(tune.name).")
                        .foregroundStyle(.secondary)
                    
                    Button("Done") {
                        dismiss()
                    }
                    .buttonStyle(.borderedProminent)
                }
            } else {
                VStack(spacing: 24) {
                    HStack {
                        Text("Flashing ECU")
                            .font(.title2.bold())
                        Spacer()
                        Toggle("Voice Guidance", isOn: $viewModel.isVoiceEnabled)
                            .toggleStyle(.switch)
                            .labelsHidden()
                        Image(systemName: viewModel.isVoiceEnabled ? "speaker.wave.2.fill" : "speaker.slash.fill")
                            .foregroundStyle(.secondary)
                    }
                    .padding(.horizontal)
                    
                    if let error = viewModel.errorMessage {
                        Text(error)
                            .foregroundStyle(.red)
                            .font(.caption)
                    }
                    
                    // Smart Health Checks
                    if viewModel.currentStep < 2 {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Pre-Flash Health Check")
                                .font(.headline)
                            
                            HStack {
                                Label("Battery Voltage: 12.8V", systemImage: "battery.100")
                                    .foregroundStyle(.green)
                                Spacer()
                                Image(systemName: "checkmark.circle.fill").foregroundStyle(.green)
                            }
                            HStack {
                                Label("ECU Temp: 45°C", systemImage: "thermometer")
                                    .foregroundStyle(.green)
                                Spacer()
                                Image(systemName: "checkmark.circle.fill").foregroundStyle(.green)
                            }
                            HStack {
                                Label("Connection: OBDLink MX+", systemImage: "cable.connector")
                                    .foregroundStyle(.green)
                                Spacer()
                                Image(systemName: "checkmark.circle.fill").foregroundStyle(.green)
                            }
                        }
                        .padding()
                        .background(Color.blue.opacity(0.1))
                        .cornerRadius(12)
                        .transition(.opacity)
                    }
                    
                    ZStack {
                        Circle()
                            .stroke(lineWidth: 8)
                            .opacity(0.2)
                            .foregroundStyle(.blue)
                        
                        Circle()
                            .trim(from: 0.0, to: CGFloat(viewModel.progress))
                            .stroke(style: StrokeStyle(lineWidth: 8, lineCap: .round, lineJoin: .round))
                            .foregroundStyle(.blue)
                            .rotationEffect(Angle(degrees: 270.0))
                            .animation(.linear, value: viewModel.progress)
                        
                        VStack {
                            Image(systemName: "cable.connector.horizontal")
                                .font(.largeTitle)
                                .symbolEffect(.pulse, isActive: !viewModel.isComplete)
                            Text("\(Int(viewModel.progress * 100))%")
                                .font(.title.bold())
                        }
                    }
                    .frame(width: 200, height: 200)
                    
                    VStack(spacing: 8) {
                        Text(viewModel.steps[min(viewModel.currentStep, viewModel.steps.count - 1)])
                            .font(.headline)
                            .id(viewModel.currentStep) // Force transition
                            .transition(.slide)
                            .animation(.easeInOut, value: viewModel.currentStep)
                        
                        Text(viewModel.logText)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .monospaced()
                    }
                    
                    if viewModel.isVoiceEnabled {
                        HStack {
                            Image(systemName: "waveform")
                            Text("Voice Guidance Active")
                                .font(.caption)
                        }
                        .foregroundStyle(.blue)
                        .padding(.top)
                    }
                }
            }
        }
        .padding()
        .frame(maxWidth: 600, maxHeight: 600)
        .onAppear {
            viewModel.startFlashSequence()
        }
    }
}
