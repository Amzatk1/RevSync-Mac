// APIRequest.swift
// Production-ready API request helpers.
//


import Foundation

/// A standardized backend error payload that can be decoded across services.
struct ResponseError: Decodable, LocalizedError {
    let message: String?
    let detail: String?
    let error: String?

    var errorDescription: String? {
        message ?? detail ?? error ?? "Unknown error"
    }
}

/// Builds URLQueryItem list from a heterogeneous dictionary. Arrays are expanded as repeated keys.
internal func buildQueryItems(_ params: [String: Any?]) -> [URLQueryItem] {
    var items: [URLQueryItem] = []
    for (key, value) in params {
        guard let value = value else { continue }
        switch value {
        case let s as String: items.append(URLQueryItem(name: key, value: s))
        case let b as Bool:   items.append(URLQueryItem(name: key, value: b ? "true" : "false"))
        case let i as Int:    items.append(URLQueryItem(name: key, value: String(i)))
        case let d as Double: items.append(URLQueryItem(name: key, value: String(d)))
        case let arr as [Any]:
            for element in arr {
                let subItems = buildQueryItems([key: element])
                items.append(contentsOf: subItems)
            }
        default:
            // Fallback to string description
            items.append(URLQueryItem(name: key, value: String(describing: value)))
        }
    }
    return items
}

/// A generic API request which yields a typed `Decodable` response.
protocol APIRequest {
    associatedtype Response: Decodable

    /// The relative path for this request.
    var path: String { get }

    /// The HTTP method to use.
    var method: HTTPMethod { get }

    /// Optional query items to include.
    var queryItems: [URLQueryItem]? { get }

    /// An optional HTTP body.
    var body: Data? { get }

    /// Additional HTTP headers.
    var headers: [String: String] { get }

    /// Whether this request requires authentication.
    var requiresAuth: Bool { get }

    /// The timeout interval for the request.
    var timeout: TimeInterval { get }
}

extension APIRequest {
    var queryItems: [URLQueryItem]? { nil }
    var body: Data? { nil }
    var headers: [String: String] { [
        "Accept": "application/json",
        "Content-Type": "application/json"
    ] }
    var requiresAuth: Bool { true }
    var timeout: TimeInterval { 30 }

    /// Constructs the full URL by appending the path and query items to the base URL.
    func makeURL(baseURL: URL) throws -> URL {
        guard var components = URLComponents(url: baseURL.appendingPathComponent(path), resolvingAgainstBaseURL: false) else {
            throw APIRequestError.invalidBaseURL
        }
        if let queryItems = queryItems, !queryItems.isEmpty {
            components.queryItems = queryItems
        }
        guard let url = components.url else {
            throw APIRequestError.invalidURLComponents
        }
        return url
    }

    /// Encodes an `Encodable` value as JSON data using a preconfigured encoder.
    func jsonBody<T: Encodable>(_ value: T, dateStrategy: JSONEncoder.DateEncodingStrategy = .iso8601, keyStrategy: JSONEncoder.KeyEncodingStrategy = .convertToSnakeCase) -> Data? {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = dateStrategy
        encoder.keyEncodingStrategy = keyStrategy
        return try? encoder.encode(value)
    }

    /// Builds an application/x-www-form-urlencoded body from key/value pairs.
    func formURLEncodedBody(_ params: [String: String]) -> Data? {
        let encoded = params.map { key, value in
            let k = key.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? key
            let v = value.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? value
            return "\(k)=\(v)"
        }.joined(separator: "&")
        return encoded.data(using: .utf8)
    }

    /// Returns a new query item list by appending items built from the provided parameters.
    func appendingQueryItems(_ params: [String: Any?]) -> [URLQueryItem] {
        let extra = buildQueryItems(params)
        let base = queryItems ?? []
        return base + extra
    }

    /// Builds a URLRequest for this API request.
    func buildURLRequest(baseURL: URL, authToken: String?) throws -> URLRequest {
        let url = try makeURL(baseURL: baseURL)
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.timeoutInterval = timeout

        var allHeaders = headers
        if requiresAuth, let token = authToken {
            allHeaders["Authorization"] = "Bearer \(token)"
        }
        for (key, value) in allHeaders {
            request.setValue(value, forHTTPHeaderField: key)
        }

        request.httpBody = body

        return request
    }
}

internal enum APIRequestError: Error {
    case invalidBaseURL
    case invalidURLComponents
}
