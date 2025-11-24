// AddVehicleView.swift
// Presents a form to add a new vehicle (macOS).
//

import SwiftUI

/// A sheet that gathers new vehicle information.
struct AddVehicleView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var databaseService = VehicleDatabaseService.shared

    @Binding var isPresented: Bool
    @ObservedObject var viewModel: GarageViewModel

    // Form fields
    @State private var name: String = ""
    @State private var make: String = ""
    @State private var model: String = ""
    @State private var year: String = ""
    @State private var vin: String = ""
    @State private var vehicleType: VehicleType = .bike
    @State private var vehicleType: VehicleType = .bike

    // Validation
    @State private var errorMessage: String? = nil
    
    // Dynamic Data Sources
    var availableMakes: [String] {
        databaseService.getMakes(for: vehicleType)
    }
    
    var availableModels: [String] {
        databaseService.getModels(for: make, type: vehicleType)
    }
    
    var availableYears: [String] {
        databaseService.getYears(for: model, make: make, type: vehicleType)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            header

            Form {
                Section("Basics") {
                    TextField("Nickname (e.g. Track Bike)", text: $name)
                        .textFieldStyle(.roundedBorder)
                        .onSubmit { validate() }

                    Picker("Vehicle Type", selection: $vehicleType) {
                        Text(VehicleType.bike.description).tag(VehicleType.bike)
                        Text(VehicleType.car.description).tag(VehicleType.car)
                    }
                    .pickerStyle(.segmented)
                    .onChange(of: vehicleType) { _ in
                        make = ""
                        model = ""
                        year = ""
                    }

                    Picker("Make", selection: $make) {
                        Text("Select Make").tag("")
                        ForEach(availableMakes, id: \.self) { make in
                            Text(make).tag(make)
                        }
                    }
                    .onChange(of: make) { _ in
                        model = ""
                        year = ""
                    }
                    
                    Picker("Model", selection: $model) {
                        Text("Select Model").tag("")
                        ForEach(availableModels, id: \.self) { model in
                            Text(model).tag(model)
                        }
                    }
                    .disabled(make.isEmpty)
                    .onChange(of: model) { _ in
                        year = ""
                    }
                    
                    Picker("Year", selection: $year) {
                        Text("Select Year").tag("")
                        ForEach(availableYears, id: \.self) { year in
                            Text(year).tag(year)
                        }
                    }
                    .disabled(model.isEmpty)
                }

                Section("Optional") {
                    TextField("VIN (Optional)", text: $vin)
                        .textFieldStyle(.roundedBorder)
                }

                if let message = errorMessage, !message.isEmpty {
                    Section {
                        HStack(spacing: 8) {
                            Image(systemName: "exclamationmark.triangle.fill")
                            Text(message)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        .foregroundStyle(.red)
                    }
                }
            }
            .formStyle(.grouped)

            footer
        }
        .padding(20)
        .frame(minWidth: 520, minHeight: 500)
        .onAppear {
            // Preselect vehicle type from global filter to keep UX cohesive
            vehicleType = (appState.vehicleTypeFilter == .bike) ? .bike : .car
        }
    }

    // MARK: - Subviews
    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Add Vehicle").font(.title2).bold()
            Text("Add a bike or car to your garage.")
                .foregroundStyle(.secondary)
        }
    }

    private var footer: some View {
        HStack {
            Button("Cancel") { isPresented = false }
            Spacer()
            Button {
                if validate() {
                if validate() {
                    let vehicle = VehicleModel(
                        id: Int.random(in: Int.min..<0), // Temporary ID for optimistic UI
                        name: name.trimmed(),
                        make: make,
                        model: model,
                        year: Int(year) ?? 0,
                        vehicleType: vehicleType,
                        vin: vin.trimmed().isEmpty ? nil : vin.trimmed(),
                        ecuId: "", // Default empty, user can update later
                        ecuSoftwareVersion: "",
                        modifications: [],
                        photoUrl: nil,
                        publicVisibility: true
                    )
                    viewModel.addVehicle(vehicle)
                    isPresented = false
                }
                    viewModel.addVehicle(vehicle)
                    isPresented = false
                }
            } label: {
                Label("Save Vehicle", systemImage: "checkmark.circle.fill")
            }
            .keyboardShortcut(.defaultAction)
            .buttonStyle(.borderedProminent)
            .disabled(!isFormPotentiallyValid)
        }
    }

    // MARK: - Validation
    private var isFormPotentiallyValid: Bool {
        !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !make.isEmpty &&
        !model.isEmpty &&
        !year.isEmpty
    }

    @discardableResult
    private func validate() -> Bool {
        let trimmedName = name.trimmed()

        guard !trimmedName.isEmpty else { return fail("Please enter a nickname for this vehicle.") }
        guard !make.isEmpty else { return fail("Please select a make.") }
        guard !model.isEmpty else { return fail("Please select a model.") }
        guard !year.isEmpty else { return fail("Please select a year.") }

        errorMessage = nil
        return true
    }

    @discardableResult
    private func fail(_ message: String) -> Bool {
        errorMessage = message
        return false
    }
}

// MARK: - Small helpers
private extension String {
    func trimmed() -> String { trimmingCharacters(in: .whitespacesAndNewlines) }
}
