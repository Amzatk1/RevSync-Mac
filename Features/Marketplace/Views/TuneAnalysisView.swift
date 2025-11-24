//
//  TuneAnalysisView.swift
//  RevSync
//
//  Created by RevSync on 24/11/2025.
//

import SwiftUI

struct TuneAnalysisView: View {
    let report: TuneSafetyReport
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Score Header
                ZStack {
                    Circle()
                        .stroke(Color.gray.opacity(0.2), lineWidth: 20)
                        .frame(width: 200, height: 200)
                    
                    Circle()
                        .trim(from: 0, to: CGFloat(report.score) / 100.0)
                        .stroke(
                            scoreColor,
                            style: StrokeStyle(lineWidth: 20, lineCap: .round)
                        )
                        .rotationEffect(.degrees(-90))
                        .frame(width: 200, height: 200)
                    
                    VStack {
                        Text("\(report.score)")
                            .font(.system(size: 60, weight: .bold, design: .rounded))
                        Text(report.riskLevel.rawValue)
                            .font(.headline)
                            .foregroundStyle(scoreColor)
                    }
                }
                .padding(.top, 40)
                
                // Summary
                Text(report.summary)
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal)
                
                // Issues List
                VStack(alignment: .leading, spacing: 16) {
                    Text("Detailed Findings")
                        .font(.title3.bold())
                        .padding(.horizontal)
                    
                    ForEach(report.issues) { issue in
                        HStack(alignment: .top, spacing: 12) {
                            Image(systemName: icon(for: issue.severity))
                                .foregroundStyle(color(for: issue.severity))
                                .font(.title2)
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text(issue.title)
                                    .font(.headline)
                                Text(issue.description)
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(12)
                        .padding(.horizontal)
                    }
                }
                
                Spacer()
                
                Button("Done") {
                    dismiss()
                }
                .buttonStyle(.borderedProminent)
                .padding()
            }
        }
        .navigationTitle("AI Safety Report")
    }
    
    private var scoreColor: Color {
        switch report.score {
        case 90...100: return .green
        case 75..<90: return .yellow
        default: return .red
        }
    }
    
    private func icon(for severity: TuneIssue.IssueSeverity) -> String {
        switch severity {
        case .info: return "checkmark.circle.fill"
        case .warning: return "exclamationmark.triangle.fill"
        case .error: return "xmark.octagon.fill"
        }
    }
    
    private func color(for severity: TuneIssue.IssueSeverity) -> Color {
        switch severity {
        case .info: return .green
        case .warning: return .orange
        case .error: return .red
        }
    }
}
