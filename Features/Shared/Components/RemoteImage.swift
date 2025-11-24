// RemoteImage.swift
// Displays an image loaded from a URL.
//

import SwiftUI

/// A view that loads and displays an image from a remote URL.
struct RemoteImage: View {
    let url: URL

    var body: some View {
        AsyncImage(url: url) { phase in
            switch phase {
            case .empty:
                ProgressView()
            case .success(let image):
                image.resizable().scaledToFit()
            case .failure:
                Image(systemName: "photo")
                    .resizable()
                    .scaledToFit()
                    .foregroundColor(.secondary)
            @unknown default:
                EmptyView()
            }
        }
    }
}