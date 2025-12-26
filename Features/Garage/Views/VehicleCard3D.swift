//
//  VehicleCard3D.swift
//  RevSync
//
//  Created by RevSync on 20/10/2025.
//

import SwiftUI

struct VehicleCard3D: View {
    let vehicle: VehicleModel
    let isSelected: Bool
    
    @State private var rotation: Double = 0.0
    @State private var isHovering = false
    
    var body: some View {
        ZStack {
            // Card Background
            Rectangle()
                .fill(.ultraThinMaterial)
                .glass(cornerRadius: 24)
                .neonGlow(color: isSelected ? .revSyncNeonBlue : .clear, radius: 15)
            
            // Content
            VStack(spacing: 0) {
                // Header: Make/Model
                VStack(spacing: 4) {
                    Text(vehicle.make.uppercased())
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundStyle(.secondary)
                        .tracking(2)
                    
                    Text(vehicle.model)
                        .font(.system(size: 40, weight: .black, design: .rounded))
                        .foregroundStyle(.white)
                    
                    Text(String(vehicle.year))
                        .font(.title3)
                        .foregroundStyle(.gray)
                }
                .padding(.top, 40)
                
                Spacer()
                
                // 3D Image Placeholder (Parallax Effect)
                Image(systemName: vehicle.vehicleType == .bike ? "bicycle" : "car.fill")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(height: 120)
                    .foregroundStyle(
                        LinearGradient(colors: [.revSyncNeonBlue, .revSyncNeonPurple], startPoint: .topLeading, endPoint: .bottomTrailing)
                    )
                    .shadow(color: .blue.opacity(0.5), radius: 20, x: 0, y: 10)
                    .rotation3DEffect(
                        .degrees(rotation),
                        axis: (x: 0.0, y: 1.0, z: 0.0)
                    )
                    .offset(y: isHovering ? -10 : 0)
                
                Spacer()
                
                // Stats Footer
                HStack(spacing: 20) {
                    VehicleStat(label: "ECU", value: vehicle.ecuId.isEmpty ? "N/A" : vehicle.ecuId)
                    Divider().frame(height: 30).background(Color.gray)
                    VehicleStat(label: "Mods", value: "\(vehicle.modifications.count)")
                    Divider().frame(height: 30).background(Color.gray)
                    VehicleStat(label: "Tune", value: "Stage 1") // Placeholder
                }
                .padding(.bottom, 40)
            }
        }
        .frame(width: 320, height: 480)
        .rotation3DEffect(
            .degrees(isHovering ? 5 : 0),
            axis: (x: 1.0, y: -1.0, z: 0.0)
        )
        .scaleEffect(isHovering ? 1.02 : 1.0)
        .animation(.spring(response: 0.4, dampingFraction: 0.6), value: isHovering)
        .onHover { hover in
            isHovering = hover
            withAnimation(.linear(duration: 2).repeatForever(autoreverses: false)) {
                // Subtle rotation animation could go here
            }
        }
    }
}

struct VehicleStat: View {
    let label: String
    let value: String
    
    var body: some View {
        VStack(spacing: 4) {
            Text(label.uppercased())
                .font(.caption2)
                .fontWeight(.bold)
                .foregroundStyle(.gray)
            Text(value)
                .font(.headline)
                .foregroundStyle(.white)
        }
    }
}


