// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "AIBrain",
    platforms: [
        .macOS(.v14)
    ],
    products: [
        .executable(name: "AIBrain", targets: ["AIBrain"]),
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "AIBrain",
            path: "Sources/main.swift")
    ]
)