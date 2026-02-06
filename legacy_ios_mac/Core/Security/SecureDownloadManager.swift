// SecureDownloadManager.swift
// Handles secure download and verification of tune packages.

import Foundation
import Combine
import CryptoKit

enum DownloadError: Error {
    case unauthorized
    case invalidSignature
    case networkError(Error)
    case fileSystemError
    case missingPublicKey
}

class SecureDownloadManager {
    static let shared = SecureDownloadManager()
    private let api = APIClient.shared
    
    // In production, fetch this from a secure endpoint or embed safely
    private let publicKeyB64 = ProcessInfo.processInfo.environment["REVSYNC_PUBLIC_KEY"] 
        ?? "YOUR_PUBLIC_KEY_HERE"

    private struct DownloadLinkRequest: APIRequest {
        struct Response: Decodable {
            let downloadUrl: String
            let expiresIn: Int
        }
        let versionId: UUID
        var path: String { "/marketplace/download/\(versionId)/" }
        var method: HTTPMethod { .POST }
    }
    
    func downloadAndVerify(version: TuneVersionEntity) -> AnyPublisher<URL, Error> {
        guard let versionId = version.id else {
            return Fail(error: DownloadError.fileSystemError).eraseToAnyPublisher()
        }
        
        return api.send(DownloadLinkRequest(versionId: versionId))
            .mapError { DownloadError.networkError($0) }
            .flatMap { [weak self] response -> AnyPublisher<URL, Error> in
                guard let self = self else { return Fail(error: DownloadError.unknownError).eraseToAnyPublisher() }
                guard let url = URL(string: response.downloadUrl) else {
                    return Fail(error: DownloadError.networkError(URLError(.badURL))).eraseToAnyPublisher()
                }
                return self.downloadFile(from: url)
            }
            .flatMap { [weak self] tempUrl -> AnyPublisher<URL, Error> in
                guard let self = self else { return Fail(error: DownloadError.unknownError).eraseToAnyPublisher() }
                return self.verifySignature(fileUrl: tempUrl, signature: version.signature)
            }
            .eraseToAnyPublisher()
    }
    
    private func downloadFile(from url: URL) -> AnyPublisher<URL, Error> {
        URLSession.shared.dataTaskPublisher(for: url)
            .mapError { DownloadError.networkError($0) }
            .tryMap { data, response in
                let tempDir = FileManager.default.temporaryDirectory
                let tempFileUrl = tempDir.appendingPathComponent(UUID().uuidString + ".revsyncpkg")
                try data.write(to: tempFileUrl)
                return tempFileUrl
            }
            .eraseToAnyPublisher()
    }
    
    private func verifySignature(fileUrl: URL, signature: String?) -> AnyPublisher<URL, Error> {
        return Future<URL, Error> { promise in
            guard let signatureB64 = signature,
                  let signatureData = Data(base64Encoded: signatureB64),
                  let fileData = try? Data(contentsOf: fileUrl) else {
                promise(.failure(DownloadError.invalidSignature))
                return
            }
            
            // Reconstruct Public Key
            guard let keyData = Data(base64Encoded: self.publicKeyB64) else {
                promise(.failure(DownloadError.missingPublicKey))
                return
            }
            
            do {
                let key = try Curve25519.Signing.PublicKey(rawRepresentation: keyData)
                if key.isValidSignature(signatureData, for: fileData) {
                    promise(.success(fileUrl))
                } else {
                    promise(.failure(DownloadError.invalidSignature))
                }
            } catch {
                promise(.failure(DownloadError.invalidSignature))
            }
        }.eraseToAnyPublisher()
    }
}
