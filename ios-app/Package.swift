// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "Revelation",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .library(
            name: "Revelation",
            targets: ["Revelation"]
        )
    ],
    dependencies: [
        .package(url: "https://github.com/supabase/supabase-swift.git", from: "2.0.0")
    ],
    targets: [
        .target(
            name: "Revelation",
            dependencies: [
                .product(name: "Supabase", package: "supabase-swift")
            ]
        ),
        .testTarget(
            name: "RevelationTests",
            dependencies: ["Revelation"]
        )
    ]
)
