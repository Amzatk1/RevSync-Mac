//
//  WifiAdapter.swift
//  RevSync
//
//  Created by RevSync on 24/11/2025.
//

import Foundation
import Combine
import Network

final class WifiAdapter: OBDAdapter {
    private let host: NWEndpoint.Host
    private let port: NWEndpoint.Port
    private var connection: NWConnection?
    
    private let stateSubject = CurrentValueSubject<OBDConnectionState, Never>(.disconnected)
    var state: AnyPublisher<OBDConnectionState, Never> { stateSubject.eraseToAnyPublisher() }
    
    init(host: String = "192.168.0.10", port: UInt16 = 35000) {
        self.host = NWEndpoint.Host(host)
        self.port = NWEndpoint.Port(rawValue: port)!
    }
    
    func connect() {
        stateSubject.send(.connecting)
        
        connection = NWConnection(host: host, port: port, using: .tcp)
        
        connection?.stateUpdateHandler = { [weak self] state in
            switch state {
            case .ready:
                self?.stateSubject.send(.connected)
                // Initialize ELM327
                self?.initializeELM()
            case .failed(let error):
                self?.stateSubject.send(.error(error.localizedDescription))
            case .cancelled:
                self?.stateSubject.send(.disconnected)
            default:
                break
            }
        }
        
        connection?.start(queue: .global())
    }
    
    func disconnect() {
        connection?.cancel()
        connection = nil
        stateSubject.send(.disconnected)
    }
    
    func send(command: String) -> AnyPublisher<String, Error> {
        guard stateSubject.value.isConnected else {
            return Fail(error: OBDError.notConnected).eraseToAnyPublisher()
        }
        
        return Future<String, Error> { [weak self] promise in
            guard let self = self else { return }
            
            let data = (command + "\r").data(using: .ascii)!
            
            self.connection?.send(content: data, completion: .contentProcessed { error in
                if let error = error {
                    promise(.failure(error))
                    return
                }
                
                // Read response
                self.readResponse(promise: promise)
            })
        }
        .eraseToAnyPublisher()
    }
    
    private func readResponse(promise: @escaping (Result<String, Error>) -> Void) {
        connection?.receive(minimumIncompleteLength: 1, maximumLength: 1024) { data, _, isComplete, error in
            if let error = error {
                promise(.failure(error))
                return
            }
            
            if let data = data, let response = String(data: data, encoding: .ascii) {
                // ELM327 ends response with '>'
                if response.contains(">") {
                    promise(.success(response.replacingOccurrences(of: ">", with: "").trimmingCharacters(in: .whitespacesAndNewlines)))
                } else {
                    // Keep reading if not complete (simplified for this example)
                    // In production, we'd buffer until '>'
                    promise(.success(response)) 
                }
            }
        }
    }
    
    private func initializeELM() {
        // Basic setup commands
        _ = send(command: "ATZ") // Reset
        _ = send(command: "ATE0") // Echo Off
        _ = send(command: "ATSP0") // Auto Protocol
    }
}

extension OBDConnectionState {
    var isConnected: Bool {
        if case .connected = self { return true }
        return false
    }
}

enum OBDError: Error {
    case notConnected
    case invalidResponse
}
