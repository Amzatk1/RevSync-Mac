//
//  EditTuneView.swift
//  RevSync
//
//  Created by RevSync on 24/11/2025.
//

import SwiftUI

struct EditTuneView: View {
    @StateObject private var viewModel: EditTuneViewModel
    @Environment(\.dismiss) var dismiss
    
    init(tune: TuneModel?) {
        _viewModel = StateObject(wrappedValue: EditTuneViewModel(tune: tune))
    }
    
    var body: some View {
        Form {
            Section("Details") {
                TextField("Tune Name", text: $viewModel.name)
                TextField("Description", text: $viewModel.description, axis: .vertical)
                TextField("Price ($)", text: $viewModel.price)
                #if os(iOS)
                    .keyboardType(.decimalPad)
                #endif
            }
            
            Section("Compatibility") {
                TextField("Make (e.g. Yamaha)", text: $viewModel.make)
                TextField("Model (e.g. R1)", text: $viewModel.model)
                HStack {
                    TextField("Start Year", text: $viewModel.yearStart)
                    TextField("End Year", text: $viewModel.yearEnd)
                }
                #if os(iOS)
                .keyboardType(.numberPad)
                #endif
            }
            
            if let error = viewModel.errorMessage {
                Section {
                    Text(error)
                        .foregroundStyle(.red)
                }
            }
            
            Section {
                Button(viewModel.tune == nil ? "Create Tune" : "Save Changes") {
                    viewModel.save()
                }
                .disabled(viewModel.name.isEmpty || viewModel.price.isEmpty || viewModel.isLoading)
            }
        }
        .navigationTitle(viewModel.tune == nil ? "New Tune" : "Edit Tune")
        .onChange(of: viewModel.shouldDismiss) { _, shouldDismiss in
            if shouldDismiss {
                dismiss()
            }
        }
    }
}

