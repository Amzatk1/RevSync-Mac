// APIClient.swift
// Handles HTTP networking.
//

import Foundation
import Combine

/// Django REST Framework style pagination envelope.
struct Paginated<T: Codable>: Codable {
    let count: Int?
    let next: URL?
    let previous: URL?
    let results: [T]
}

/// Represents a single multipart file part.
struct MultipartFile {
    let name: String         // form field name, e.g. "file"
    let filename: String     // e.g. "tune.bin"
    let mimeType: String     // e.g. "application/octet-stream"
    let data: Data
}

/// A typed error for API failures.
enum APIError: LocalizedError {
    case httpError(statusCode: Int, message: String?)
    case decodingError(Error)
    case networkError(Error)
    case unauthorized
    case unknownError

    var errorDescription: String? {
        switch self {
        case .httpError(let statusCode, let message):
            return "HTTP Error \(statusCode): \(message ?? "No message")"
        case .decodingError(let error):
            return "Decoding Error: \(error.localizedDescription)"
        case .networkError(let error):
            return "Network Error: \(error.localizedDescription)"
        case .unauthorized:
            return "Unauthorized"
        case .unknownError:
            return "Unknown error occurred"
        }
    }
}

/// A shared HTTP client for interacting with the backend API.
final class APIClient {
    static let shared = APIClient()

    private let session: URLSession
    private let jsonDecoder: JSONDecoder

    /// Closure to provide auth token when needed.
    var tokenProvider: (() -> String?)?

    init(session: URLSession = .shared) {
        self.session = session
        self.jsonDecoder = JSONDecoder()
        self.jsonDecoder.dateDecodingStrategy = .iso8601
        self.jsonDecoder.keyDecodingStrategy = .convertFromSnakeCase
    }

    /// Performs an API request and decodes the response.
    /// - Parameter request: A typed API request.
    /// - Returns: A publisher emitting the decoded response or an error.
    func send<T: APIRequest>(_ request: T) -> AnyPublisher<T.Response, Error> {
        do {
            let urlRequest = try buildURLRequest(for: request)
            return session.dataTaskPublisher(for: urlRequest)
                .tryMap { data, response in
                    guard let httpResponse = response as? HTTPURLResponse else {
                        throw APIError.unknownError
                    }
                    if !(200...299).contains(httpResponse.statusCode) {
                        throw self.mapHTTPError(data, statusCode: httpResponse.statusCode)
                    }
                    if httpResponse.statusCode == 204 {
                        // No content, decode empty JSON object
                        return Data("{}".utf8)
                    }
                    return data
                }
                .decode(type: T.Response.self, decoder: jsonDecoder)
                .mapError { error in
                    if let apiError = error as? APIError {
                        return apiError
                    } else if let decodingError = error as? DecodingError {
                        return APIError.decodingError(decodingError)
                    }
                    return error
                }
                .retry(2)
                .eraseToAnyPublisher()
        } catch {
            return Fail(error: error).eraseToAnyPublisher()
        }
    }

    /// Performs an API request and returns raw Data response.
    /// - Parameter request: A typed API request.
    /// - Returns: A publisher emitting the raw data or an error.
    func sendRaw<T: APIRequest>(_ request: T) -> AnyPublisher<Data, Error> {
        do {
            let urlRequest = try buildURLRequest(for: request)
            return session.dataTaskPublisher(for: urlRequest)
                .tryMap { data, response in
                    guard let httpResponse = response as? HTTPURLResponse else {
                        throw APIError.unknownError
                    }
                    if !(200...299).contains(httpResponse.statusCode) {
                        throw self.mapHTTPError(data, statusCode: httpResponse.statusCode)
                    }
                    return data
                }
                .retry(2)
                .eraseToAnyPublisher()
        } catch {
            return Fail(error: error).eraseToAnyPublisher()
        }
    }

