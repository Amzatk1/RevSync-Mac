//
//  VehicleDetailView.swift
//  RevSync
//
//  Created by RevSync on 20/10/2025.
//

import SwiftUI

struct VehicleDetailView: View {
    @ObservedObject var vehicle: VehicleModel
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header
                VStack(spacing: 8) {
                    Image(systemName: vehicle.vehicleType == .bike ? "bicycle" : "car.fill")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(height: 100)
                        .foregroundStyle(.blue)
                    
                    Text(vehicle.name)
                        .font(.largeTitle.bold())
                    
                    Text("\(vehicle.year) \(vehicle.make) \(vehicle.model)")
                        .font(.title3)
                        .foregroundStyle(.secondary)
                }
                .padding(.top)
                
                // Health & Status Grid
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                    StatusCard(title: "ECU Status", value: "Connected", icon: "cable.connector", color: .green)
                    StatusCard(title: "Battery", value: "12.8V", icon: "battery.100", color: .green)
                    StatusCard(title: "Oil Temp", value: "185°F", icon: "thermometer", color: .orange)
                    StatusCard(title: "Codes", value: "None", icon: "exclamationmark.triangle", color: .gray)
                }
                .padding(.horizontal)
                
                // Mods Tracker
                ModTrackerView(vehicle: vehicle)
                    .padding(.horizontal)
                
                // Maintenance / Notes (Placeholder)
                VStack(alignment: .leading, spacing: 12) {
                    Text("Maintenance Log")
                        .font(.headline)
                    
                    HStack {
                        Image(systemName: "wrench.fill")
                        Text("Oil Change")
                        Spacer()
                        Text("2 weeks ago")
                            .foregroundStyle(.secondary)
                    }
                    .padding()
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(12)
                }
                .padding(.horizontal)
            }
            .padding(.bottom, 40)
        }
        .navigationTitle(vehicle.name)
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
    }
}

struct StatusCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundStyle(color)
                Spacer()
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(value)
                    .font(.headline)
            }
        }
        .padding()
        .background(Color(NSColor.controlBackgroundColor))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}
