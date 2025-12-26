// DesignSystem.swift
// RevSync Premium Design System
//
// Defines colors, typography, and common modifiers for the high-end "Glow Up".

import SwiftUI

// MARK: - Colors
extension Color {
    // Cyberpunk / Automotive Palette
    static let revSyncBlack = Color(hex: "0A0A0A") // Deep black
    static let revSyncDarkGray = Color(hex: "121212") // Surface
    static let revSyncNeonBlue = Color(hex: "00F0FF") // Accent 1
    static let revSyncNeonPurple = Color(hex: "BC13FE") // Accent 2
    static let revSyncNeonGreen = Color(hex: "00FF94") // Success/Active
    static let revSyncWarning = Color(hex: "FFCC00") // Warning
    static let revSyncError = Color(hex: "FF003C") // Error
    
    // Hex Init Helper
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 1, 1, 1)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// MARK: - View Modifiers
struct GlassMorphic: ViewModifier {
    var cornerRadius: CGFloat
    
    func body(content: Content) -> some View {
        content
            .background(.ultraThinMaterial)
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .stroke(
                        LinearGradient(
                            colors: [.white.opacity(0.2), .white.opacity(0.05)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 1
                    )
            )
            .shadow(color: .black.opacity(0.2), radius: 10, x: 0, y: 10)
            .cornerRadius(cornerRadius)
    }
}

struct NeonGlow: ViewModifier {
    var color: Color
    var radius: CGFloat
    
    func body(content: Content) -> some View {
        content
            .shadow(color: color.opacity(0.5), radius: radius, x: 0, y: 0)
            .shadow(color: color.opacity(0.3), radius: radius * 2, x: 0, y: 0)
    }
}

extension View {
    func glass(cornerRadius: CGFloat = 16) -> some View {
        self.modifier(GlassMorphic(cornerRadius: cornerRadius))
    }
    
    func neonGlow(color: Color = .revSyncNeonBlue, radius: CGFloat = 10) -> some View {
        self.modifier(NeonGlow(color: color, radius: radius))
    }
}
