//
//  RiskMeter.swift
//  RevSync
//
//  Created by RevSync on 20/10/2025.
//

import SwiftUI

struct RiskMeter: View {
    let score: Int // 0 to 10 (10 is safest)
    
    var riskLevel: String {
        switch score {
        case 9...10: return "SAFE"
        case 7...8: return "MODERATE"
        case 5...6: return "AGGRESSIVE"
        default: return "EXTREME"
        }
    }
    
    var color: Color {
        switch score {
        case 9...10: return .green
        case 7...8: return .yellow
        case 5...6: return .orange
        default: return .red
        }
    }
    
    var body: some View {
        VStack(spacing: 8) {
            ZStack {
                // Background Arc
                Circle()
                    .trim(from: 0.4, to: 0.9)
                    .stroke(Color.gray.opacity(0.2), style: StrokeStyle(lineWidth: 12, lineCap: .round))
                    .rotationEffect(.degrees(90))
                    .frame(width: 120, height: 120)
                
                // Value Arc
                Circle()
                    .trim(from: 0.4, to: 0.4 + (0.5 * (Double(10 - score) / 10.0))) // Invert logic: 10 safe (low risk), 0 unsafe (high risk). Wait, let's make it intuitive.
                    // Let's say the meter shows "Risk". So Safe = Low Meter, Extreme = High Meter.
                    // If score is Safety Score (10=Safe), then Risk is Low.
                    // Let's map Safety Score 10 -> 0% fill (Green), Safety Score 0 -> 100% fill (Red).
                    .stroke(
                        AngularGradient(
                            gradient: Gradient(colors: [.green, .yellow, .orange, .red]),
                            center: .center
                        ),
                        style: StrokeStyle(lineWidth: 12, lineCap: .round)
                    )
                    .rotationEffect(.degrees(90))
                    .frame(width: 120, height: 120)
                    .mask(
                        Circle()
                            .trim(from: 0.4, to: 0.4 + (0.5 * (Double(11 - score) / 10.0))) // 10 -> 0.1 fill, 1 -> 1.0 fill
                            .stroke(style: StrokeStyle(lineWidth: 12, lineCap: .round))
                            .rotationEffect(.degrees(90))
                    )
                
                VStack {
                    Text(riskLevel)
                        .font(.headline)
                        .foregroundStyle(color)
                    Text("RISK")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(height: 80) // Crop bottom
        }
    }
}
