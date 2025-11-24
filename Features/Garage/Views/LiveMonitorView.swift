//
//  LiveMonitorView.swift
//  RevSync
//
//  Created by RevSync on 24/11/2025.
//

import SwiftUI
import Charts

struct LiveMonitorView: View {
    @StateObject private var service = LiveMonitorService()
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        VStack(spacing: 30) {
            // Header
            HStack {
                Text("Live Telemetry")
                    .font(.title.bold())
                Spacer()
                Button("Stop") {
                    service.stopMonitoring()
                    dismiss()
                }
            }
            .padding()
            
            // RPM Gauge (Circular)
            ZStack {
                Circle()
                    .stroke(Color.gray.opacity(0.2), lineWidth: 20)
                
                Circle()
                    .trim(from: 0, to: CGFloat(service.currentData.rpm / 14000.0)) // Assuming 14k redline
                    .stroke(
                        AngularGradient(colors: [.green, .yellow, .red], center: .center),
                        style: StrokeStyle(lineWidth: 20, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                    .animation(.linear(duration: 0.2), value: service.currentData.rpm)
                
                VStack {
                    Text("\(Int(service.currentData.rpm))")
                        .font(.system(size: 60, weight: .bold, design: .monospaced))
                    Text("RPM")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(height: 250)
            .padding()
            
            // Secondary Metrics
            HStack(spacing: 40) {
                MetricCard(title: "Speed", value: "\(service.currentData.speed)", unit: "km/h")
                MetricCard(title: "Throttle", value: String(format: "%.0f", service.currentData.throttle), unit: "%")
            }
            
            Spacer()
        }
        .onAppear {
            service.startMonitoring()
        }
        .onDisappear {
            service.stopMonitoring()
        }
    }
}

struct MetricCard: View {
    let title: String
    let value: String
    let unit: String
    
    var body: some View {
        VStack(spacing: 8) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
            HStack(alignment: .firstTextBaseline, spacing: 2) {
                Text(value)
                    .font(.system(size: 32, weight: .bold, design: .monospaced))
                Text(unit)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(minWidth: 100)
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(12)
    }
}
