//
//  HapticService.swift
//  RevSync
//
//  Created by RevSync on 20/10/2025.
//

import SwiftUI
#if os(iOS)
import UIKit
#endif

class HapticService {
    static let shared = HapticService()
    
    private init() {}
    
    enum ImpactStyle {
        case light, medium, heavy, rigid, soft
    }
    
    enum NotificationType {
        case success, warning, error
    }
    
    func play(_ style: ImpactStyle) {
        #if os(iOS)
        let generator: UIImpactFeedbackGenerator
        switch style {
        case .light: generator = UIImpactFeedbackGenerator(style: .light)
        case .medium: generator = UIImpactFeedbackGenerator(style: .medium)
        case .heavy: generator = UIImpactFeedbackGenerator(style: .heavy)
        case .rigid: generator = UIImpactFeedbackGenerator(style: .rigid)
        case .soft: generator = UIImpactFeedbackGenerator(style: .soft)
        }
        generator.prepare()
        generator.impactOccurred()
        #endif
    }
    
    func notify(_ type: NotificationType) {
        #if os(iOS)
        let generator = UINotificationFeedbackGenerator()
        generator.prepare()
        switch type {
        case .success: generator.notificationOccurred(.success)
        case .warning: generator.notificationOccurred(.warning)
        case .error: generator.notificationOccurred(.error)
        }
        #endif
    }
    
    func selection() {
        #if os(iOS)
        let generator = UISelectionFeedbackGenerator()
        generator.prepare()
        generator.selectionChanged()
        #endif
    }
}

// SwiftUI Modifier for easy usage
struct HapticAction: ViewModifier {
    let trigger: Bool
    let type: HapticService.ImpactStyle
    
    func body(content: Content) -> some View {
        content
            .onChange(of: trigger) { _, value in
                if value {
                    HapticService.shared.play(type)
                }
            }
    }
}

extension View {
    func hapticFeedback(trigger: Bool, style: HapticService.ImpactStyle = .light) -> some View {
        self.modifier(HapticAction(trigger: trigger, type: style))
    }
}
