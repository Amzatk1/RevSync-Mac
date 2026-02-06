//
//  MarketplaceView.swift
//  RevSync
//
//  Created by RevSync on 20/10/2025.
//

import SwiftUI

struct MarketplaceView: View {
    @StateObject private var viewModel = MarketplaceViewModel()
    @State private var selectedCategory: String = "All"
    @State private var showFilters: Bool = false
    @State private var selectedTune: TuneModel?
    @State private var searchText: String = ""
    
    // Filter State
    @State private var minPrice: Double = 0
    @State private var maxPrice: Double = 1000
    @State private var selectedStage: Int = 0 // 0 = All
    @State private var showVerifiedOnly: Bool = false
    
    // MARK: - Filter Logic
    private var isFiltering: Bool {
        !searchText.isEmpty || selectedStage != 0 || showVerifiedOnly || minPrice > 0 || maxPrice < 1000 || selectedCategory != "All"
    }
    
    private var filteredTunes: [TuneModel] {
        let all = (viewModel.featuredTunes + viewModel.trendingTunes)
        // Deduplicate
        var unique = [Int: TuneModel]()
        for tune in all { unique[tune.id] = tune }
        let tunes = Array(unique.values)
        
        return tunes.filter { tune in
            // Search
            if !searchText.isEmpty {
                let text = searchText.lowercased()
                if !tune.title.lowercased().contains(text) &&
                   !tune.vehicleMake.lowercased().contains(text) &&
                   !tune.vehicleModel.lowercased().contains(text) {
                    return false
                }
            }
            
            // Stage
            // Check both picker and category pill
            let targetStage = selectedStage
            if targetStage > 0 {
                guard let stage = tune.stage, stage == targetStage else { return false }
            }
            
            // Category Pill (simple mapping)
            if selectedCategory == "Stage 1" && (tune.stage ?? 0) != 1 { return false }
            if selectedCategory == "Stage 2" && (tune.stage ?? 0) != 2 { return false }
            // "Track", "Eco" not mapped yet, assuming ignored or mapped to tags later
            
            // Price
            if tune.price < minPrice || tune.price > maxPrice { return false }
            
            // Verified
            if showVerifiedOnly {
                if let rating = tune.safetyRating, rating < 8 { return false }
                if tune.safetyRating == nil { return false }
            }
            
            return true
        }
        .sorted { $0.title < $1.title }
    }    
    
    var body: some View {
        NavigationStack {
            ZStack {
                // Background Gradient
                LinearGradient(
                    colors: [.revSyncBlack, .revSyncDarkGray],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // Filter Bar
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            Button(action: { showFilters.toggle() }) {
                                HStack {
                                    Image(systemName: "slider.horizontal.3")
                                    Text("Filters")
                                }
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .glass(cornerRadius: 20)
                            }
                            .buttonStyle(.plain)
                            
                            CategoryPill(title: "All", icon: "square.grid.2x2.fill", color: .white, isSelected: selectedCategory == "All") {
                                selectedCategory = "All"; selectedStage = 0
                            }
                            CategoryPill(title: "Stage 1", icon: "1.circle.fill", color: .revSyncNeonBlue, isSelected: selectedCategory == "Stage 1") {
                                selectedCategory = "Stage 1"; selectedStage = 1
                            }
                            CategoryPill(title: "Stage 2", icon: "2.circle.fill", color: .revSyncNeonPurple, isSelected: selectedCategory == "Stage 2") {
                                selectedCategory = "Stage 2"; selectedStage = 2
                            }
                            CategoryPill(title: "Track", icon: "flag.checkered", color: .revSyncWarning, isSelected: selectedCategory == "Track") {
                                selectedCategory = "Track"
                            }
                            CategoryPill(title: "Eco", icon: "leaf.fill", color: .revSyncNeonGreen, isSelected: selectedCategory == "Eco") {
                                selectedCategory = "Eco"
                            }
                        }
                        .padding()
                    }
                    .background(.ultraThinMaterial)
                    
                    ScrollView {
                        if viewModel.isLoading {
                            ProgressView("Loading Marketplace...")
                                .padding(.top, 50)
                        } else if isFiltering {
                             // Filter Results View
                             VStack(alignment: .leading, spacing: 16) {
                                 Text("Results (\(filteredTunes.count))")
                                     .font(.title2)
                                     .fontWeight(.bold)
                                     .padding(.horizontal)
                                 
                                 if filteredTunes.isEmpty {
                                     ContentUnavailableView("No tunes found", systemImage: "magnifyingglass", description: Text("Try adjusting filters"))
                                 } else {
                                     LazyVGrid(columns: [GridItem(.adaptive(minimum: 300), spacing: 16)], spacing: 16) {
                                         ForEach(filteredTunes) { tune in
                                             TuneCard(tune: tune)
                                                 .onTapGesture {
                                                     selectedTune = tune
                                                 }
                                         }
                                     }
                                     .padding(.horizontal)
                                 }
                             }
                             .padding(.vertical)
                        } else {
                            VStack(spacing: 32) {
                                // Featured Carousel
                                VStack(alignment: .leading, spacing: 16) {
                                    Text("Featured")
                                        .font(.title2)
                                        .fontWeight(.bold)
                                        .padding(.horizontal)
                                    
                                    ScrollView(.horizontal, showsIndicators: false) {
                                        HStack(spacing: 16) {
                                            ForEach(viewModel.featuredTunes) { tune in
                                                FeaturedTuneCard(tune: tune)
                                                    .onTapGesture {
                                                        selectedTune = tune
                                                    }
                                            }
                                        }
                                        .padding(.horizontal)
                                    }
                                }
                                .padding(.top)
                            
                            // Trending Section
                            VStack(alignment: .leading, spacing: 16) {
                                HStack {
                                    Text("Trending Now")
                                        .font(.title2)
                                        .fontWeight(.bold)
                                    Spacer()
                                    Button("See All") { }
                                        .buttonStyle(.plain)
                                        .foregroundStyle(Color.revSyncNeonBlue)
                                }
                                .padding(.horizontal)
                                
                                LazyVGrid(columns: [GridItem(.adaptive(minimum: 300), spacing: 16)], spacing: 16) {
                                    ForEach(viewModel.trendingTunes) { tune in
                                        TuneCard(tune: tune)
                                            .onTapGesture {
                                                selectedTune = tune
                                            }
                                    }
                                }
                                .padding(.horizontal)
                            }
                        }
                        .padding(.bottom, 40)
                    }
                }
            }
            }
            .navigationTitle("Marketplace")
            .searchable(text: $searchText, prompt: "Search tunes, creators, or bikes...")
            .sheet(item: $selectedTune) { tune in
                TuneDetailView(tune: tune)
            }
            .sheet(isPresented: $showFilters) {
                MarketFilterSheet(
                    isPresented: $showFilters,
                    minPrice: $minPrice,
                    maxPrice: $maxPrice,
                    selectedStage: $selectedStage,
                    showVerifiedOnly: $showVerifiedOnly
                )
                .presentationDetents([.medium, .large])
            }
            .onReceive(NotificationCenter.default.publisher(for: .RevSyncDidSubmitGlobalSearch)) { note in
                if let query = note.userInfo?["query"] as? String {
                    searchText = query
                }
            }
        }
    }
}

