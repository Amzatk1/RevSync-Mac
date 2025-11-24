// BluetoothTransport.swift
// Minimal Bluetooth transport stub for Phase‑1 (no hardware implementation)
//

import Foundation
import Combine

/// A stub implementation of a Bluetooth transport used by ECUService.
final class BluetoothTransport {
    /// Whether a Bluetooth connection is active. Managed by higher layers once implemented.
    private(set) var isConnected: Bool = false

    // MARK: - Connection lifecycle (stubs)
    func connect() { isConnected = true }
    func disconnect() { isConnected = false }

    // MARK: - Flashing (Phase‑1 stubs)
    /// Attempts to flash a tune via Bluetooth.
    /// - Throws: `ECUError.notConnected` if there is no active connection.
    func flashTune(_ tune: TuneModel) throws {
        guard isConnected else { throw ECUError.notConnected }
        // No hardware logic in Phase‑1
    }

    /// Returns a progress stream for flashing. Empty in Phase‑1 (no simulated progress).
    func flashProgress(_ tune: TuneModel) -> AnyPublisher<Double, Never> {
        guard isConnected else { return Empty().eraseToAnyPublisher() }
        return Empty(completeImmediately: true).eraseToAnyPublisher()
    }
}
