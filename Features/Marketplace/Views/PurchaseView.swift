//
//  PurchaseView.swift
//  RevSync
//
//  Created by RevSync on 20/10/2025.
//

import SwiftUI

struct PurchaseView: View {
    let tune: TuneModel
    @Binding var isPresented: Bool
    var onPurchaseComplete: () -> Void
    
    @State private var isProcessing = false
    @State private var errorMessage: String?
    
    // Dependencies
    private let service = PurchaseService.shared
    @State private var cancellables = Set<AnyCancellable>()
    
    var body: some View {
        VStack(spacing: 32) {
            Text("Confirm Purchase")
                .font(.title.bold())
            
            VStack(spacing: 16) {
                Text(tune.name)
                    .font(.headline)
                Text("$\(String(format: "%.2f", tune.price))")
                    .font(.system(size: 40, weight: .bold))
                    .foregroundStyle(.blue)
            }
            
            if let error = errorMessage {
                Text(error)
                    .foregroundStyle(.red)
                    .font(.caption)
                    .multilineTextAlignment(.center)
            }
            
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Image(systemName: "creditcard.fill")
                    Text("Visa ending in 4242")
                    Spacer()
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(.green)
                }
                .padding()
                .background(Color.gray.opacity(0.1))
                .cornerRadius(12)
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
        errorMessage = nil
        
        service.purchaseTune(tuneId: tune.id)
            .receive(on: DispatchQueue.main)
            .sink { completion in
                isProcessing = false
                if case let .failure(error) = completion {
                    errorMessage = error.localizedDescription
                }
            } receiveValue: { _ in
                isPresented = false
                onPurchaseComplete()
            }
            .store(in: &cancellables)
    }
}
