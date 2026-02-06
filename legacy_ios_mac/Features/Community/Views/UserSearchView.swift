//
//  UserSearchView.swift
//  RevSync
//
//  Created by RevSync on 24/11/2025.
//

import SwiftUI
import Combine

struct UserSearchView: View {
    @StateObject private var viewModel = UserSearchViewModel()
    
    var body: some View {
        NavigationView {
            VStack {
                TextField("Search users...", text: $viewModel.query)
                    .textFieldStyle(.roundedBorder)
                    .padding()
                
                List(viewModel.results) { user in
                    NavigationLink(destination: ProfileView(username: user.username)) {
                        HStack {
                            Circle()
                                .fill(Color.gray.opacity(0.3))
                                .frame(width: 40, height: 40)
                                .overlay(Text(user.username.prefix(1).uppercased()))
                            
                            VStack(alignment: .leading) {
                                Text(user.username)
                                    .font(.headline)
                                Text(user.role.rawValue)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }
                .listStyle(.plain)
            }
            .navigationTitle("Find Riders")
        }
    }
}

class UserSearchViewModel: ObservableObject {
    @Published var query = ""
    @Published var results: [UserModel] = []
    
    private var cancellables = Set<AnyCancellable>()
    private let api = APIClient.shared
    
    init() {
        $query
            .debounce(for: .seconds(0.5), scheduler: DispatchQueue.main)
            .removeDuplicates()
            .sink { [weak self] query in
                self?.search(query: query)
            }
            .store(in: &cancellables)
    }
    
    private func search(query: String) {
        guard !query.isEmpty else {
            results = []
            return
        }
        
        // Mock search for MVP if endpoint doesn't exist, or call real one
        // Assuming we have a search endpoint or filter on users list
        // api.fetch("/users/?search=\(query)") ...
        
        // For now, let's just clear results to show we need the endpoint
        print("Searching for: \(query)")
    }
}
