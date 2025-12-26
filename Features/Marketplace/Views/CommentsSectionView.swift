//
//  CommentsSectionView.swift
//  RevSync
//
//  Created by RevSync on 24/11/2025.
//

import SwiftUI
import Combine

struct CommentsSectionView: View {
    let tuneId: Int
    @StateObject private var viewModel = CommentsViewModel()
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Comments")
                .font(.headline)
            
            if viewModel.isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity)
            } else if viewModel.comments.isEmpty {
                Text("No comments yet. Be the first!")
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            } else {
                ForEach(viewModel.comments) { comment in
                    CommentRow(comment: comment)
                    Divider()
                }
            }
            
            // Input
            HStack {
                TextField("Add a comment...", text: $viewModel.newCommentText)
                    .textFieldStyle(.roundedBorder)
                
                Button {
                    viewModel.postComment(tuneId: tuneId)
                } label: {
                    if viewModel.isPosting {
                        ProgressView()
                            .controlSize(.small)
                    } else {
                        Image(systemName: "paperplane.fill")
                    }
                }
                .disabled(viewModel.newCommentText.isEmpty || viewModel.isPosting)
            }
            .padding(.top, 8)
        }
        .padding()
        .background(Color(NSColor.controlBackgroundColor))
        .cornerRadius(12)
        .onAppear {
            viewModel.loadComments(tuneId: tuneId)
        }
    }
}

struct CommentRow: View {
    let comment: CommentModel
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // Avatar
            AsyncImage(url: URL(string: comment.user.avatarUrl ?? "")) { image in
                image.resizable().scaledToFill()
            } placeholder: {
                Circle().fill(Color.gray.opacity(0.3))
            }
            .frame(width: 32, height: 32)
            .clipShape(Circle())
            
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(comment.user.username)
                        .font(.subheadline.bold())
                    Spacer()
                    Text(formatDate(comment.createdAt))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                
                Text(comment.content)
                    .font(.body)
                    .foregroundStyle(.primary)
            }
        }
    }
    
    private func formatDate(_ dateString: String) -> String {
        // Simple formatter for ISO string
        // In real app, use ISO8601DateFormatter
        return "Just now" 
    }
}

class CommentsViewModel: ObservableObject {
    @Published var comments: [CommentModel] = []
    @Published var isLoading = false
    @Published var isPosting = false
    @Published var newCommentText = ""
    
    private let service = MarketplaceService.shared
    private var cancellables = Set<AnyCancellable>()
    
    func loadComments(tuneId: Int) {
        isLoading = true
        service.getComments(tuneId: tuneId)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] (completion: Subscribers.Completion<Error>) in
                self?.isLoading = false
            } receiveValue: { [weak self] (comments: [CommentModel]) in
                self?.comments = comments
            }
            .store(in: &cancellables)
    }
    
    func postComment(tuneId: Int) {
        guard !newCommentText.isEmpty else { return }
        isPosting = true
        
        service.postComment(tuneId: tuneId, content: newCommentText)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] (completion: Subscribers.Completion<Error>) in
                self?.isPosting = false
            } receiveValue: { [weak self] (newComment: CommentModel) in
                self?.comments.insert(newComment, at: 0)
                self?.newCommentText = ""
            }
            .store(in: &cancellables)
    }
}
