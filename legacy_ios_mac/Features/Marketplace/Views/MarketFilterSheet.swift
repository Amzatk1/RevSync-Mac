// MarketFilterSheet.swift
// Advanced filters for Marketplace

import SwiftUI

struct MarketFilterSheet: View {
    @Binding var isPresented: Bool
    // Bindings to filter state
    @Binding var minPrice: Double
    @Binding var maxPrice: Double
    @Binding var selectedStage: Int
    @Binding var showVerifiedOnly: Bool
    
    var body: some View {
        ZStack {
            Color.revSyncBlack.ignoresSafeArea()
            
            VStack(spacing: 24) {
                // Header
                HStack {
                    Text("Filter Tunes")
                        .font(.title2)
                        .fontWeight(.bold)
                    Spacer()
                    Button("Done") {
                        isPresented = false
                    }
                    .foregroundStyle(Color.revSyncNeonBlue)
                }
                .padding()
                
                ScrollView {
                    VStack(alignment: .leading, spacing: 32) {
                        // Stage Filter
                        VStack(alignment: .leading) {
                            Text("Stage")
                                .font(.headline)
                                .foregroundStyle(.secondary)
                            
                            Picker("Stage", selection: $selectedStage) {
                                Text("All").tag(0)
                                Text("Stage 1").tag(1)
                                Text("Stage 2").tag(2)
                                Text("Stage 3").tag(3)
                            }
                            .pickerStyle(.segmented)
                            .glass(cornerRadius: 8)
                        }
                        
                        // Price Range
                        VStack(alignment: .leading) {
                            Text("Price Range: $\(Int(minPrice)) - $\(Int(maxPrice))")
                                .font(.headline)
                                .foregroundStyle(.secondary)
                            
                            HStack {
                                Text("$0")
                                Slider(value: $maxPrice, in: 0...1000, step: 10)
                                    .accentColor(.revSyncNeonBlue)
                                Text("$1000+")
                            }
                        }
                        
                        // Verification
                        Toggle(isOn: $showVerifiedOnly) {
                            HStack {
                                Image(systemName: "checkmark.shield.fill")
                                    .foregroundStyle(Color.revSyncNeonGreen)
                                VStack(alignment: .leading) {
                                    Text("Verified Only")
                                        .font(.headline)
                                    Text("Show only AI-verified safe tunes")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                            }
                        }
                        .toggleStyle(SwitchToggleStyle(tint: .revSyncNeonBlue))
                        .padding()
                        .glass(cornerRadius: 12)
                    }
                    .padding()
                }
                
                // Reset Button
                Button(action: {
                    minPrice = 0
                    maxPrice = 1000
                    selectedStage = 0
                    showVerifiedOnly = false
                }) {
                    Text("Reset Filters")
                        .foregroundStyle(.secondary)
                }
                .buttonStyle(.plain)
                .padding(.bottom)
            }
        }
        .preferredColorScheme(.dark)
    }
}
