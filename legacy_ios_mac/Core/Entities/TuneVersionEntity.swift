// TuneVersionEntity.swift
// Core Data subclass for TuneVersion.

import Foundation
import CoreData

@objc(TuneVersionEntity)
public class TuneVersionEntity: NSManagedObject {
    @NSManaged public var id: UUID?
    @NSManaged public var versionNumber: String?
    @NSManaged public var changelog: String?
    @NSManaged public var status: String?
    @NSManaged public var fileSize: Int64
    @NSManaged public var signature: String?
    @NSManaged public var manifestData: String? // JSON String
    @NSManaged public var signedAt: Date?
    @NSManaged public var isDownloaded: Bool
    @NSManaged public var localFilePath: String?
    
    // Relationship
    @NSManaged public var listing: TuneEntity?
}

extension TuneVersionEntity {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<TuneVersionEntity> {
        return NSFetchRequest<TuneVersionEntity>(entityName: "TuneVersion")
    }
}

extension TuneVersionEntity: Identifiable {}
