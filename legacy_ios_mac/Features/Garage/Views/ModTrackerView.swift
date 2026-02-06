//
//  ModTrackerView.swift
//  RevSync
//
//  Created by RevSync on 20/10/2025.
//

import SwiftUI

struct ModTrackerView: View {
    let vehicle: VehicleModel
    let onUpdate: (VehicleModel) -> Void
    
    @State private var newModName: String = ""
    @State private var isAddingMod = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            HStack {
                Text("Installed Modifications")
                    .font(.title2.bold())
                Spacer()
                Button(action: { isAddingMod = true }) {
                    Label("Add Mod", systemImage: "plus")
                }
                .buttonStyle(.bordered)
            }
            
            if vehicle.modifications.isEmpty {
                Text("No mods installed yet. Add your exhaust, filter, etc.")
                    .foregroundStyle(.secondary)
                    .italic()
            } else {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 150))], spacing: 12) {
                    ForEach(vehicle.modifications, id: \.self) { mod in
                        ModChip(name: mod) {
                            // Remove mod action
                            var updated = vehicle
                            if let index = updated.modifications.firstIndex(of: mod) {
                                updated.modifications.remove(at: index)
                                onUpdate(updated)
                            }
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(16)
        .sheet(isPresented: $isAddingMod) {
            VStack(spacing: 20) {
                Text("Add Modification")
                    .font(.headline)
                
                TextField("E.g. Akrapovic Full System", text: $newModName)
                    .textFieldStyle(.roundedBorder)
                    .frame(width: 300)
                
                HStack {
                    Button("Cancel") { isAddingMod = false }
                    Button("Add") {
                        if !newModName.isEmpty {
                            var updated = vehicle
                            updated.modifications.append(newModName)
                            onUpdate(updated)
                            newModName = ""
                            isAddingMod = false
                        }
                    }
                    .buttonStyle(.borderedProminent)
                }
            }
            .padding()
            .presentationDetents([.height(200)])
        }
    }
}

struct ModChip: View {
    let name: String
    let onDelete: () -> Void
    
    var body: some View {
        HStack {
            Image(systemName: "wrench.and.screwdriver.fill")
                .font(.caption)
                .foregroundStyle(.blue)
            Text(name)
                .font(.subheadline)
                .lineLimit(1)
            Spacer()
            Button(action: onDelete) {
                Image(systemName: "xmark")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Color(NSColor.controlBackgroundColor))
        .cornerRadius(8)
        .shadow(radius: 1)
    }
}
