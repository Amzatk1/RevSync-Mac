//
//  TuneDetailComponents.swift
//  RevSync
//
//  Extracted subviews for TuneDetailView to improve readability.
//

import SwiftUI
import SwiftUI
import Charts
import Combine

// MARK: - Header
struct TuneHeaderView: View {
    let tune: TuneModel
    let isSafe: Bool
    
    @State private var isLiked = false
    @State private var likeCount = 0
    @State private var cancellables = Set<AnyCancellable>()
    private let service = MarketplaceService.shared
    
    var body: some View {
        ZStack(alignment: .bottomLeading) {
            // Dynamic Gradient based on safety
            LinearGradient(
                colors: [
                    isSafe ? .blue.opacity(0.8) : .orange.opacity(0.8),
                    .purple.opacity(0.8)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            Rectangle()
                .fill(LinearGradient(colors: [.blue.opacity(0.3), .black], startPoint: .top, endPoint: .bottom))
                .frame(height: 300)
            
            VStack(alignment: .leading, spacing: 8) {
                Text(tune.title)
                    .font(.system(size: 32, weight: .heavy))
                    .foregroundStyle(.white)
                
                HStack {
                    Badge(text: "Stage \(tune.stage ?? 1)", color: .orange)
                    Badge(text: "\(tune.vehicleMake) \(tune.vehicleModel)", color: .gray)
                }
            }
            .padding()
            
            // Like Button (Disabled/Mocked until social added back)
            /*
            VStack {
                HStack {
                    Spacer()
                    Button(action: toggleLike) { ... }
                }
                Spacer()
            }
            */
        }
    }
    
    private func toggleLike() {
        // Disabled
    }
}

// ... (CreatorRow unchanged)

// MARK: - Stats Grid
struct TuneStatsGrid: View {
    let tune: TuneModel
    
    var body: some View {
        HStack(spacing: 0) {
            if let hp = tune.horsepowerGain {
                StatItem(value: "+\(Int(hp))", label: "HP Gain")
                Divider().frame(height: 30)
            }
            if let tq = tune.torqueGain {
                StatItem(value: "+\(Int(tq))", label: "Torque")
                Divider().frame(height: 30)
            }
            StatItem(value: "\(tune.fileSizeKb ?? 0) KB", label: "Size")
        }
        .padding(.vertical, 8)
    }
}

// ... (DynoChart unchanged)

// ... (TablePreview unchanged)

// MARK: - Specs List
struct TuneSpecsList: View {
    let tune: TuneModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            // Compatibility Banner
            HStack {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(.green)
                    .font(.title2)
                VStack(alignment: .leading) {
                    Text("Compatible")
                        .font(.headline)
                    Text("Matches \(tune.vehicleMake) \(tune.vehicleModel)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
            }
            .padding()
            .background(Color.green.opacity(0.1))
            .cornerRadius(12)
            
            // Requirements
            VStack(alignment: .leading, spacing: 12) {
                Text("Requirements")
                    .font(.headline)
                
                RequirementRow(text: "98 RON Fuel Recommended", icon: "fuelpump.fill")
                RequirementRow(text: "High-Flow Air Filter", icon: "wind")
                RequirementRow(text: "OBDLink MX+ or similar", icon: "cable.connector")
            }
            
            Divider()
            
            VStack(alignment: .leading, spacing: 12) {
                SpecRow(label: "Price", value: "$\(tune.price)")
                SpecRow(label: "Size", value: "\(tune.fileSizeKb ?? 0) KB")
                SpecRow(label: "Safety Rating", value: "\(tune.safetyRating ?? 0)/10")
            }
        }
        .padding()
    }
}


// MARK: - Safety Report
struct TuneSafetyReportView: View {
    let report: SafetyReport
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Safety Analysis")
                    .font(.headline)
                Spacer()
            }
            
            HStack(spacing: 24) {
                RiskMeter(score: report.overallScore)
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("Safety Score: \(report.overallScore)/10")
                        .bold()
                    Text(report.isSafe ? "This tune is within safe limits for your vehicle configuration." : "This tune exceeds recommended parameters.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .padding(.vertical)
            
            Divider()
            
            ForEach(report.warnings, id: \.self) { warning in
                HStack(alignment: .top) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundStyle(.orange)
                    Text(warning)
                        .font(.caption)
                }
            }
            if report.warnings.isEmpty {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(.green)
                    Text("No safety warnings detected for your profile.")
                        .font(.caption)
                }
            }
        }
        .padding()
    }
}
