//
//  SnapScanView.swift
//  RevSync
//
//  Created by RevSync on 20/10/2025.
//

import SwiftUI

struct SnapScanView: View {
    @Environment(\.dismiss) var dismiss
    @State private var isScanning = false
    @State private var scanStep = 0
    @State private var scanText = "Align bike in frame"
    @State private var detectedVehicle: VehicleModel?
    @State private var showResult = false
    
    // Simulated AR Overlay State
    @State private var scannerRotation = 0.0
    @State private var scannerScale = 1.0
    @State private var gridOpacity = 0.0
    
    var body: some View {
        ZStack {
            // 1. Simulated Camera Feed (Dark background with subtle movement to simulate 'live' feel)
            GeometryReader { geo in
                ZStack {
                    Color.black
                    // Simulated "World" content (e.g. a blurred shape representing a bike)
                    Image(systemName: "bicycle")
                        .font(.system(size: 300))
                        .foregroundStyle(.gray.opacity(0.2))
                        .offset(x: isScanning ? 10 : -10, y: isScanning ? 5 : -5)
                        .animation(.easeInOut(duration: 2).repeatForever(autoreverses: true), value: isScanning)
                }
                .ignoresSafeArea()
            }
            
            // 2. AR Scanning Overlay
            if !showResult {
                VStack {
                    Spacer()
                    ZStack {
                        // Scanning Grid
                        Image(systemName: "viewfinder")
                            .font(.system(size: 300, weight: .ultraLight))
                            .foregroundStyle(.white.opacity(0.5))
                        
                        // Laser Scan Line
                        Rectangle()
                            .fill(
                                LinearGradient(colors: [.clear, .green.opacity(0.8), .clear], startPoint: .leading, endPoint: .trailing)
                            )
                            .frame(width: 300, height: 2)
                            .offset(y: isScanning ? 150 : -150)
                            .animation(isScanning ? .linear(duration: 1.5).repeatForever(autoreverses: true) : .default, value: isScanning)
                        
                        // Analysis Points
                        if isScanning {
                            ForEach(0..<5) { i in
                                Circle()
                                    .stroke(.green, lineWidth: 1)
                                    .frame(width: 20, height: 20)
                                    .offset(
                                        x: CGFloat.random(in: -100...100),
                                        y: CGFloat.random(in: -100...100)
                                    )
                                    .transition(.scale.combined(with: .opacity))
                                    .animation(.spring().delay(Double(i) * 0.2).repeatForever(), value: isScanning)
                            }
                        }
                    }
                    Spacer()
                    
                    // Status Text
                    VStack(spacing: 16) {
                        Text(scanText)
                            .font(.headline)
                            .monospaced()
                            .foregroundStyle(.green)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(.black.opacity(0.6))
                            .cornerRadius(8)
                        
                        if !isScanning {
                            Button(action: startScan) {
                                Circle()
                                    .strokeBorder(.white, lineWidth: 4)
                                    .frame(width: 80, height: 80)
                                    .overlay(
                                        Circle()
                                            .fill(.white)
                                            .frame(width: 70, height: 70)
                                    )
                            }
                            .buttonStyle(.plain)
                        } else {
                            // Scanning Indicator
                            HStack(spacing: 4) {
                                ForEach(0..<3) { index in
                                    Circle()
                                        .fill(.white)
                                        .frame(width: 8, height: 8)
                                        .opacity(scanStep > index ? 1.0 : 0.3)
                                }
                            }
                            .padding()
                        }
                    }
                    .padding(.bottom, 50)
                }
            } else {
                // 3. Result View (Success)
                VStack(spacing: 24) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 80))
                        .foregroundStyle(.green)
                        .symbolEffect(.bounce)
                    
                    Text("Vehicle Identified")
                        .font(.title.bold())
                        .foregroundStyle(.white)
                    
                    if let vehicle = detectedVehicle {
                        VStack(spacing: 16) {
                            VehicleCard3D(vehicle: vehicle, isSelected: false)
                                .scaleEffect(0.8)
                                .frame(height: 400)
                            
                            Button("Add to Garage") {
                                // In real app, add to Data Store
                                dismiss()
                            }
                            .buttonStyle(.borderedProminent)
                            .controlSize(.large)
                        }
                    }
                }
                .transition(.scale)
            }
            
            // Close Button
            VStack {
                HStack {
                    Spacer()
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title)
                            .foregroundStyle(.white)
                    }
                    .buttonStyle(.plain)
                    .padding()
                }
                Spacer()
            }
        }
    }
    
    private func startScan() {
        isScanning = true
        scanText = "Analyzing Geometry..."
        
        // Simulate Multi-step Analysis
        // Step 1: Geometry
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            scanStep = 1
            scanText = "Detecting Make & Model..."
            
            // Step 2: Identification
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                scanStep = 2
                scanText = "Verifying VIN..."
                
                // Step 3: Complete
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                    withAnimation {
                        showResult = true
                        detectedVehicle = VehicleModel(
                            name: "Detected R1",
                            make: "Yamaha",
                            model: "YZF-R1",
                            year: 2024,
                            vehicleType: .bike,
                            ecuType: .denso,
                            modifications: ["Stock Exhaust"]
                        )
                    }
                }
            }
        }
    }
}
