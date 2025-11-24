//
//  MockAdapter.swift
//  RevSync
//
//  Created by RevSync on 24/11/2025.
//

import Foundation
import Combine

final class MockAdapter: OBDAdapter {
    private let stateSubject = CurrentValueSubject<OBDConnectionState, Never>(.disconnected)
    var state: AnyPublisher<OBDConnectionState, Never> { stateSubject.eraseToAnyPublisher() }
    
    func connect() {
        stateSubject.send(.connecting)
        
        // Simulate connection delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
            self?.stateSubject.send(.connected)
        }
    }
    
    func disconnect() {
        stateSubject.send(.disconnected)
    }
    
    func send(command: String) -> AnyPublisher<String, Error> {
        // Simulate network latency
        Future<String, Error> { promise in
            DispatchQueue.global().asyncAfter(deadline: .now() + 0.1) {
                let response = self.mockResponse(for: command)
                promise(.success(response))
            }
        }
        .eraseToAnyPublisher()
    }
    
    private func mockResponse(for command: String) -> String {
        switch command {
        case OBDPID.vin.rawValue:
            return "49 02 01 31 48 47 43 4D 38 32 36 33 4A 41 30 30 31 32 33" // Mock VIN hex
        case OBDPID.rpm.rawValue:
            // Random RPM between 1000 and 8000
            let rpm = Int.random(in: 1000...8000) * 4
            let hex = String(format: "%04X", rpm)
            return "41 0C \(hex.prefix(2)) \(hex.suffix(2))"
        case OBDPID.speed.rawValue:
            let speed = Int.random(in: 0...200)
            return "41 0D \(String(format: "%02X", speed))"
        case OBDPID.throttle.rawValue:
            let tps = Int.random(in: 0...100) * 255 / 100
            return "41 11 \(String(format: "%02X", tps))"
        case "ATZ":
            return "ELM327 v1.5"
        default:
            return "NO DATA"
        }
    }
}
