//
//  OBDClient.swift
//  RevSync
//
//  Created by RevSync on 24/11/2025.
//

import Foundation
import Combine

/// Represents the connection state of the OBD adapter.
enum OBDConnectionState {
    case disconnected
    case connecting
    case connected
    case error(String)
}

/// Standard OBD-II PIDs (Parameter IDs)
enum OBDPID: String {
    case vin = "0902"       // Vehicle Identification Number
    case rpm = "010C"       // Engine RPM
    case speed = "010D"     // Vehicle Speed
    case throttle = "0111"  // Throttle Position
    case coolant = "0105"   // Coolant Temperature
    case voltage = "ATRV"   // Voltage (ELM327 command)
}

/// Protocol defining the capabilities of an OBD adapter.
protocol OBDAdapter {
    var state: AnyPublisher<OBDConnectionState, Never> { get }
    
    func connect()
    func disconnect()
    func send(command: String) -> AnyPublisher<String, Error>
}

/// Main client for interacting with the vehicle hardware.
final class OBDClient: ObservableObject {
    static let shared = OBDClient()
    
    @Published var connectionState: OBDConnectionState = .disconnected
    
    private var adapter: OBDAdapter
    private var cancellables = Set<AnyCancellable>()
    
    init(adapter: OBDAdapter = MockAdapter()) {
        self.adapter = adapter
        
        adapter.state
            .receive(on: DispatchQueue.main)
            .assign(to: \.connectionState, on: self)
            .store(in: &cancellables)
    }
    
    func useAdapter(_ newAdapter: OBDAdapter) {
        self.adapter = newAdapter
        
        // Re-bind state
        cancellables.removeAll()
        newAdapter.state
            .receive(on: DispatchQueue.main)
            .assign(to: \.connectionState, on: self)
            .store(in: &cancellables)
    }
    
    func connect() {
        adapter.connect()
    }
    
    func disconnect() {
        adapter.disconnect()
    }
    
    func sendCommand(_ command: String) -> AnyPublisher<String, Error> {
        adapter.send(command: command)
    }
    
    // MARK: - Convenience Methods
    
    func readVIN() -> AnyPublisher<String, Error> {
        sendCommand(OBDPID.vin.rawValue)
            .tryMap { response in
                // Expected: "49 02 01 31 48..." (Mode 09 PID 02)
                // We need to strip headers and decode ASCII
                let clean = response.replacingOccurrences(of: " ", with: "")
                // Basic validation: check for 49 02 prefix
                guard clean.hasPrefix("4902") else {
                    // Some adapters might just return the raw ASCII if configured differently,
                    // but standard is hex. For now, let's assume standard hex response.
                    // If it's a mock response like "49 02 ...", we handle it.
                    if response.contains("NO DATA") { throw OBDError.noData }
                    return response // Fallback
                }
                
                // Decode hex to string
                // Skip first 4 chars (4902) + 2 chars (Frame count if present)
                // This is a simplified parser. Real OBD VINs span multiple frames (ISO 15765-4).
                // For this MVP, we assume the Mock/WiFi adapter handles the multi-frame reassembly 
                // or returns a simple string for testing.
                
                let hexString = clean.dropFirst(4) // Remove 4902
                var vin = ""
                var index = hexString.startIndex
                while index < hexString.endIndex {
                    let nextIndex = hexString.index(index, offsetBy: 2)
                    if nextIndex <= hexString.endIndex {
                        let byteString = hexString[index..<nextIndex]
                        if let byte = UInt8(byteString, radix: 16), byte > 0 { // Skip nulls
                            vin.append(Character(UnicodeScalar(byte)))
                        }
                    }
                    index = nextIndex
                }
                return vin
            }
            .eraseToAnyPublisher()
    }
    
    func readRPM() -> AnyPublisher<Double, Error> {
        sendCommand(OBDPID.rpm.rawValue)
            .tryMap { response in
                // Expected: "41 0C A B" where RPM = ((A * 256) + B) / 4
                let bytes = self.parseHex(response)
                guard bytes.count >= 4, bytes[0] == 0x41, bytes[1] == 0x0C else {
                    throw OBDError.invalidResponse
                }
                let a = Double(bytes[2])
                let b = Double(bytes[3])
                return ((a * 256.0) + b) / 4.0
            }
            .eraseToAnyPublisher()
    }
    
    func readSpeed() -> AnyPublisher<Int, Error> {
        sendCommand(OBDPID.speed.rawValue)
            .tryMap { response in
                // Expected: "41 0D A" where Speed = A km/h
                let bytes = self.parseHex(response)
                guard bytes.count >= 3, bytes[0] == 0x41, bytes[1] == 0x0D else {
                    throw OBDError.invalidResponse
                }
                return Int(bytes[2])
            }
            .eraseToAnyPublisher()
    }
    
    func readThrottle() -> AnyPublisher<Double, Error> {
        sendCommand(OBDPID.throttle.rawValue)
            .tryMap { response in
                // Expected: "41 11 A" where TPS = (A * 100) / 255
                let bytes = self.parseHex(response)
                guard bytes.count >= 3, bytes[0] == 0x41, bytes[1] == 0x11 else {
                    throw OBDError.invalidResponse
                }
                return (Double(bytes[2]) * 100.0) / 255.0
            }
            .eraseToAnyPublisher()
    }
    
    // MARK: - Helpers
    
    private func parseHex(_ response: String) -> [UInt8] {
        let clean = response.replacingOccurrences(of: " ", with: "")
        var data = [UInt8]()
        var index = clean.startIndex
        while index < clean.endIndex {
            let nextIndex = clean.index(index, offsetBy: 2)
            if let byte = UInt8(clean[index..<nextIndex], radix: 16) {
                data.append(byte)
            }
            index = nextIndex
        }
        return data
    }
}

enum OBDError: Error {
    case invalidResponse
    case notConnected
    case noData
}
