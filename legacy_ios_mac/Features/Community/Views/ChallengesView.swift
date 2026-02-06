//
//  ChallengesView.swift
//  RevSync
//
//  Created by RevSync on 20/10/2025.
//

import SwiftUI

struct ChallengesView: View {
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Active Challenge
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Active Challenge")
                                .font(.headline)
                                .foregroundStyle(.red)
                            Spacer()
                            Text("Ends in 2d 4h")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        
                        ZStack(alignment: .bottomLeading) {
                            Image(systemName: "flag.checkered")
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                                .frame(height: 200)
                                .clipped()
                                .overlay(Color.black.opacity(0.6))
                                .cornerRadius(16)
                            
                            VStack(alignment: .leading) {
                                Text("Quarter Mile King")
                                    .font(.title.bold())
                                    .foregroundStyle(.white)
                                Text("Post your best 1/4 mile slip. Top 3 win a free Stage 2 tune!")
                                    .foregroundStyle(.white.opacity(0.9))
                                
                                Button("Join Challenge") {
                                    // Action
                                }
                                .buttonStyle(.borderedProminent)
                                .tint(.red)
                                .padding(.top, 8)
                            }
                            .padding()
                        }
                    }
                    .padding(.horizontal)
                    
                    // Leaderboard
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Leaderboard")
                            .font(.title2.bold())
                            .padding(.horizontal)
                        
                        VStack(spacing: 0) {
                            LeaderboardRow(rank: 1, name: "SpeedDemon99", score: "9.8s", vehicle: "Yamaha R1")
                            Divider()
                            LeaderboardRow(rank: 2, name: "GixxerJoe", score: "9.9s", vehicle: "Suzuki GSX-R1000")
                            Divider()
                            LeaderboardRow(rank: 3, name: "NinjaWarrior", score: "10.1s", vehicle: "Kawasaki ZX-10R")
                            Divider()
                            LeaderboardRow(rank: 4, name: "You", score: "10.4s", vehicle: "Yamaha R1", isMe: true)
                        }
                        .background(Color(NSColor.controlBackgroundColor))
                        .cornerRadius(16)
                        .padding(.horizontal)
                    }
                }
                .padding(.vertical)
            }
            .navigationTitle("Challenges")
        }
    }
}

struct LeaderboardRow: View {
    let rank: Int
    let name: String
    let score: String
    let vehicle: String
    var isMe: Bool = false
    
    var body: some View {
        HStack {
            Text("\(rank)")
                .font(.title3.bold())
                .foregroundStyle(rank <= 3 ? .yellow : .secondary)
                .frame(width: 30)
            
            VStack(alignment: .leading) {
                Text(name)
                    .font(.headline)
                    .foregroundStyle(isMe ? .blue : .primary)
                Text(vehicle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            
            Spacer()
            
            Text(score)
                .font(.title3.monospaced())
                .bold()
        }
        .padding()
        .background(isMe ? Color.blue.opacity(0.1) : Color.clear)
    }
}
