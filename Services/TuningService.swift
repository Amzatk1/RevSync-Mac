//
//  TuningService.swift
//  RevSync
//
//  Phase‑1: orchestration shell with entitlement & token checks (no hardware logic yet)
//

import Foundation
import Combine

/// Validation errors that may occur before initiating a tune installation.
enum TuningError: LocalizedError {
    case notAuthenticated
    case missingVehicle
    case incompatibleVehicle

    var errorDescription: String? {
        switch self {
        case .notAuthenticated:
            return "You must be logged in to install a tune."
        case .missingVehicle:
            return "No vehicle selected. Please choose a vehicle from your garage."
        case .incompatibleVehicle:
            return "This tune is not compatible with the selected vehicle."
        }
    }
}

/// Coordinates tune installation, validating preconditions before ECU flashing.
/// In Phase‑1, this only verifies entitlements and authentication.
final class TuningService {
    private let api = APIClient.shared

    /// Validates user entitlement and session token before initiating a tuning flow.
    /// - Parameters:
    ///   - authToken: The user's current access token.
    ///   - selectedVehicleId: The identifier of the selected vehicle.
    ///   - tune: The tune model to validate.
    /// - Returns: A publisher that either completes successfully or emits a validation error.
    func validatePreconditions(authToken: String?, selectedVehicleId: UUID?, tune: TuneModel) -> AnyPublisher<Void, Error> {
        Future<Void, Error> { promise in
            guard let token = authToken, !token.isEmpty else {
                return promise(.failure(TuningError.notAuthenticated))
            }
            guard let _ = selectedVehicleId else {
                return promise(.failure(TuningError.missingVehicle))
            }
            // Simple compatibility placeholder (Phase‑1)
            // In future phases, cross‑check tune.vehicleType or ECU compatibility.
            promise(.success(()))
        }
        .eraseToAnyPublisher()
    }

    /// Placeholder orchestration for tune installation.
    /// Currently validates conditions only (no hardware integration).
    func installTune(_ tune: TuneModel, authToken: String?, vehicleId: UUID?) -> AnyPublisher<Void, Error> {
        validatePreconditions(authToken: authToken, selectedVehicleId: vehicleId, tune: tune)
            .flatMap { _ in
                // Future: trigger ECUService flash once available
                Just(())
                    .setFailureType(to: Error.self)
            }
            .eraseToAnyPublisher()
    }
}
