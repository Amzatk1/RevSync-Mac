//
//  LiveMonitorService.swift
//  RevSync
//
//  Created by RevSync on 24/11/2025.
//

import Foundation
import Combine

struct LiveDataPoint {
    var rpm: Double = 0
    var speed: Int = 0
    var throttle: Double = 0
    var timestamp: Date = Date()
}

final class LiveMonitorService: ObservableObject {
    @Published var currentData = LiveDataPoint()
    @Published var isMonitoring = false
    
    private let client = OBDClient.shared
    private var timer: Timer?
    private var cancellables = Set<AnyCancellable>()
    
    func startMonitoring() {
        guard !isMonitoring else { return }
        isMonitoring = true
        
        // Ensure connected
        if case .disconnected = client.connectionState {
            client.connect()
        }
        
        // Poll every 0.2s (5Hz)
        timer = Timer.scheduledTimer(withTimeInterval: 0.2, repeats: true) { [weak self] _ in
            self?.poll()
        }
    }
    
    func stopMonitoring() {
        isMonitoring = false
        timer?.invalidate()
        timer = nil
    }
    
    private func poll() {
        // In a real app, we'd chain these or use a more sophisticated queue to avoid overlapping requests
        // For now, we fire them off.
        
        client.readRPM()
            .replaceError(with: 0)
            .sink { [weak self] val in self?.currentData.rpm = val }
            .store(in: &cancellables)
            
        client.readSpeed()
            .replaceError(with: 0)
            .sink { [weak self] val in self?.currentData.speed = val }
            .store(in: &cancellables)
            
        client.readThrottle()
            .replaceError(with: 0)
            .sink { [weak self] val in self?.currentData.throttle = val }
            .store(in: &cancellables)
            
        currentData.timestamp = Date()
    }
}
