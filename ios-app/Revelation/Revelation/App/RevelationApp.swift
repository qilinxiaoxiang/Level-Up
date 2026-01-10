//
//  RevelationApp.swift
//  Revelation
//
//  Created on 2026-01-08.
//

import SwiftUI

@main
struct RevelationApp: App {
    @StateObject private var authService = AuthService.shared
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            if authService.isAuthenticated {
                MainTabView()
                    .environmentObject(authService)
                    .environmentObject(appState)
            } else {
                AuthView()
                    .environmentObject(authService)
            }
        }
    }
}
