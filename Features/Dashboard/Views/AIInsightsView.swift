//
//  AIInsightsView.swift
//  RevSync
//
//  Created by RevSync on 20/10/2025.
//

import SwiftUI

struct AIInsightsView: View {
    @Environment(\.dismiss) var dismiss
    
    // Mock Data for Insights
    let insights = [
        AIInsight(
            title: "Optimization Available",
            description: "Your current tune is running rich at low RPM. A Stage 1+ map could improve fuel economy by 8%.",
            type: .optimization,
            confidence: 0.92
        ),
        AIInsight(
            title: "Maintenance Alert",
            description: "Based on your mileage (12,400 mi), it's recommended to check your spark plug gaps before the next flash.",
            type: .maintenance,
            confidence: 0.85
        ),
        AIInsight(
            title: "Performance Tip",
            description: "Riders with your configuration (Yamaha R1 + Akrapovic) see a +4HP gain with the 'Track Day Pro' map.",
            type: .performance,
            confidence: 0.78
        )
    ]
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // AI Header
                    HStack(spacing: 16) {
                        Image(systemName: "brain.head.profile")
                            .font(.system(size: 40))
                            .foregroundStyle(
                                LinearGradient(colors: [.blue, .purple], startPoint: .topLeading, endPoint: .bottomTrailing)
                            )
                        
                        VStack(alignment: .leading) {
                            Text("RevSync AI")
                                .font(.title2.bold())
                            Text("Real-time Tuning Assistant")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                    }
                    .padding()
                    .background(.ultraThinMaterial)
                    .cornerRadius(16)
                    
                    // Insights List
                    ForEach(insights) { insight in
                        InsightCard(insight: insight)
                    }
                }
                .padding()
            }
            .navigationTitle("AI Insights")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
        }
    }
}

struct InsightCard: View {
    let insight: AIInsight
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: insight.type.icon)
                    .foregroundStyle(insight.type.color)
                Text(insight.type.rawValue.uppercased())
                    .font(.caption.bold())
                    .foregroundStyle(insight.type.color)
                Spacer()
                Text("\(Int(insight.confidence * 100))% Confidence")
                    .font(.caption2)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(8)
            }
            
            Text(insight.title)
                .font(.headline)
            
            Text(insight.description)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            
            Button(action: {}) {
                Text(insight.type.actionTitle)
                    .font(.caption.bold())
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(insight.type.color.opacity(0.1))
                    .foregroundStyle(insight.type.color)
                    .cornerRadius(20)
            }
            .buttonStyle(.plain)
        }
        .padding()
        .background(Color(NSColor.controlBackgroundColor))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(insight.type.color.opacity(0.2), lineWidth: 1)
        )
    }
}

struct AIInsight: Identifiable {
    let id = UUID()
    let title: String
    let description: String
    let type: InsightType
    let confidence: Double
}

enum InsightType: String {
    case optimization = "Optimization"
    case maintenance = "Maintenance"
    case performance = "Performance"
    
    var icon: String {
        switch self {
        case .optimization: return "bolt.fill"
        case .maintenance: return "wrench.fill"
        case .performance: return "gauge.with.dots.needle.bottom.50percent"
        }
    }
    
    var color: Color {
        switch self {
        case .optimization: return .blue
        case .maintenance: return .orange
        case .performance: return .purple
        }
    }
    
    var actionTitle: String {
        switch self {
        case .optimization: return "Apply Fix"
        case .maintenance: return "View Guide"
        case .performance: return "View Tune"
        }
    }
}