struct FeaturedTuneCard: View {
    let tune: TuneModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ZStack(alignment: .bottomLeading) {
                LinearGradient(colors: [.revSyncNeonBlue, .revSyncNeonPurple], startPoint: .topLeading, endPoint: .bottomTrailing)
                    .frame(height: 160)
                
                VStack(alignment: .leading, spacing: 4) {
                    Badge(text: "FEATURED", color: .revSyncWarning)
                    Text(tune.title)
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundStyle(.white)
                }
                .padding()
            }
            
            VStack(alignment: .leading, spacing: 8) {
                Text("+\(String(format: "%.1f", tune.horsepowerGain ?? 0)) HP  •  +\(String(format: "%.1f", tune.torqueGain ?? 0)) Nm")
                    .font(.headline)
                
                HStack {
                    Image(systemName: "star.fill")
                        .foregroundStyle(Color.revSyncWarning)
                    Text("\(tune.safetyRating)/10")
                        .foregroundStyle(.secondary)
                    Spacer()
                    Text("$\(String(format: "%.2f", tune.price))")
                        .fontWeight(.bold)
                        .foregroundStyle(Color.revSyncNeonBlue)
                }
            }
            .padding()
            .background(.thinMaterial)
        }
        .frame(width: 300)
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.1), lineWidth: 1))
    }
}

struct FeaturedCarousel: View {
    let tunes: [TuneModel]
    
    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 16) {
                ForEach(tunes) { tune in
                    FeaturedTuneCard(tune: tune)
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 8) // Space for shadow
        }
    }
}

struct TuneCard: View {
    let tune: TuneModel
    
    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(LinearGradient(colors: [.blue.opacity(0.1), .purple.opacity(0.1)], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 80, height: 80)
                
                Image(systemName: "waveform.path.ecg")
                    .font(.largeTitle)
                    .foregroundStyle(.blue)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(tune.title)
                    .font(.headline)
                
                Text("Stage \(tune.stage ?? 1) • +\(String(format: "%.0f", tune.horsepowerGain ?? 0)) HP")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                
                HStack(spacing: 4) {
                    Image(systemName: "checkmark.shield.fill")
                        .foregroundStyle(.green)
                        .font(.caption)
                    Text("AI Verified")
                        .font(.caption)
                        .foregroundStyle(.green)
                }
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 4) {
                Text("$\(String(format: "%.2f", tune.price))")
                    .fontWeight(.bold)
                    .foregroundStyle(.blue)
                
                HStack(spacing: 2) {
                    Image(systemName: "star.fill")
                        .font(.caption)
                        .foregroundStyle(.yellow)
                    Text("\(tune.safetyRating)/10")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .glass(cornerRadius: 16)
        .onHover { hovering in
            // Hover effect handled by .hoverEffect in newer SwiftUI, or custom state
        }
    }
}

struct CategoryPill: View {
    let title: String
    let icon: String
    let color: Color
    var isSelected: Bool = false
    var action: () -> Void = {}
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .foregroundStyle(isSelected ? .white : color)
                Text(title)
                    .fontWeight(.medium)
                    .foregroundStyle(isSelected ? .white : .primary)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(.ultraThinMaterial)
            .background(isSelected ? color.opacity(0.2) : Color.clear)
            .glass(cornerRadius: 20)
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(isSelected ? color : .clear, lineWidth: 1)
            )
            .shadow(color: isSelected ? color.opacity(0.4) : .clear, radius: 8, x: 0, y: 4)
        }
        .buttonStyle(.plain)
    }
}


