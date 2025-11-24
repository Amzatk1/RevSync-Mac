// Card.swift
// A reusable card container view.
//

import SwiftUI

/// A container view with padding, rounded corners and shadow.
struct Card<Content: View>: View {
    private let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        content
            .padding()
            .background(RoundedRectangle(cornerRadius: 12).fill(Color.gray.opacity(0.1)))
            .shadow(radius: 2)
    }
}