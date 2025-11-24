// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "RevSyncApp",
    platforms: [
        .macOS(.v14),
        .iOS(.v17)
    ],
    products: [
        .executable(name: "RevSyncApp", targets: ["RevSyncApp"])
    ],
    targets: [
        .executableTarget(
            name: "RevSyncApp",
            path: ".",
            exclude: [
                "RevSyncModel.xcdatamodeld", // Exclude Core Data for now if it causes issues, or handle as resource
                "Resources/VehicleDatabase.json" // Handle as resource
            ],
            resources: [
                .process("Resources/VehicleDatabase.json"),
                .process("RevSyncModel.xcdatamodeld")
            ]
        )
    ]
)
