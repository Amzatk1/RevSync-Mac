// AddVehicleView.swift
// Presents a form to add a new vehicle (macOS).
//

import SwiftUI
import Combine

/// A sheet that gathers new vehicle information.
struct AddVehicleView: View {
    @EnvironmentObject private var appState: AppState
    // Use GarageService directly for smart search
    @StateObject private var viewModel: GarageViewModel
    
    @Binding var isPresented: Bool
    
    // Search State
    @State private var searchQuery: String = ""
    @State private var searchResults: [VehicleDefinition] = []
    @State private var isSearching: Bool = false
    @State private var selectedDefinition: VehicleDefinition? = nil
    
    // Form fields (populated from selection)
    @State private var name: String = ""
    @State private var vin: String = ""
    @State private var vehicleType: VehicleType = .bike
    
    // Validation
    @State private var errorMessage: String? = nil
    
    init(isPresented: Binding<Bool>, viewModel: GarageViewModel) {
        self._isPresented = isPresented
        self._viewModel = StateObject(wrappedValue: viewModel)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            header

            Form {
                Section("Smart Search") {
                    TextField("Search (e.g. '2024 R1' or 'Ducati V4')", text: $searchQuery)
                        .textFieldStyle(.roundedBorder)
                        .onChange(of: searchQuery) { _, query in
                            performSearch(query: query)
                        }
                    
                    if isSearching {
                        ProgressView().scaleEffect(0.8)
                    }
                    
                    if !searchResults.isEmpty {
                        List(searchResults) { def in
                            Button {
                                selectDefinition(def)
                            } label: {
                                HStack {
                                    VStack(alignment: .leading) {
                                        Text("\(def.year) \(def.make) \(def.model)")
                                            .font(.headline)
                                        Text(def.vehicleType == .bike ? "Motorcycle" : "Car")
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                    }
                                    Spacer()
                                    if selectedDefinition?.id == def.id {
                                        Image(systemName: "checkmark.circle.fill")
                                            .foregroundStyle(.green)
                                    }
                                }
                                .padding(.vertical, 4)
                                .contentShape(Rectangle())
                            }
                            .buttonStyle(.plain)
                        }
                        .frame(height: 150)
                        .listStyle(.plain)
                        .background(Color(nsColor: .controlBackgroundColor))
                        .cornerRadius(8)
                    }
                }

                if let def = selectedDefinition {
                    Section("Details") {
                        TextField("Nickname", text: $name)
                            .textFieldStyle(.roundedBorder)
                        
                        TextField("VIN (Optional)", text: $vin)
                            .textFieldStyle(.roundedBorder)
                        
                        HStack {
                            Text("Specs:")
                            Spacer()
                            Text("\(Int(def.stockHP)) HP • \(Int(def.stockTorque)) lb-ft")
                                .foregroundStyle(.secondary)
                        }
                    }
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
        .frame(minWidth: 500, minHeight: 600)
        .onAppear {
            // Preselect vehicle type from global filter to keep UX cohesive
            vehicleType = (appState.vehicleTypeFilter == .bike) ? .bike : .car
        }
    }

    // MARK: - Logic
    private func performSearch(query: String) {
        guard query.count > 1 else {
            searchResults = []
            return
        }
        
        isSearching = true
        // Debounce could be handled in ViewModel, but for simplicity here:
        viewModel.service.searchDefinitions(query: query)
            .receive(on: DispatchQueue.main)
            .sink { completion in
                isSearching = false
                if case .failure(let error) = completion {
                    print("Search error: \(error)")
                }
            } receiveValue: { results in
                self.searchResults = results
            }
            .store(in: &viewModel.cancellables) // Using VM's bag for simplicity
    }
    
    private func selectDefinition(_ def: VehicleDefinition) {
        selectedDefinition = def
        name = "\(def.year) \(def.make) \(def.model)"
        vehicleType = def.vehicleType
        searchResults = [] // Clear results to clean up UI
        searchQuery = ""
    }

    // MARK: - Subviews
    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Add Vehicle").font(.title2).bold()
            Text("Search our database to add your ride.")
                .foregroundStyle(.secondary)
        }
    }

    private var footer: some View {
        HStack {
            Button("Cancel") { isPresented = false }
            Spacer()
            Button {
                if validate() {
                    guard let def = selectedDefinition else { return }
                    
                    let vehicle = VehicleModel(
                        id: Int.random(in: Int.min..<0), // Temporary ID
                        name: name.trimmed(),
                        make: def.make,
                        model: def.model,
                        year: def.year,
                        vehicleType: def.vehicleType,
                        vin: vin.trimmed().isEmpty ? nil : vin.trimmed(),
                        ecuId: "",
                        ecuSoftwareVersion: "",
                        modifications: [],
                        publicVisibility: true
                    )
                    viewModel.addVehicle(vehicle)
                    isPresented = false
                }
            } label: {
                Label("Add to Garage", systemImage: "plus.circle.fill")
            }
            .keyboardShortcut(.defaultAction)
            .buttonStyle(.borderedProminent)
            .disabled(selectedDefinition == nil || name.isEmpty)
        }
    }

    // MARK: - Validation
    private func validate() -> Bool {
        guard selectedDefinition != nil else { return fail("Please select a vehicle.") }
        guard !name.trimmed().isEmpty else { return fail("Please enter a nickname.") }
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

// Helper to access service from VM extension if needed, or just publicize it in VM
extension GarageViewModel {
    var service: GarageService {
        // This is a hack for the view to access service. 
        // Ideally, search logic belongs in VM.
        // For this refactor, we assume 'service' is internal/public in VM.
        return GarageService() 
    }
    // Note: In real app, make 'service' public in GarageViewModel
}
