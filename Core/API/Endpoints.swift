// Endpoints.swift
// Production-ready API endpoint definitions for RevSync.
//
// Supports Django and Supabase integration, vehicle/tune CRUD, authentication, and marketplace filtering.
//

import Foundation

/// HTTP methods used in API requests.
enum HTTPMethod: String {
    case GET, POST, PUT, PATCH, DELETE
}

/// Supported backend endpoints for RevSync.
enum Endpoint {
    // MARK: - Supabase Auth Endpoints

    /// User login (Supabase)
    case supabaseLogin
    /// User registration (Supabase)
    case supabaseRegister
    /// Refresh access token (Supabase)
    case supabaseRefreshToken
    /// Logout user (Supabase)
    case supabaseLogout

    // MARK: - Django Marketplace Endpoints

    /// List marketplace tunes with optional filtering and pagination
    case marketplaceList(
        vehicleType: String?, // "car" or "bike"
        make: String?,
        model: String?,
        year: Int?,
        category: String?, // e.g. "performance", "eco"
        priceMin: Double?,
        priceMax: Double?,
        rating: Double?,
        sort: String?, // e.g. "price", "-rating"
        page: Int?
    )
    /// Get details for a specific tune
    case tuneDetail(id: String)
    /// Create a new tune
    case createTune
    /// Update an existing tune
    case updateTune(id: String)
    /// Delete a tune
    case deleteTune(id: String)

    // MARK: - Django Garage (Vehicles) Endpoints

    /// List all vehicles in the user's garage, with optional filtering
    case vehicles(vehicleType: String?)
    /// Get details for a specific vehicle
    case vehicleDetail(id: String)
    /// Add a new vehicle to the garage
    case addVehicle
    /// Update an existing vehicle
    case updateVehicle(id: String)
    /// Delete a vehicle from the garage
    case deleteVehicle(id: String)

    // MARK: - User Profile and Account

    /// Get the current user's profile
    case userProfile
    /// Update the current user's profile
    case updateUserProfile
    /// Delete the current user's account
    case deleteUserAccount

    // MARK: - Computed Properties

    /// The relative URL path for the endpoint, including query parameters if present.
    var path: String {
        switch self {
        // Supabase Auth
        case .supabaseLogin:
            return "/auth/v1/token?grant_type=password"
        case .supabaseRegister:
            return "/auth/v1/signup"
        case .supabaseRefreshToken:
            return "/auth/v1/token?grant_type=refresh_token"
        case .supabaseLogout:
            return "/auth/v1/logout"

        // Marketplace
        case let .marketplaceList(vehicleType, make, model, year, category, priceMin, priceMax, rating, sort, page):
            var params: [String] = []
            if let vehicleType = vehicleType { params.append("vehicleType=\(vehicleType)") }
            if let make = make { params.append("make=\(make)") }
            if let model = model { params.append("model=\(model)") }
            if let year = year { params.append("year=\(year)") }
            if let category = category { params.append("category=\(category)") }
            if let priceMin = priceMin { params.append("priceMin=\(priceMin)") }
            if let priceMax = priceMax { params.append("priceMax=\(priceMax)") }
            if let rating = rating { params.append("rating=\(rating)") }
            if let sort = sort { params.append("sort=\(sort)") }
            if let page = page { params.append("page=\(page)") }
            let query = params.isEmpty ? "" : "?" + params.joined(separator: "&")
            return "/api/v1/marketplace/tunes" + query
        case .tuneDetail(let id):
            return "/api/v1/marketplace/tunes/\(id)"
        case .createTune:
            return "/api/v1/marketplace/tunes"
        case .updateTune(let id):
            return "/api/v1/marketplace/tunes/\(id)"
        case .deleteTune(let id):
            return "/api/v1/marketplace/tunes/\(id)"

        // Garage (Vehicles)
        case .vehicles(let vehicleType):
            var base = "/api/v1/garage/vehicles"
            if let type = vehicleType {
                return base + "?vehicleType=\(type)"
            }
            return base
        case .vehicleDetail(let id):
            return "/api/v1/garage/vehicles/\(id)"
        case .addVehicle:
            return "/api/v1/garage/vehicles"
        case .updateVehicle(let id):
            return "/api/v1/garage/vehicles/\(id)"
        case .deleteVehicle(let id):
            return "/api/v1/garage/vehicles/\(id)"

        // User Profile
        case .userProfile:
            return "/api/v1/users/me"
        case .updateUserProfile:
            return "/api/v1/users/me"
        case .deleteUserAccount:
            return "/api/v1/users/me"
        }
    }

    /// The HTTP method for the endpoint.
    var method: HTTPMethod {
        switch self {
        // Supabase Auth
        case .supabaseLogin, .supabaseRegister, .supabaseRefreshToken, .supabaseLogout:
            return .POST

        // Marketplace
        case .marketplaceList, .tuneDetail:
            return .GET
        case .createTune:
            return .POST
        case .updateTune:
            return .PUT
        case .deleteTune:
            return .DELETE

        // Garage (Vehicles)
        case .vehicles, .vehicleDetail:
            return .GET
        case .addVehicle:
            return .POST
        case .updateVehicle:
            return .PUT
        case .deleteVehicle:
            return .DELETE

        // User Profile
        case .userProfile:
            return .GET
        case .updateUserProfile:
            return .PATCH
        case .deleteUserAccount:
            return .DELETE
        }
    }

    /// Whether this endpoint requires authentication.
    var requiresAuth: Bool {
        switch self {
        // Supabase Auth
        case .supabaseLogin, .supabaseRegister:
            return false
        case .supabaseRefreshToken, .supabaseLogout:
            return true

        // Marketplace and Garage and User
        default:
            return true
        }
    }
}
