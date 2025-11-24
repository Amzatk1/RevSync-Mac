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
    private let service = MarketplaceService()
    
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
                Text(tune.name)
                    .font(.system(size: 32, weight: .heavy))
                    .foregroundStyle(.white)
                
                HStack {
                    Badge(text: "Stage \(tune.stage)", color: .orange)
                    Badge(text: "\(tune.vehicleMake) \(tune.vehicleModel)", color: .gray)
                }
            }
            .padding()
            
            // Like Button
            VStack {
                HStack {
                    Spacer()
                    Button(action: toggleLike) {
                        HStack(spacing: 4) {
                            Image(systemName: isLiked ? "heart.fill" : "heart")
                                .foregroundStyle(isLiked ? .red : .white)
                            if likeCount > 0 {
                                Text("\(likeCount)")
                                    .font(.caption.bold())
                                    .foregroundStyle(.white)
                            }
                        }
                        .padding(12)
                        .background(.ultraThinMaterial)
                        .clipShape(Circle())
                    }
                    .padding()
                }
                Spacer()
            }
        }
        .onAppear {
            // In a real app, we'd fetch the initial like status and count here
            // For now, we'll just mock it or leave it as default
        }
    }
    
    private func toggleLike() {
        // Optimistic update
        isLiked.toggle()
        likeCount += isLiked ? 1 : -1
        
        service.toggleLike(tuneId: tune.id)
            .sink { completion in
                // Handle error (revert state)
                if case .failure = completion {
                    isLiked.toggle()
                    likeCount += isLiked ? 1 : -1
                }
            } receiveValue: { _ in }
            .store(in: &cancellables)
    }
}

// MARK: - Creator Row
struct TuneCreatorRow: View {
    let onContact: () -> Void
    let onFollow: () -> Void
    
    var body: some View {
        HStack {
            Circle()
            // Placeholder for creator avatar
                .fill(Color.gray.opacity(0.3))
                .frame(width: 50, height: 50)
                .overlay(Text("TR").font(.headline))
            
            VStack(alignment: .leading) {
                Text("Tuner Racing")
                    .font(.headline)
                Text("Verified Tuner • 4.9 ★")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            
            Spacer()
            
            Button(action: onContact) {
                Text("Contact")
                    .font(.subheadline.bold())
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(20)
            }
            .buttonStyle(.plain)
            
            Button(action: onFollow) {
                Text("Follow")
                    .font(.subheadline.bold())
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(Color.blue)
                    .foregroundStyle(.white)
                    .cornerRadius(20)
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal)
        .padding(.top, 20)
    }
}

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
            StatItem(value: "\(tune.fileSizeKb) KB", label: "Size")
        }
        .padding(.vertical, 8)
    }
}

// MARK: - Dyno Chart
struct TuneDynoChart: View {
    let tune: TuneModel
    
    var body: some View {
        VStack {
            if let urlString = tune.dynoChartUrl, let url = URL(string: urlString) {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .empty:
                        ProgressView()
                    case .success(let image):
                        image.resizable()
                             .aspectRatio(contentMode: .fit)
                    case .failure:
                        Image(systemName: "chart.xyaxis.line")
                            .font(.largeTitle)
                            .foregroundStyle(.secondary)
                    @unknown default:
                        EmptyView()
                    }
                }
                .frame(height: 200)
                .padding()
                Text("Dyno Chart")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else {
                Text("No Dyno Chart Available")
                    .foregroundStyle(.secondary)
                    .padding()
            }
        }
        .padding()
    }
}

// MARK: - Table Preview
struct TuneTablePreview: View {
    let isPurchased: Bool
    
    var body: some View {
        VStack(spacing: 24) {
            tableSection(title: "Fuel Map (VE)", color: .blue)
            tableSection(title: "Ignition Timing", color: .orange)
        }
        .padding()
    }
    
    private func tableSection(title: String, color: Color) -> some View {
        VStack(alignment: .leading) {
            Text(title)
                .font(.headline)
            
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 8), spacing: 2) {
                ForEach(0..<64) { _ in
                    Rectangle()
                        .fill(color.opacity(Double.random(in: 0.3...0.8)))
                        .frame(height: 20)
                }
            }
            .blur(radius: isPurchased ? 0 : 6)
            .overlay {
                if !isPurchased {
                    VStack {
                        Image(systemName: "lock.fill")
                            .font(.largeTitle)
                            Text("Purchase to Unlock")
                            .font(.caption)
                            .bold()
                    }
                    .foregroundStyle(.white)
                    .padding()
                    .background(.ultraThinMaterial)
                    .cornerRadius(12)
                }
            }
        }
    }
}

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
                SpecRow(label: "Size", value: "\(tune.fileSizeKb) KB")
                SpecRow(label: "Safety Rating", value: "\(tune.safetyRating)/10")
            }
        }
        .padding()
    }
}

// MARK: - Safety Report
struct TuneSafetyReport: View {
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
