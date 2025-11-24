//  MarketplaceService.swift
//  Real Django calls for tune browsing and purchases (Phase-1)
//

import Foundation
import Combine

/// Provides marketplace operations: list tunes, fetch details, and purchase.
final class MarketplaceService {
    private let api = APIClient.shared

    // MARK: - Requests
    private struct TuneListRequest: APIRequest {
        typealias Response = Paginated<TuneModel>
        let params: [String: Any?]
        var path: String { "/marketplace/tunes/" }
        var method: HTTPMethod { .GET }
        var queryItems: [URLQueryItem]? { buildQueryItems(params) }
    }

    private struct TuneDetailRequest: APIRequest {
        typealias Response = TuneModel
        let id: Int
        var path: String { "/marketplace/tunes/\(id)/" }
        var method: HTTPMethod { .GET }
    }

    private struct PurchaseRequest: APIRequest {
        struct Body: Encodable { let tune_id: Int } // Backend expects tune_id
        typealias Response = TransactionModel
        let tuneId: Int
        var path: String { "/marketplace/purchase/" }
        var method: HTTPMethod { .POST }
        var body: Data? { jsonBody(Body(tune_id: tuneId)) }
    }

final class MarketplaceService: MarketplaceServiceProtocol {
    private let api: APIClient

    init(api: APIClient = .shared) {
        self.api = api
    }

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
    func getTune(id: Int) -> AnyPublisher<TuneModel, Error> {
        api.send(TuneDetailRequest(id: id)).eraseToAnyPublisher()
    }

    // MARK: - Purchases
    /// Initiates a purchase for a given tune.
    func purchaseTune(tuneId: Int) -> AnyPublisher<TransactionModel, Error> {
        api.send(PurchaseRequest(tuneId: tuneId)).eraseToAnyPublisher()
    }

    // MARK: - Social
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

    // MARK: - Core Data Caching (Future Phase)
    // Planned: Persist fetched results to Core Data for offline browsing.
    // Suggested approach:
    // 1) Map TuneModel → CDTune in a background context on successful responses.
    // 2) Save and merge to viewContext.
    // 3) Provide NSFetchedResultsController or Combine publishers in ViewModels for UI.
}
