//
//  AcademyView.swift
//  RevSync
//
//  Created by RevSync on 20/10/2025.
//

import SwiftUI

struct AcademyView: View {
    let courses = [
        Course(title: "Tuning 101", description: "Understand the basics of AFR, Ignition Timing, and VE Tables.", image: "book.fill", color: .blue),
        Course(title: "ECU Flashing Safety", description: "Best practices to prevent bricking your ECU during a flash.", image: "shield.fill", color: .green),
        Course(title: "Dyno Reading", description: "How to interpret horsepower and torque curves like a pro.", image: "chart.xyaxis.line", color: .orange),
        Course(title: "Advanced Diagnostics", description: "Using OBD-II data to diagnose running issues.", image: "waveform.path.ecg", color: .purple)
    ]
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Featured Hero
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Featured Course")
                            .font(.subheadline.bold())
                            .foregroundStyle(.secondary)
                        
                        ZStack(alignment: .bottomLeading) {
                            RoundedRectangle(cornerRadius: 16)
                                .fill(LinearGradient(colors: [.blue, .purple], startPoint: .topLeading, endPoint: .bottomTrailing))
                                .frame(height: 200)
                            
                            VStack(alignment: .leading) {
                                Text("Mastering Fuel Maps")
                                    .font(.title.bold())
                                    .foregroundStyle(.white)
                                Text("Learn how to optimize Volumetric Efficiency for maximum power.")
                                    .foregroundStyle(.white.opacity(0.9))
                                
                                Button("Start Learning") {
                                    // Action
                                }
                                .buttonStyle(.borderedProminent)
                                .tint(.white)
                                .foregroundStyle(.blue)
                                .padding(.top, 8)
                            }
                            .padding()
                        }
                    }
                    .padding(.horizontal)
                    
                    // Course List
                    VStack(alignment: .leading, spacing: 16) {
                        Text("All Courses")
                            .font(.title2.bold())
                            .padding(.horizontal)
                        
                        ForEach(courses) { course in
                            CourseRow(course: course)
                        }
                    }
                }
                .padding(.vertical)
            }
            .navigationTitle("Mini Academy")
        }
    }
}

struct CourseRow: View {
    let course: Course
    
    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(course.color.opacity(0.1))
                    .frame(width: 60, height: 60)
                
                Image(systemName: course.image)
                    .font(.title2)
                    .foregroundStyle(course.color)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(course.title)
                    .font(.headline)
                Text(course.description)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .foregroundStyle(.secondary)
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(Color(NSColor.controlBackgroundColor)) // Use system background
        .cornerRadius(12)
        .padding(.horizontal)
    }
}

struct Course: Identifiable {
    let id = UUID()
    let title: String
    let description: String
    let image: String
    let color: Color
}
