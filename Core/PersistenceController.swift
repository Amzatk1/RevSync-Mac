// PersistenceController.swift
// Core Data stack for RevSync.
//

import Foundation
import CoreData

/// Handles loading and saving Core Data contexts.
struct PersistenceController {
    /// A shared singleton for use across the app.
    static let shared = PersistenceController()

    /// The underlying persistent container.
    let container: NSPersistentContainer

    /// Initializes the persistence controller.
    /// - Parameter inMemory: When true, data is stored in memory only.
    init(inMemory: Bool = false) {
        container = NSPersistentContainer(name: "RevSyncModel")

        // Configure store description for lightweight migration & performance.
        if let description = container.persistentStoreDescriptions.first {
            if inMemory {
                description.url = URL(fileURLWithPath: "/dev/null")
            }
            // Enable automatic/lightweight migration.
            description.shouldInferMappingModelAutomatically = true
            description.shouldMigrateStoreAutomatically = true

            // WAL journaling is default; keep it for crash safety & performance.
            description.setOption(true as NSNumber, forKey: NSPersistentHistoryTrackingKey)
            description.setOption(true as NSNumber, forKey: NSPersistentStoreRemoteChangeNotificationPostOptionKey)
        }

        container.loadPersistentStores { _, error in
            if let error = error as NSError? {
                // Replace this implementation with code to handle the error appropriately.
                // fatalError() causes the application to generate a crash log and terminate. You should not use this function in a shipping application, although it may be useful during development.
                print("Unresolved Core Data error: \(error), \(error.userInfo)")
            }
        }

        // View context configuration
        let viewContext = container.viewContext
        viewContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
        viewContext.automaticallyMergesChangesFromParent = true
        viewContext.undoManager = nil // keep memory footprint low
    }

    /// A convenience controller for in-memory previews/tests.
    static var preview: PersistenceController = {
        let controller = PersistenceController(inMemory: true)
        return controller
    }()

    // MARK: - Context Helpers

    /// Creates a new private queue context for background work.
    func newBackgroundContext() -> NSManagedObjectContext {
        let context = container.newBackgroundContext()
        context.mergePolicy = NSMergeByPropertyStoreTrumpMergePolicy
        context.automaticallyMergesChangesFromParent = true
        context.undoManager = nil
        return context
    }

    /// Perform a background task with automatic save & merge.
    /// - Parameter work: Asynchronous block provided a private queue context.
    func performBackground(_ work: @escaping (NSManagedObjectContext) throws -> Void) {
        let context = newBackgroundContext()
        context.perform {
            do {
                try work(context)
                try self.save(context)
            } catch {
                // In production, route this to a logger/crash reporter.
                assertionFailure("Core Data background task failed: \(error)")
            }
        }
    }

    /// Saves any changes in the view context if present.
    func saveViewContext() throws {
        try save(container.viewContext)
    }

    /// Saves the provided context if it has changes.
    @discardableResult
    func save(_ context: NSManagedObjectContext) throws -> Bool {
        guard context.hasChanges else { return false }
        var saved = false
        try context.performAndWait {
            if context.hasChanges {
                try context.save()
                saved = true
            }
        }
        return saved
    }
}
