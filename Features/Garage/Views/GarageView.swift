// GarageView.swift
// Lists vehicles, supports add/edit/delete, and basic filtering.
//

import SwiftUI

/// Shows the user's vehicles and provides add vehicle functionality.
struct GarageView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var services: AppServices
    
    // We use StateObject to own the VM.
    // To inject dependencies from EnvironmentObject (services), we can't do it in init easily.
    // We will use a pattern where we configure the VM in onAppear.
    @StateObject private var viewModel = GarageViewModel()

    // Client-side search & filters (safe until Core Data fetch is wired)
    @State private var searchText: String = ""
    @State private var filterMake: String = ""
    @State private var filterModel: String = ""
    @State private var filterYear: String = ""

    // Edit sheet toggle (reuses AddVehicleView for now)
    @State private var isEditing: Bool = false
    @State private var vehicleBeingEdited: VehicleModel?
    @State private var selectedVehicleId: Int?
    @State private var isShowingLiveMonitor: Bool = false

    var body: some View {
        ZStack {
            // Background Gradient
            LinearGradient(
                colors: [.revSyncBlack, .revSyncDarkGray],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Offline Indicator
                if viewModel.errorMessage != nil && !viewModel.vehicles.isEmpty {
                    HStack {
                        Image(systemName: "wifi.slash")
                        Text("Offline Mode - Showing cached data")
                            .font(.caption)
                            .fontWeight(.medium)
                        Spacer()
                    }
                    .padding(.vertical, 8)
                    .padding(.horizontal)
                    .background(Color.revSyncWarning.opacity(0.8))
                    .foregroundColor(.white)
                }

                // Premium Filter Bar (Minimal)
                if !viewModel.vehicles.isEmpty {
                    filterBar
                        .padding(.horizontal)
                        .padding(.vertical, 12)
                        .zIndex(1)
                }

                // Vehicle Carousel
                if filteredVehicles.isEmpty {
                    emptyState
                } else {
                    TabView(selection: $selectedVehicleId) {
                        ForEach(filteredVehicles) { vehicle in
                            NavigationLink(destination: VehicleDetailView(vehicle: vehicle, viewModel: viewModel)) {
                                VehicleCard3D(vehicle: vehicle, isSelected: selectedVehicleId == vehicle.id)
                            }
                            .buttonStyle(.plain)
                            .tag(vehicle.id)
                        }
                    }
                    #if os(iOS)
                    .tabViewStyle(.page(indexDisplayMode: .always))
                    .indexViewStyle(.page(backgroundDisplayMode: .always))
                    #endif
                    .frame(height: 550)
                }
                
                Spacer()
                
                // Add vehicle button
                HStack {
                    Spacer()
                    
                    // Scan Button
                    Button {
                        HapticService.shared.play(.light)
                        viewModel.isShowingScanner = true
                    } label: {
                        Image(systemName: "camera.viewfinder")
                            .font(.title2)
                            .foregroundStyle(.white)
                            .padding()
                            .glass(cornerRadius: 30) // Circle-ish
                            .overlay(Circle().stroke(.white.opacity(0.2), lineWidth: 1))
                    }
                    .buttonStyle(.plain)
                    .padding(.trailing, 8)
                    
                    // Live Monitor Button
                    Button {
                        isShowingLiveMonitor = true
                    } label: {
                        Image(systemName: "gauge.with.dots.needle.bottom.50percent")
                            .font(.title2)
                            .foregroundStyle(.white)
                            .padding()
                            .glass(cornerRadius: 30)
                            .overlay(Circle().stroke(.white.opacity(0.2), lineWidth: 1))
                    }
                    .buttonStyle(.plain)
                    .padding(.trailing, 8)
                    
                    // Add Button
                    Button {
                        HapticService.shared.play(.medium)
                        viewModel.isShowingAddVehicle = true
                    } label: {
                        HStack {
                            Image(systemName: "plus")
                            Text("Add Vehicle")
                        }
                        .font(.headline)
                        .foregroundColor(.revSyncBlack)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 12)
                        .background(Color.revSyncNeonBlue)
                        .clipShape(Capsule())
                        .neonGlow(color: .revSyncNeonBlue, radius: 10)
                    }
                    .keyboardShortcut("n", modifiers: [.command])
                }
                .padding()
            }
        }
        .navigationTitle("Garage")
        .onAppear {
            viewModel.configure(toast: services.toast)
            viewModel.loadVehicles()
        }
        .onChange(of: appState.vehicleTypeFilter) { _, _ in
            viewModel.loadVehicles()
        }
        .onChange(of: selectedVehicleId) { _, _ in
            HapticService.shared.selection()
        }
        .sheet(isPresented: $viewModel.isShowingAddVehicle) {
            AddVehicleView(isPresented: $viewModel.isShowingAddVehicle, viewModel: viewModel)
        }
        .sheet(isPresented: $isEditing) {
            AddVehicleView(isPresented: $isEditing, viewModel: viewModel)
        }
        .sheet(isPresented: $viewModel.isShowingScanner) {
            SnapScanView()
        }
        .sheet(isPresented: $isShowingLiveMonitor) {
            LiveMonitorView()
        }
        .searchable(text: $searchText, placement: .toolbar)
    }

    // MARK: - Filtered list
    private var filteredVehicles: [VehicleModel] {
        viewModel.vehicles.filter { v in
            let matchSearch = searchText.isEmpty ||
                v.name.localizedCaseInsensitiveContains(searchText) ||
                v.make.localizedCaseInsensitiveContains(searchText) ||
                v.model.localizedCaseInsensitiveContains(searchText) ||
                String(v.year).contains(searchText)
            let matchMake = filterMake.isEmpty || v.make.localizedCaseInsensitiveContains(filterMake)
            let matchModel = filterModel.isEmpty || v.model.localizedCaseInsensitiveContains(filterModel)
            let matchYear = filterYear.isEmpty || String(v.year) == filterYear
            return matchSearch && matchMake && matchModel && matchYear
        }
    }

    // MARK: - Components
    private var filterBar: some View {
        HStack(spacing: 12) {
            Image(systemName: "line.3.horizontal.decrease.circle")
                .foregroundColor(.secondary)
            
            TextField("Make", text: $filterMake)
                .textFieldStyle(PlainTextFieldStyle())
                .padding(8)
                .glass(cornerRadius: 8)
                .frame(maxWidth: 120)
            
            TextField("Model", text: $filterModel)
                .textFieldStyle(PlainTextFieldStyle())
                .padding(8)
                .glass(cornerRadius: 8)
                .frame(maxWidth: 120)
            
            TextField("Year", text: $filterYear)
                .textFieldStyle(PlainTextFieldStyle())
                .padding(8)
                .glass(cornerRadius: 8)
                .frame(maxWidth: 80)
                .onChange(of: filterYear) { _, newVal in
                    filterYear = newVal.filter { $0.isNumber }
                }
            
            Spacer()
        }
    }
    
    private var emptyState: some View {
        VStack(spacing: 20) {
            Spacer()
            Image(systemName: "motorcycle")
                .font(.system(size: 60))
                .foregroundColor(.gray.opacity(0.3))
            Text("Your garage is empty")
                .font(.title2)
                .fontWeight(.semibold)
                .foregroundColor(.secondary)
            Text("Add your first vehicle to start tuning.")
                .foregroundColor(.secondary)
            Spacer()
        }
        .frame(maxWidth: .infinity, minHeight: 300)
    }
}

