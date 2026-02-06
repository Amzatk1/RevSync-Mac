//
//  ToastManager.swift
//  RevSync
//
//  Created by RevSync on 20/10/2025.
//

import Foundation
import SwiftUI

enum ToastStyle {
    case error
    case success
    case info
    
    var color: Color {
        switch self {
        case .error: return .red
        case .success: return .green
        case .info: return .blue
        }
    }
    
    var icon: String {
        switch self {
        case .error: return "exclamationmark.triangle.fill"
        case .success: return "checkmark.circle.fill"
        case .info: return "info.circle.fill"
        }
    }
}

struct Toast: Equatable {
    let style: ToastStyle
    let message: String
    let duration: TimeInterval
    
    static func == (lhs: Toast, rhs: Toast) -> Bool {
        lhs.message == rhs.message && lhs.style == rhs.style
    }
}

final class ToastManager: ObservableObject {
    @Published var currentToast: Toast? = nil
    
    private var timer: Timer?
    
    func show(_ message: String, style: ToastStyle = .info, duration: TimeInterval = 3.0) {
        DispatchQueue.main.async {
            self.currentToast = Toast(style: style, message: message, duration: duration)
            self.timer?.invalidate()
            self.timer = Timer.scheduledTimer(withTimeInterval: duration, repeats: false) { [weak self] _ in
                withAnimation {
                    self?.currentToast = nil
                }
            }
        }
    }
    
    func showError(_ message: String) {
        show(message, style: .error)
    }
    
    func showSuccess(_ message: String) {
        show(message, style: .success)
    }
}