    /// Follows a pagination `next` URL returned by the server.
    func followPage<T: Decodable>(_ nextURL: URL, requiresAuth: Bool = true) -> AnyPublisher<Paginated<T>, Error> {
        var request = URLRequest(url: nextURL)
        request.httpMethod = HTTPMethod.GET.rawValue
        if requiresAuth, let token = tokenProvider?() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        return session.dataTaskPublisher(for: request)
            .tryMap { data, response in
                guard let httpResponse = response as? HTTPURLResponse else { throw APIError.unknownError }
                if !(200...299).contains(httpResponse.statusCode) { throw self.mapHTTPError(data, statusCode: httpResponse.statusCode) }
                return data
            }
            .decode(type: Paginated<T>.self, decoder: jsonDecoder)
            .mapError { error in
                if let apiError = error as? APIError { return apiError }
                if let decodingError = error as? DecodingError { return APIError.decodingError(decodingError) }
                return error
            }
            .retry(2)
            .eraseToAnyPublisher()
    }

    /// Uploads multipart/form-data to the given path using the provided fields and files.
    func uploadMultipart<T: Decodable>(
        path: String,
        method: HTTPMethod = .POST,
        queryItems: [URLQueryItem]? = nil,
        fields: [String: String] = [:],
        files: [MultipartFile],
        requiresAuth: Bool = true
    ) -> AnyPublisher<T, Error> {
        let boundary = "Boundary-\(UUID().uuidString)"

        // Choose base URL by path prefix (auth vs api) like other requests
        let baseURL: URL = path.hasPrefix("/auth/v1") ? (URL(string: Config.supabaseURL) ?? Config.apiBaseURL) : Config.apiBaseURL

        var components = URLComponents(url: baseURL.appendingPathComponent(path), resolvingAgainstBaseURL: false)!
        components.queryItems = queryItems
        var request = URLRequest(url: components.url!)
        request.httpMethod = method.rawValue
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        if requiresAuth, let token = tokenProvider?() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        request.httpBody = buildMultipartBody(boundary: boundary, fields: fields, files: files)

        return session.dataTaskPublisher(for: request)
            .tryMap { data, response in
                guard let httpResponse = response as? HTTPURLResponse else { throw APIError.unknownError }
                if !(200...299).contains(httpResponse.statusCode) { throw self.mapHTTPError(data, statusCode: httpResponse.statusCode) }
                return data
            }
            .decode(type: T.self, decoder: jsonDecoder)
            .mapError { error in
                if let apiError = error as? APIError { return apiError }
                if let decodingError = error as? DecodingError { return APIError.decodingError(decodingError) }
                return error
            }
            .retry(2)
            .eraseToAnyPublisher()
    }

    private func buildMultipartBody(boundary: String, fields: [String: String], files: [MultipartFile]) -> Data {
        var body = Data()
        let boundaryPrefix = "--\(boundary)\r\n"

        // text fields
        for (key, value) in fields {
            body.append(boundaryPrefix.data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"\(key)\"\r\n\r\n".data(using: .utf8)!)
            body.append("\(value)\r\n".data(using: .utf8)!)
        }

        // file parts
        for file in files {
            body.append(boundaryPrefix.data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"\(file.name)\"; filename=\"\(file.filename)\"\r\n".data(using: .utf8)!)
            body.append("Content-Type: \(file.mimeType)\r\n\r\n".data(using: .utf8)!)
            body.append(file.data)
            body.append("\r\n".data(using: .utf8)!)
        }

        // closing boundary
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        return body
    }

    /// Maps HTTP error data to an APIError, trying multiple common error keys.
    private func mapHTTPError(_ data: Data, statusCode: Int) -> APIError {
        if let dict = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] {
            let msg = (dict["message"] as? String)
                ?? (dict["detail"] as? String)
                ?? (dict["error"] as? String)
            return .httpError(statusCode: statusCode, message: msg)
        }
        return .httpError(statusCode: statusCode, message: nil)
    }

    private func buildURLRequest<T: APIRequest>(for request: T) throws -> URLRequest {
        let baseURL = Config.apiBaseURL

        let token = request.requiresAuth ? tokenProvider?() : nil
        let urlRequest = try request.buildURLRequest(baseURL: baseURL, authToken: token)
        return urlRequest
    }
}
