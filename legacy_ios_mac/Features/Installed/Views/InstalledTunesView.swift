// InstalledTunesView.swift
// Shows tunes installed on the user's ECU.
//

import SwiftUI

/// Displays a list of tunes currently installed.
struct InstalledTunesView: View {
    var body: some View {
        Text("Installed Tunes")
            .font(.title)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}