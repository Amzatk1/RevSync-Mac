// ECUService.swift
// Provides high‑level operations against the ECU.
//

import Foundation
import Combine

/// Progress stream type for tune flashing (0.0...1.0). Never fails in Phase‑1.
typealias TuningProgress = AnyPublisher<Double, Never>

/// Errors thrown by ECU operations.
enum ECUError: Error {
    case notConnected
    case unsupported
}

/// High‑level API for interacting with a vehicle's ECU.
final class ECUService {
    private let usbTransport = UsbTransport()
    private let bluetoothTransport = BluetoothTransport()

    /// Whether any transport is currently connected.
    var isConnected: Bool { usbTransport.isConnected || bluetoothTransport.isConnected }

    // MARK: - Phase‑1 APIs (no hardware logic)

    /// Flashes a tune to the ECU using an available transport (synchronous/throwing, legacy signature preserved).
    /// - Parameter tune: The tune to flash.
    /// - Throws: `ECUError.notConnected` when no transport is available.
    func flash(tune: TuneModel) throws {
        if usbTransport.isConnected {
            try usbTransport.flashTune(tune)
        } else if bluetoothTransport.isConnected {
            try bluetoothTransport.flashTune(tune)
        } else {
            throw ECUError.notConnected
        }
    }

    /// Flashes a tune and emits progress updates (0.0...1.0). Emits no values if not connected (Phase‑1).
    /// - Parameter tune: The tune to flash.
    /// - Returns: A progress publisher (never fails). In Phase‑1, emits nothing without a connection.
    func flashWithProgress(tune: TuneModel) -> TuningProgress {
        if usbTransport.isConnected {
            return usbTransport.flashProgress(tune)
        }
        if bluetoothTransport.isConnected {
            return bluetoothTransport.flashProgress(tune)
        }
        // Not connected: return an empty stream (no mock progress in Phase‑1)
        return Empty(completeImmediately: true).eraseToAnyPublisher()
    }
}
