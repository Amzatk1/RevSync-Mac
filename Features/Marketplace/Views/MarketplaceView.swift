//
//  MarketplaceView.swift
//  RevSync
//
//  Created by RevSync on 20/10/2025.
//

import SwiftUI

struct MarketplaceView: View {
    @State private var selectedCategory: String = "All"
    @State private var showFilters: Bool = false
    
    var body: some View {
        NavigationStack {
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
                            .background(Color.gray.opacity(0.1))
                            .cornerRadius(20)
                        }
                        .buttonStyle(.plain)
                        
                        CategoryPill(title: "All", icon: "square.grid.2x2.fill", color: .primary, isSelected: selectedCategory == "All") { selectedCategory = "All" }
                        CategoryPill(title: "Stage 1", icon: "1.circle.fill", color: .blue, isSelected: selectedCategory == "Stage 1") { selectedCategory = "Stage 1" }
                        CategoryPill(title: "Stage 2", icon: "2.circle.fill", color: .purple, isSelected: selectedCategory == "Stage 2") { selectedCategory = "Stage 2" }
                        CategoryPill(title: "Track", icon: "flag.checkered", color: .orange, isSelected: selectedCategory == "Track") { selectedCategory = "Track" }
                        CategoryPill(title: "Eco", icon: "leaf.fill", color: .green, isSelected: selectedCategory == "Eco") { selectedCategory = "Eco" }
                    }
                    .padding()
                }
                .background(.ultraThinMaterial)
                
                ScrollView {
                    if viewModel.isLoading {
                        ProgressView("Loading Marketplace...")
                            .padding(.top, 50)
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
                                    .foregroundStyle(.blue)
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
            .navigationTitle("Marketplace")
            .searchable(text: $searchText, prompt: "Search tunes, creators, or bikes...")
            .sheet(item: $selectedTune) { tune in
                TuneDetailView(tune: tune)
            }
            .sheet(isPresented: $showFilters) {
                Text("Advanced Filters (Mock)")
                    .presentationDetents([.medium])
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
                LinearGradient(colors: [.blue, .purple], startPoint: .topLeading, endPoint: .bottomTrailing)
                    .frame(height: 160)
                
                VStack(alignment: .leading, spacing: 4) {
                    Badge(text: "FEATURED", color: .yellow)
                    Text(tune.name)
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundStyle(.white)
                }
                .padding()
            }
            
            VStack(alignment: .leading, spacing: 8) {
                Text("+\(String(format: "%.1f", tune.horsepowerGain)) HP  •  +\(String(format: "%.1f", tune.torqueGain)) Nm")
                    .font(.headline)
                
                HStack {
                    Image(systemName: "star.fill")
                        .foregroundStyle(.yellow)
                    Text(String(format: "%.1f", tune.rating))
                        .foregroundStyle(.secondary)
                    Spacer()
                    Text("$\(String(format: "%.2f", tune.price))")
                        .fontWeight(.bold)
                        .foregroundStyle(.blue)
                }
            }
            .padding()
            .background(Color.gray.opacity(0.1))
        }
        .frame(width: 300)
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
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
                Text(tune.name)
                    .font(.headline)
                
                Text("Stage \(tune.stage) • +\(String(format: "%.0f", tune.horsepowerGain)) HP")
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
                    Text(String(format: "%.1f", tune.rating))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.05), radius: 2, x: 0, y: 1)
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
            .background(isSelected ? color : Color.gray.opacity(0.1))
            .cornerRadius(20)
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(color.opacity(0.3), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}


