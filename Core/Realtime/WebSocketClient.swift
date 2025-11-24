// WebSocketClient.swift
// Lightweight wrapper around URLSessionWebSocketTask with optional bearer auth and minimal reconnect.
//

import Foundation

/// A simple WebSocket client that supports Authorization headers, heartbeats, and minimal auto‑reconnect.
final class WebSocketClient: NSObject {
    // MARK: - Public configuration
    private let url: URL
    private let tokenProvider: (() -> String?)?
    private let extraHeaders: [String: String]
    private let autoReconnect: Bool
    private let reconnectDelaySeconds: TimeInterval
    private let heartbeatInterval: TimeInterval

    // MARK: - Internals
    private var session: URLSession!
    private var task: URLSessionWebSocketTask?
    private var heartbeatTimer: Timer?
    private var isManuallyClosed = false

    // MARK: - Init
    /// - Parameters:
    ///   - url: The websocket URL.
    ///   - tokenProvider: Closure returning a bearer token when available (e.g., from Keychain/AppState).
    ///   - extraHeaders: Additional headers to include during the handshake.
    ///   - autoReconnect: Whether to attempt reconnects after unintentional disconnects.
    ///   - reconnectDelaySeconds: Delay before attempting a reconnect.
    ///   - heartbeatInterval: Interval for ping heartbeats; set <= 0 to disable.
    init(
        url: URL,
        tokenProvider: (() -> String?)? = nil,
        extraHeaders: [String: String] = [:],
        autoReconnect: Bool = true,
        reconnectDelaySeconds: TimeInterval = 5,
        heartbeatInterval: TimeInterval = 25
    ) {
        self.url = url
        self.tokenProvider = tokenProvider
        self.extraHeaders = extraHeaders
        self.autoReconnect = autoReconnect
        self.reconnectDelaySeconds = reconnectDelaySeconds
        self.heartbeatInterval = heartbeatInterval
        super.init()
        self.session = URLSession(configuration: .default, delegate: self, delegateQueue: OperationQueue())
    }

    deinit {
        heartbeatTimer?.invalidate()
        task?.cancel(with: .goingAway, reason: nil)
    }

    // MARK: - Connection lifecycle
    /// Opens the socket and begins listening.
    func connect() {
        isManuallyClosed = false
        var request = URLRequest(url: url)
        // Attach Authorization header if a token is available
        if let token = tokenProvider?(), !token.isEmpty {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        // Attach any additional headers (e.g., X-Client-Version)
        for (k, v) in extraHeaders { request.setValue(v, forHTTPHeaderField: k) }

        task = session.webSocketTask(with: request)
        task?.resume()
        scheduleHeartbeat()
        receive()
    }

    /// Closes the socket gracefully and prevents auto‑reconnect.
    func disconnect() {
        isManuallyClosed = true
        heartbeatTimer?.invalidate()
        heartbeatTimer = nil
        task?.cancel(with: .goingAway, reason: nil)
    }

    /// Sends a message over the socket.
    func send(_ message: URLSessionWebSocketTask.Message) {
        task?.send(message) { error in
            if let error = error { print("WebSocket send error: \(error)") }
        }
    }

    // MARK: - Heartbeat
    private func scheduleHeartbeat() {
        heartbeatTimer?.invalidate()
        guard heartbeatInterval > 0 else { return }
        heartbeatTimer = Timer.scheduledTimer(withTimeInterval: heartbeatInterval, repeats: true) { [weak self] _ in
            self?.task?.sendPing { error in
                if let error = error { print("WebSocket ping failed: \(error)") }
            }
        }
    }

    // MARK: - Receiving
    private func receive() {
        task?.receive { [weak self] result in
            guard let self = self else { return }
            switch result {
            case .failure(let error):
                print("WebSocket receive error: \(error)")
                self.handleUnintentionalDisconnect()
            case .success(let message):
                switch message {
                case .string(let string):
                    print("WebSocket message: \(string)")
                case .data(let data):
                    print("WebSocket binary: \(data)")
                @unknown default:
                    break
                }
                self.receive()
            }
        }
    }

    private func handleUnintentionalDisconnect() {
        guard autoReconnect && !isManuallyClosed else { return }
        // Delay a bit before reconnecting
        DispatchQueue.global().asyncAfter(deadline: .now() + reconnectDelaySeconds) { [weak self] in
            self?.connect()
        }
    }
}

extension WebSocketClient: URLSessionWebSocketDelegate {
    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didOpenWithProtocol protocol: String?) {
        print("WebSocket connected")
    }

    func urlSession(
        _ session: URLSession,
        webSocketTask: URLSessionWebSocketTask,
        didCloseWith closeCode: URLSessionWebSocketTask.CloseCode,
        reason: Data?
    ) {
        print("WebSocket disconnected (code: \(closeCode.rawValue))")
        handleUnintentionalDisconnect()
    }
}
