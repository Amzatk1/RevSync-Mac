//
//  TuneDetailView.swift
//  RevSync
//
//  Created by RevSync on 20/10/2025.
//

import SwiftUI
import Charts
import Combine

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
    @State private var safetyReport: SafetyReport?
    @State private var isAnalyzingSafety = false
    
    var body: some View {
        ZStack {
            // Background
            LinearGradient(
                colors: [.revSyncBlack, .revSyncDarkGray],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()
            
            ScrollView {
                VStack(spacing: 0) {
                    // 1. Header
                    TuneHeaderView(tune: tune, isSafe: safetyReport?.isSafe ?? true)
                    
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
                                    if let report = safetyReport {
                                        TuneSafetyReportView(report: report)
                                    } else if isAnalyzingSafety {
                                        ProgressView("Analyzing Safety...")
                                            .padding()
                                    } else {
                                        Text("Safety analysis unavailable.")
                                            .foregroundStyle(.secondary)
                                            .padding()
                                    }
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
    
            .safeAreaInset(edge: .bottom) {
                VStack(spacing: 0) {
                    if isPurchased {
                        Button(action: { 
                            HapticService.shared.play(.heavy)
                            showFlash = true 
                        }) {
                            HStack {
                                Image(systemName: "bolt.fill")
                                Text("Flash to Vehicle")
                            }
                            .font(.headline)
                            .foregroundStyle(Color.revSyncBlack)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.revSyncNeonGreen)
                            .cornerRadius(12)
                            .neonGlow(color: .revSyncNeonGreen)
                        }
                        .buttonStyle(.plain)
                    } else {
                        Button(action: { 
                            HapticService.shared.play(.medium)
                            showPurchase = true 
                        }) {
                            Text("Purchase for $\(String(format: "%.2f", tune.price))")
                                .font(.headline)
                                .foregroundStyle(Color.revSyncBlack)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.revSyncNeonBlue)
                                .cornerRadius(12)
                                .neonGlow(color: .revSyncNeonBlue)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding()
                .background(.ultraThinMaterial)
            }
        }
        .navigationTitle(tune.name)
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
        .sheet(isPresented: $isContacting) {
            CreatorChatView(creatorName: "Tuner Racing")
        }
        .sheet(isPresented: $isPurchasing) {
            PurchaseView(tune: tune, isPresented: $isPurchasing, onPurchaseComplete: {
                isPurchased = true
                isPurchasing = false
            })
        }
        .sheet(isPresented: $showFlash) {
            // Use current vehicle ID or 0 if none (should be guarded by UI)
            FlashView(tune: tune, vehicleId: appState.currentVehicle?.id ?? 0)
        }
        // Handle purchase trigger
        .onChange(of: showPurchase) { _, shouldShow in
            if shouldShow {
                showPurchase = false
                isPurchasing = true
            }
        }
        .onChange(of: isPurchased) { _, completed in
            if completed {
                HapticService.shared.notify(.success)
            }
        }
        .sheet(isPresented: $showAnalysis) {
            if let report = analysisReport {
                TuneAnalysisView(report: report)
            }
        }

        .onAppear {
            fetchSafetyReport()
        }
    }
    
    // MARK: - Methods
    
    private func fetchSafetyReport() {
        guard let vehicle = appState.currentVehicle else { return }
        isAnalyzingSafety = true
        
        safetyService.analyze(tuneId: tune.id, vehicleId: vehicle.id)
            .receive(on: DispatchQueue.main)
            .sink { completion in
                isAnalyzingSafety = false
            } receiveValue: { report in
                self.safetyReport = report
            }
            .store(in: &cancellables)
    }
    
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
    
    // MARK: - Properties (Analysis)
    @State private var showAnalysis = false
    @State private var isAnalyzing = false
    @State private var analysisReport: TuneSafetyReport?
    @StateObject private var analysisService = TuneAnalysisService()
    
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
        Button(action: {
            HapticService.shared.selection()
            action()
        }) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 20))
                    .foregroundStyle(isSelected ? Color.revSyncNeonBlue : .secondary)
                
                Rectangle()
                    .fill(isSelected ? Color.revSyncNeonBlue : Color.clear)
                    .frame(height: 2)
                    .shadow(color: isSelected ? .revSyncNeonBlue.opacity(0.8) : .clear, radius: 4)
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

// Badge removed (defined elsewhere)
