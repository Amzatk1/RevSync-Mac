//
//  PurchaseView.swift
//  RevSync
//
//  Created by RevSync on 20/10/2025.
//

import SwiftUI
import Combine

struct PurchaseView: View {
    let tune: TuneModel
    @Binding var isPresented: Bool
    var onPurchaseComplete: () -> Void
    
    @Environment(\.dismiss) var dismiss
    @State private var isProcessing = false
    @State private var showPaymentSheet = false
    @State private var clientSecret: String?
    @State private var paymentError: String?
    
    // Dependencies
    private let service = MarketplaceService.shared
    @State private var cancellables = Set<AnyCancellable>()
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Complete Purchase")
                .font(.largeTitle.bold())
                .padding(.top)
            
            VStack(spacing: 16) {
                Text(tune.name)
                    .font(.headline)
                Text("$\(String(format: "%.2f", tune.price))")
                    .font(.system(size: 40, weight: .bold))
                    .foregroundStyle(.blue)
            }
            
            if let error = paymentError {
                Text(error)
                    .foregroundStyle(.red)
                    .font(.caption)
                    .multilineTextAlignment(.center)
            }
            
            Button(action: processPurchase) {
                HStack {
                    if isProcessing {
                        ProgressView()
                            .controlSize(.small)
                    } else {
                        Text("Pay Now")
                    }
                }
                .font(.headline)
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .cornerRadius(12)
            }
            .buttonStyle(.plain)
            .disabled(isProcessing)
        }
        .padding(40)
        .frame(width: 400)
    }
    
    private func processPurchase() {
        isProcessing = true
        paymentError = nil
        
        service.purchaseTune(tuneId: tune.id)
            .receive(on: DispatchQueue.main)
            .sink { completion in
                isProcessing = false
                if case let .failure(error) = completion {
                    paymentError = error.localizedDescription
                }
            } receiveValue: { _ in
                isPresented = false
                onPurchaseComplete()
            }
            .store(in: &cancellables)
    }
}
