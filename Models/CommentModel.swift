import Foundation

struct CommentModel: Identifiable, Codable {
    let id: Int
    let user: UserSummary
    let content: String
    let createdAt: String // ISO String
    
    struct UserSummary: Codable {
        let id: Int
        let username: String
        let avatarUrl: String?
        
        enum CodingKeys: String, CodingKey {
            case id, username
            case avatarUrl = "avatar_url"
        }
    }
    
    enum CodingKeys: String, CodingKey {
        case id, user, content
        case createdAt = "created_at"
    }
}
