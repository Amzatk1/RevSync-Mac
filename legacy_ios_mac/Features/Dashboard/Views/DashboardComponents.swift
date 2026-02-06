//
//  DashboardComponents.swift
//  RevSync
//
//  Extracted subviews for DashboardView.
//

import SwiftUI

struct DashboardCard: View {
    let title: String
    let subtitle: String
    let icon: String
    let gradient: LinearGradient
    let action: () -> Void
    
    @State private var isHovering = false
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                ZStack {
                    Circle()
                        .fill(gradient.opacity(0.2))
                        .frame(width: 56, height: 56)
                    
                    Image(systemName: icon)
                        .font(.system(size: 24, weight: .semibold))
                        .foregroundStyle(gradient)
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)
                    
                    Text(subtitle)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.leading)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .foregroundColor(.secondary.opacity(0.5))
            }
            .padding(20)
            .background(Color(NSColor.controlBackgroundColor))
            .cornerRadius(20)
            .shadow(color: Color.black.opacity(isHovering ? 0.15 : 0.05), radius: isHovering ? 12 : 8, x: 0, y: isHovering ? 6 : 4)
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(gradient.opacity(isHovering ? 0.5 : 0.0), lineWidth: 2)
            )
            .scaleEffect(isHovering ? 1.02 : 1.0)
            .animation(.spring(response: 0.3, dampingFraction: 0.7), value: isHovering)
        }
        .buttonStyle(.plain)
        .onHover { isHovering = $0 }
    }
}

struct SuggestionCard: View {
    let title: String
    let reason: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundStyle(color)
                Spacer()
            }
            
            Text(title)
                .font(.headline)
                .lineLimit(1)
            
            Text(reason)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(2)
        }
        .padding()
        .frame(width: 200, height: 120)
        .background(Color(NSColor.controlBackgroundColor))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}
