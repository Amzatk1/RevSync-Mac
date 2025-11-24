//
//  TuneDetailView.swift
//  RevSync
//
//  Created by RevSync on 20/10/2025.
//

import SwiftUI
import Charts
import Combine

//
//  TuneDetailView.swift
//  RevSync
//
//  Created by RevSync on 20/10/2025.
//

import SwiftUI
import Charts

struct TuneDetailView: View {
    let tune: TuneModel
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var services: AppServices
    @EnvironmentObject var appState: AppState
    @StateObject private var safetyService = SafetyAnalysisService.shared
    
    @State private var showPurchase = false
    @State private var showFlash = false
    @State private var isPurchased = false
    @State private var isContacting = false
    @State private var isPurchasing = false
    @State private var selectedTab = 0
    
    // Computed safety report
    private var safetyReport: SafetyReport {
        // Use current user and vehicle if available, otherwise mock defaults
        // Use current user and vehicle if available, otherwise mock defaults
        let user = appState.currentUser ?? UserModel(id: 0, username: "guest", email: "guest@revsync.com", role: .rider, isVerified: false)
        let vehicle = appState.currentVehicle ?? VehicleModel(id: 0, name: "My Bike", make: "Yamaha", model: "R1", year: 2024, vehicleType: .bike, ecuId: "DENSO-123", ecuSoftwareVersion: "1.0", modifications: [])
        return safetyService.analyze(tune: tune, user: user, vehicle: vehicle)
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // 1. Header
                TuneHeaderView(tune: tune, isSafe: safetyReport.isSafe)
                
                VStack(spacing: 24) {
                    // 2. Creator Profile Row
                    TuneCreatorRow(
                        onContact: { isContacting = true },
                        onFollow: { /* Follow logic */ }
                    )
                    
                    // 3. Stats Grid
                    TuneStatsGrid(tune: tune)
                    
                    // 4. Description
                    Text(tune.description)
                        .font(.body)
                        .foregroundStyle(.primary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal)
                    
                    // 5. Content Tabs
                    VStack(spacing: 0) {
                        HStack {
                            TabButton(icon: "chart.xyaxis.line", isSelected: selectedTab == 0) { selectedTab = 0 }
                            TabButton(icon: "tablecells", isSelected: selectedTab == 3) { selectedTab = 3 }
                            TabButton(icon: "list.bullet", isSelected: selectedTab == 1) { selectedTab = 1 }
                            TabButton(icon: "shield.fill", isSelected: selectedTab == 2) { selectedTab = 2 }
                        }
                        .padding(.bottom)
                        
                        Divider()
                        
                        // Tab Content
                        Group {
                            switch selectedTab {
                            case 0:
                                TuneDynoChart(tune: tune)
                            case 1:
                                TuneSpecsList(tune: tune)
                            case 2:
                                TuneSafetyReport(report: safetyReport)
                            case 3:
                                TuneTablePreview(isPurchased: isPurchased)
                            default:
                                EmptyView()
                            }
                        }
                        }
                        
                        // 6. Comments Section
                        CommentsSectionView(tuneId: tune.id)
                            .padding(.horizontal)
                            .padding(.top, 24)
                    }
                }
                .padding(.bottom, 100)
            }
        }
        .safeAreaInset(edge: .bottom) {
            VStack(spacing: 0) {
                if isPurchased {
                    Button(action: { showFlash = true }) {
                        HStack {
                            Image(systemName: "bolt.fill")
                            Text("Flash to Vehicle")
                        }
                        .font(.headline)
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.green)
                        .cornerRadius(12)
                    }
                    .buttonStyle(.plain)
                } else {
                    Button(action: { showPurchase = true }) {
                        Text("Purchase for $\(String(format: "%.2f", tune.price))")
                            .font(.headline)
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .cornerRadius(12)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding()
            .background(.ultraThinMaterial)
        }
        .navigationTitle(tune.name)
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
        .sheet(isPresented: $isContacting) {
            CreatorChatView(creatorName: "Tuner Racing")
        }
        .sheet(isPresented: $isPurchasing) {
            PurchaseView(tune: tune, onPurchaseComplete: {
                isPurchased = true
                isPurchasing = false
            })
        }
        .fullScreenCover(isPresented: $showFlash) {
            // Use current vehicle ID or 0 if none (should be guarded by UI)
            FlashView(tune: tune, vehicleId: appState.currentVehicle?.id ?? 0)
        }
        // Handle purchase trigger
        .onChange(of: showPurchase) { shouldShow in
            if shouldShow {
                showPurchase = false
                isPurchasing = true
            }
        }
        .sheet(isPresented: $showAnalysis) {
            if let report = analysisReport {
                TuneAnalysisView(report: report)
            }
        }
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button {
                    analyzeTune()
                } label: {
                    if isAnalyzing {
                        ProgressView()
                    } else {
                        Image(systemName: "brain.head.profile")
                    }
                }
                .disabled(isAnalyzing)
            }
        }
    }
    
    @State private var showAnalysis = false
    @State private var isAnalyzing = false
    @State private var analysisReport: TuneSafetyReport?
    @StateObject private var analysisService = TuneAnalysisService()
    
    private func analyzeTune() {
        isAnalyzing = true
        // Mock URL for now
        let mockUrl = URL(fileURLWithPath: "tune.bin")
        
        analysisService.analyzeTune(url: mockUrl)
            .receive(on: DispatchQueue.main)
            .sink { completion in
                isAnalyzing = false
            } receiveValue: { report in
                self.analysisReport = report
                self.showAnalysis = true
            }
            .store(in: &cancellables)
    }
    
    @State private var cancellables = Set<AnyCancellable>()
}
// MARK: - Subviews
struct StatItem: View {
    let value: String
    let label: String
    
    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.headline)
                .fontWeight(.bold)
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

struct TabButton: View {
    let icon: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 20))
                    .foregroundStyle(isSelected ? .primary : .secondary)
                
                Rectangle()
                    .fill(isSelected ? Color.primary : Color.clear)
                    .frame(height: 2)
            }
        }
        .buttonStyle(.plain)
        .frame(maxWidth: .infinity)
    }
}
struct RequirementRow: View {
    let text: String
    let icon: String
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .frame(width: 24)
                .foregroundStyle(.blue)
            Text(text)
                .font(.subheadline)
            Spacer()
        }
    }
}
struct SpecRow: View {
    let label: String
    let value: String
    
    var body: some View {
        HStack {
            Text(label)
                .foregroundStyle(.secondary)
            Spacer()
            Text(value)
                .fontWeight(.medium)
                .multilineTextAlignment(.trailing)
        }
    }
}

struct Badge: View {
    let text: String
    let color: Color
    var textColor: Color = .white
    
    var body: some View {
        Text(text)
            .font(.caption.bold())
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color)
            .foregroundStyle(textColor)
            .cornerRadius(8)
    }
}
