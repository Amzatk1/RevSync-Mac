//
//  ProfileService.swift
//  
//
//  Created by Ayooluwa  Karim on 20/10/2025.
//


//  ProfileService.swift
//  RevSync
//
//  Fetches and updates user profile data (Phase‑1). Uses existing APIClient/APIRequest.

import Foundation
import Combine

final class ProfileService {
    private let api = APIClient.shared

    // MARK: - Requests
    // MARK: - Requests
    private struct GetProfileRequest: APIRequest {
        typealias Response = UserModel
        let username: String
        var path: String { "/users/\(username)/" }
        var method: HTTPMethod { .GET }
    }

    private struct UpdateProfileRequest: APIRequest {
        typealias Response = UserModel.UserProfile
        let payload: UserModel.UserProfile
        var path: String { "/users/profile/" }
        var method: HTTPMethod { .PATCH }
        var body: Data? { jsonBody(payload) }
    }

    // MARK: - Public API
    /// Fetches a public user profile by username.
    func getProfile(username: String) -> AnyPublisher<UserModel, Error> {
        api.send(GetProfileRequest(username: username)).eraseToAnyPublisher()
    }

    /// Updates the current user's profile.
    func updateProfile(_ profile: UserModel.UserProfile) -> AnyPublisher<UserModel.UserProfile, Error> {
        api.send(UpdateProfileRequest(payload: profile)).eraseToAnyPublisher()
    }
    
    // MARK: - Social Features
    
    private struct FollowRequest: APIRequest {
        typealias Response = FollowResponse
        let username: String
        let action: String // "follow" or "unfollow"
        
        var path: String { "/users/\(username)/follow/" }
        var method: HTTPMethod { .POST }
        var body: Data? { jsonBody(["action": action]) }
    }
    
    struct FollowResponse: Decodable {
        let status: String
    }
    
    func follow(username: String) -> AnyPublisher<Void, Error> {
        api.send(FollowRequest(username: username, action: "follow"))
            .map { _ in () }
            .eraseToAnyPublisher()
    }
    
    func unfollow(username: String) -> AnyPublisher<Void, Error> {
        api.send(FollowRequest(username: username, action: "unfollow"))
            .map { _ in () }
            .eraseToAnyPublisher()
    }
}

