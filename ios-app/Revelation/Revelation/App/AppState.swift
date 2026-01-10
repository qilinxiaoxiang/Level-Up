//
//  AppState.swift
//  Revelation
//
//  Created on 2026-01-08.
//

import Foundation
import SwiftUI

@MainActor
class AppState: ObservableObject {
    @Published var selectedTab: Tab = .dashboard
    @Published var showingGoalSetup = false
    @Published var activePomodoro: ActivePomodoro?

    enum Tab {
        case dashboard
        case goals
        case tasks
        case calendar
    }
}
