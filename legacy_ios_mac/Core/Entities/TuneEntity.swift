// TuneEntity.swift
// Core Data subclass for Tune entity.

import Foundation
import CoreData

@objc(TuneEntity)
public class TuneEntity: NSManagedObject {
    @NSManaged public var id: UUID?
    @NSManaged public var title: String?
    @NSManaged public var slug: String?
    @NSManaged public var desc: String?
    @NSManaged public var price: Double
    @NSManaged public var vehicleMake: String?
    @NSManaged public var vehicleModel: String?
    @NSManaged public var vehicleYearStart: Int16
    @NSManaged public var vehicleYearEnd: Int16
    @NSManaged public var tunerName: String?
    @NSManaged public var tunerId: UUID?
    @NSManaged public var createdAt: Date?
    
    // Relationship
    @NSManaged public var versions: NSSet?
}

// MARK: Generated accessors for versions
extension TuneEntity {
    @objc(addVersionsObject:)
    @NSManaged public func addToVersions(_ value: TuneVersionEntity)

    @objc(removeVersionsObject:)
    @NSManaged public func removeFromVersions(_ value: TuneVersionEntity)

    @objc(addVersions:)
    @NSManaged public func addToVersions(_ values: NSSet)

    @objc(removeVersions:)
    @NSManaged public func removeFromVersions(_ values: NSSet)
}

extension TuneEntity {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<TuneEntity> {
        return NSFetchRequest<TuneEntity>(entityName: "Tune")
    }
}

extension TuneEntity: Identifiable {}
