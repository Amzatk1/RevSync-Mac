// TuneEntity.swift
// Core Data subclass for Tune entity.

import Foundation
import CoreData

@objc(TuneEntity)
public class TuneEntity: NSManagedObject {
    @NSManaged public var id: UUID?
    @NSManaged public var name: String?
    @NSManaged public var desc: String?
    @NSManaged public var price: Double
    @NSManaged public var horsepowerGain: Double
    @NSManaged public var torqueGain: Double
    @NSManaged public var stage: Int16
    @NSManaged public var downloadCount: Int32
    @NSManaged public var safetyRating: Double
    @NSManaged public var ecuCompatibility: String?
    @NSManaged public var dynoChartUrl: String?
    @NSManaged public var creatorId: UUID?
    @NSManaged public var vehicleId: String?
    @NSManaged public var verifiedBy: String?
    
    // Transformables skipped for MVP or defined if generic
}

extension TuneEntity {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<TuneEntity> {
        return NSFetchRequest<TuneEntity>(entityName: "Tune")
    }
}

extension TuneEntity: Identifiable {}
