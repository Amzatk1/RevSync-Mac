//
//  EditTuneView.swift
//  RevSync
//
//  Created by RevSync on 24/11/2025.
//

import SwiftUI

struct EditTuneView: View {
    let tune: TuneModel? // Nil for create
    
    @State private var name = ""
    @State private var description = ""
    @State private var price = ""
    @State private var make = ""
    @State private var model = ""
    @State private var yearStart = ""
    @State private var yearEnd = ""
    
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        Form {
            Section("Details") {
                TextField("Tune Name", text: $name)
                TextField("Description", text: $description, axis: .vertical)
                TextField("Price ($)", text: $price)
                    .keyboardType(.decimalPad)
            }
            
            Section("Compatibility") {
                TextField("Make (e.g. Yamaha)", text: $make)
                TextField("Model (e.g. R1)", text: $model)
                HStack {
                    TextField("Start Year", text: $yearStart)
                    TextField("End Year", text: $yearEnd)
                }
                .keyboardType(.numberPad)
            }
            
            Section {
                Button(tune == nil ? "Create Tune" : "Save Changes") {
                    save()
                }
                .disabled(name.isEmpty || price.isEmpty)
            }
        }
        .navigationTitle(tune == nil ? "New Tune" : "Edit Tune")
        .onAppear {
            if let tune = tune {
                name = tune.name
                description = tune.description
                price = String(tune.price)
                make = tune.vehicleMake
                model = tune.vehicleModel
                yearStart = String(tune.vehicleYearStart)
                yearEnd = String(tune.vehicleYearEnd)
            }
        }
    }
    
    private func save() {
        // Implement save logic via Service
        dismiss()
    }
}
