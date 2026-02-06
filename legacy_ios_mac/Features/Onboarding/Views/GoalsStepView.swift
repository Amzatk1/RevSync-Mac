//
//  GoalsStepView.swift
//  RevSync
//
//  Created by RevSync on 20/10/2025.
//

import SwiftUI

struct GoalsStepView: View {
    @ObservedObject var viewModel: OnboardingViewModel
    
    let goalsList = [
        "More Power",
        "Better Throttle Response",
        "Fuel Economy",
        "Smoother Ride",
        "Fix Issues",
        "Track Performance"
    ]
    
    var body: some View {
        ScrollView {
            VStack(spacing: 32) {
                HeaderView(title: "Your Goals", subtitle: "What do you want to achieve with your tune?")
                
                VStack(alignment: .leading, spacing: 20) {
                    Text("Select all that apply")
                        .font(.headline)
                        .foregroundStyle(.secondary)
                    
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 160))], spacing: 16) {
                        ForEach(goalsList, id: \.self) { goal in
                            ToggleButton(title: goal, isSelected: viewModel.selectedGoals.contains(goal)) {
                                viewModel.toggleGoal(goal)
                            }
                        }
                    }
                }
                .padding()
                .background(Color.gray.opacity(0.1))
                .cornerRadius(16)
            }
            .padding()
        }
    }
}
