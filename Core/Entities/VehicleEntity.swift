//
//  VehicleEntity+CoreDataClass.swift
//  RevSync
//
//  Created by RevSync on 20/10/2025.
//
//

import Foundation
import CoreData

@objc(VehicleEntity)
public class VehicleEntity: NSManagedObject {

}

extension VehicleEntity {

    @nonobjc public class func fetchRequest() -> NSFetchRequest<VehicleEntity> {
        return NSFetchRequest<VehicleEntity>(entityName: "VehicleEntity")
    }

    @NSManaged public var currentTuneId: String?
    @NSManaged public var ecuType: String?
    @NSManaged public var id: UUID?
    @NSManaged public var lastUpdated: Date?
    @NSManaged public var make: String?
    @NSManaged public var model: String?
    @NSManaged public var name: String?
    @NSManaged public var vehicleType: String?
    @NSManaged public var vin: String?
    @NSManaged public var year: Int32
    @NSManaged public var specsData: Data?

}

extension VehicleEntity : Identifiable {

}
