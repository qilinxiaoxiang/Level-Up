//
//  MainTabView.swift
//  Revelation
//
//  Created on 2026-01-08.
//

import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var authService: AuthService
    @EnvironmentObject var appState: AppState

    var body: some View {
        TabView(selection: $appState.selectedTab) {
            DashboardView()
                .tabItem {
                    Label("Dashboard", systemImage: "house.fill")
                }
                .tag(AppState.Tab.dashboard)

            GoalsView()
                .tabItem {
                    Label("Goals", systemImage: "target")
                }
                .tag(AppState.Tab.goals)

            TasksView()
                .tabItem {
                    Label("Tasks", systemImage: "checkmark.circle.fill")
                }
                .tag(AppState.Tab.tasks)

            CalendarView()
                .tabItem {
                    Label("Calendar", systemImage: "calendar")
                }
                .tag(AppState.Tab.calendar)
        }
        .tint(.blue)
    }
}

#Preview {
    MainTabView()
        .environmentObject(AuthService.shared)
        .environmentObject(AppState())
}
