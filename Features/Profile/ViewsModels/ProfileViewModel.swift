//  ProfileViewModel.swift
//  RevSync
//
//  Drives the ProfileView with Combine + dependency-injected ProfileService.
//  Phase‑1: fetch profile, follow/unfollow, update privacy. Vehicles and counts are
//  provided by the backend response when available.
//

import Foundation
import Combine

final class ProfileViewModel: ObservableObject {
    // MARK: - Published state
    @Published private(set) var user: UserModel? = nil
    @Published private(set) var vehicles: [VehicleModel] = []
    @Published private(set) var followersCount: Int? = nil
    @Published private(set) var followingCount: Int? = nil
    @Published var showVehiclesPublic: Bool = true

    @Published private(set) var isLoading: Bool = false
    @Published private(set) var isFollowBusy: Bool = false
    @Published private(set) var errorMessage: String? = nil

    // MARK: - Dependencies
    private let service: ProfileService
    private let garageService = GarageService()
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Context
    /// The profile being viewed; identified by username.
    private let username: String

    init(username: String, service: ProfileService = ProfileService()) {
        self.username = username
        self.service = service
    }

    // MARK: - Social State
    @Published var isFollowing: Bool = false
    
    var isCurrentUser: Bool {
        guard let currentUser = AuthManager.shared.currentUser else { return false }
        return currentUser.username == username
    }
    
    // MARK: - Load
    func load() {
        isLoading = true
        errorMessage = nil

        service.getProfile(username: username)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] completion in
                guard let self = self else { return }
                self.isLoading = false
                if case let .failure(error) = completion {
                    self.errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
                }
            } receiveValue: { [weak self] user in
                guard let self = self else { return }
                self.user = user
                self.followersCount = 0
                self.followingCount = 0
                self.isFollowing = false
                
                // If current user, fetch their garage
                if self.isCurrentUser {
                    self.fetchGarage()
                } else {
                    // TODO: Fetch public garage for other users
                    self.vehicles = []
                }
            }
            .store(in: &cancellables)
    }
    
    private func fetchGarage() {
        garageService.list(page: 1)
            .receive(on: DispatchQueue.main)
            .sink { _ in } receiveValue: { [weak self] page in
                self?.vehicles = page.results
            }
            .store(in: &cancellables)
    }

    // MARK: - Social Actions
    func toggleFollow() {
        guard !isFollowBusy else { return }
        isFollowBusy = true
        
        let action = isFollowing ? service.unfollow(username: username) : service.follow(username: username)
        
        action
            .receive(on: DispatchQueue.main)
            .sink { [weak self] completion in
                self?.isFollowBusy = false
                if case let .failure(error) = completion {
                    self?.errorMessage = error.localizedDescription
                }
            } receiveValue: { [weak self] _ in
                guard let self = self else { return }
                self.isFollowing.toggle()
                // Optimistic update of counts
                if let count = self.followersCount {
                    self.followersCount = self.isFollowing ? count + 1 : count - 1
                }
            }
            .store(in: &cancellables)
    }

    // MARK: - Privacy
    func updatePrivacy(showVehiclesPublic: Bool) {
        guard var currentProfile = user?.profile else { return }
        currentProfile.isGaragePublic = showVehiclesPublic
        
        service.updateProfile(currentProfile)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] completion in
                if case let .failure(error) = completion {
                    self?.errorMessage = error.localizedDescription
                    // Revert on failure
                    self?.showVehiclesPublic = !showVehiclesPublic
                }
            } receiveValue: { [weak self] updatedProfile in
                self?.user?.profile = updatedProfile
                self?.showVehiclesPublic = updatedProfile.isGaragePublic ?? true
            }
            .store(in: &cancellables)
    }
}