struct VehicleCard: View {
    let vehicle: VehicleModel
    let editAction: () -> Void
    let deleteAction: () -> Void
    
    var body: some View {
        HStack(spacing: 16) {
            // Icon / Image Placeholder
            ZStack {
                Circle()
                    .fill(LinearGradient(colors: [.blue.opacity(0.1), .purple.opacity(0.1)], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 60, height: 60)
                
                Image(systemName: vehicle.vehicleType == .bike ? "bicycle" : "car.fill") // Use better icons if available
                    .font(.system(size: 24))
                    .foregroundColor(.blue)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(vehicle.name)
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)
                    
                    Spacer()
                    
                    Menu {
                        Button("Edit", action: editAction)
                        Divider()
                        Button("Delete", role: .destructive, action: deleteAction)
                    } label: {
                        Image(systemName: "ellipsis")
                            .padding(8)
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                }
                
                Text("\(vehicle.year) \(vehicle.make) \(vehicle.model)")
                    .font(.body)
                    .foregroundColor(.secondary)
                
                // Mileage removed from model
                
                HStack(spacing: 8) {
                    Badge(text: vehicle.vehicleType.description, color: .blue)
                    // ecuType removed, using ecuId instead
                    if !vehicle.ecuId.isEmpty {
                         Badge(text: "ECU: \(vehicle.ecuId)", color: .orange)
                    }
                    if let vin = vehicle.vin, !vin.isEmpty {
                        Badge(text: "VIN: \(vin)", color: .gray)
                    }
                }
                .padding(.top, 4)
                
                if !vehicle.modifications.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack {
                            ForEach(vehicle.modifications, id: \.self) { mod in
                                Text(mod)
                                    .font(.caption2)
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 2)
                                    .background(Color.gray.opacity(0.2))
                                    .cornerRadius(4)
                            }
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color(NSColor.controlBackgroundColor))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 4)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.white.opacity(0.1), lineWidth: 1)
        )
    }
}



// MARK: - Future wiring notes
// • Once Core Data entities (CDVehicle) are defined, replace `@StateObject` with a ViewModel that
//   exposes an NSFetchedResultsController-backed publisher or a Combine wrapper for live updates.
// • Replace client-side filters with NSFetchRequest predicates for make/model/year and
//   appState.vehicleTypeFilter to keep lists fast on large datasets.
// • Add inline error banners using `viewModel.errorMessage` if your ViewModel exposes it.

// Badge definition moved to TuneDetailComponents.swift or shared UI file
