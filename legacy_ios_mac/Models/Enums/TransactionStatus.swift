//
//  TransactionStatus.swift
//  
//
//  Created by Ayooluwa  Karim on 20/10/2025.
//


//
//  TransactionStatus.swift
//  RevSync
//
//  Created by Ayooluwa Karim on 20/10/2025.
//

import Foundation

/// Represents the lifecycle state of a marketplace transaction.
/// Used to track purchase progress and payment status.
enum TransactionStatus: String, Codable, CaseIterable, Identifiable {
    /// Transaction has been initiated but not yet completed.
    case pending
    /// Transaction was completed successfully and funds were processed.
    case succeeded
    /// Transaction failed or was cancelled.
    case failed

    /// Human‑readable label for UI display.
    var description: String {
        switch self {
        case .pending:  return "Pending"
        case .succeeded: return "Succeeded"
        case .failed:   return "Failed"
        }
    }

    /// Conformance for Identifiable (useful in SwiftUI pickers).
    var id: String { rawValue }
}
