//  MarketplaceService.swift
//  Real Django calls for tune browsing and purchases (Phase-1)
//

import Foundation
import Combine

/// Provides marketplace operations: list tunes, fetch details, and purchase.
class MarketplaceService {
    private let api = APIClient.shared

    // MARK: - Requests
    private struct TuneListRequest: APIRequest {
        typealias Response = Paginated<TuneModel>
        let params: [String: Any?]
        var path: String { "/marketplace/browse/" }
        var method: HTTPMethod { .GET }
        var queryItems: [URLQueryItem]? { buildQueryItems(params) }
    }

    private struct TuneDetailRequest: APIRequest {
        typealias Response = TuneModel
        let id: UUID
        var path: String { "/marketplace/listing/\(id)/" }
        var method: HTTPMethod { .GET }
    }

    private struct PurchaseRequest: APIRequest {
        typealias Response = TransactionModel
        let tuneId: UUID
        var path: String { "/marketplace/purchase/\(tuneId)/" }
        var method: HTTPMethod { .POST }
        var body: Data? { nil }
    }

    private struct CreateTuneRequest: APIRequest {
        typealias Response = TuneModel
        let bodyData: Data?
        var path: String { "/api/v1/tuner/listings/" } // Tuner Draft
        var method: HTTPMethod { .POST }
        var body: Data? { bodyData }
    }
    
    /*
    // MARK: - Social Requests (Pending Backend Refactor)
    private struct GetCommentsRequest: APIRequest {
        typealias Response = [CommentModel]
        let tuneId: Int
        var path: String { "/marketplace/tunes/\(tuneId)/comments/" }
        var method: HTTPMethod { .GET }
    }
    
    private struct PostCommentRequest: APIRequest {
        typealias Response = CommentModel
        let tuneId: Int
        let payload: PostCommentPayload
        var path: String { "/marketplace/tunes/\(tuneId)/comments/" }
        var method: HTTPMethod { .POST }
        var body: Data? { jsonBody(payload) }
    }
    
    private struct ToggleLikeRequest: APIRequest {
        struct Response: Decodable { let status: String } // "liked" or "unliked"
        let tuneId: Int
        var path: String { "/marketplace/tunes/\(tuneId)/like/" }
        var method: HTTPMethod { .POST }
    }
    
    struct PostCommentPayload: Encodable {
        let content: String
    }
    */

    // Singleton for easy access
    static let shared = MarketplaceService()

    init() {}

    // MARK: - Tune Browsing
    /// Lists tunes with rich filters.
    func getTunes(
        vehicleMake: String? = nil,
        vehicleModel: String? = nil,
        stage: Int? = nil,
        page: Int? = nil
    ) -> AnyPublisher<Paginated<TuneModel>, Error> {
        let params: [String: Any?] = [
            "vehicle_make": vehicleMake,
            "vehicle_model": vehicleModel,
            "stage": stage,
            "page": page
        ]
        return api.send(TuneListRequest(params: params))
            .eraseToAnyPublisher()
    }

    /// Fetches detail for a single tune.
    func getTune(id: UUID) -> AnyPublisher<TuneModel, Error> {
        api.send(TuneDetailRequest(id: id)).eraseToAnyPublisher()
    }

    // MARK: - Purchases
    /// Initiates a purchase for a given tune.
    func purchaseTune(tuneId: UUID) -> AnyPublisher<TransactionModel, Error> {
        api.send(PurchaseRequest(tuneId: tuneId)).eraseToAnyPublisher()
    }
    
    /// Creates a new tune listing.
    func createTune(name: String, description: String, price: Double, vehicleMake: String, vehicleModel: String, yearStart: Int, yearEnd: Int) -> AnyPublisher<TuneModel, Error> {
        let payload: [String: Any] = [
            "title": name,
            "description": description,
            "price": price,
            "vehicle_make": vehicleMake,
            "vehicle_model": vehicleModel,
            "vehicle_year_start": yearStart,
            "vehicle_year_end": yearEnd
            // "status" defaults to DRAFT
        ]
        
        guard let bodyData = try? JSONSerialization.data(withJSONObject: payload) else {
            return Fail(error: URLError(.badURL)).eraseToAnyPublisher()
        }
        
        return api.send(CreateTuneRequest(bodyData: bodyData)).eraseToAnyPublisher()
    }

    /*
    // MARK: - Social (Pending Backend Refactor)
    func getComments(tuneId: Int) -> AnyPublisher<[CommentModel], Error> {
        api.send(GetCommentsRequest(tuneId: tuneId))
            .eraseToAnyPublisher()
    }

    func postComment(tuneId: Int, content: String) -> AnyPublisher<CommentModel, Error> {
        let payload = PostCommentPayload(content: content)
        return api.send(PostCommentRequest(tuneId: tuneId, payload: payload))
            .eraseToAnyPublisher()
    }

    func toggleLike(tuneId: Int) -> AnyPublisher<Bool, Error> {
        api.send(ToggleLikeRequest(tuneId: tuneId))
            .map { response in response.status == "liked" }
            .eraseToAnyPublisher()
    }
    */

    // MARK: - Core Data Caching (Future Phase)
    // Planned: Persist fetched results to Core Data for offline browsing.
    // Suggested approach:
    // 1) Map TuneModel → CDTune in a background context on successful responses.
    // 2) Save and merge to viewContext.
    // 3) Provide NSFetchedResultsController or Combine publishers in ViewModels for UI.
}
