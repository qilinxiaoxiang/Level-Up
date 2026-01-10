//
//  DashboardView.swift
//  Revelation
//
//  Created on 2026-01-08.
//

import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var authService: AuthService
    @StateObject private var pomodoroRepository = PomodoroRepository()
    @State private var todayMinutes = 0
    @State private var weekMinutes = 0
    @State private var totalMinutes = 0

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Welcome section
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Welcome back!")
                            .font(.title2.bold())

                        if let email = authService.currentUser?.email {
                            Text(email)
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()

                    // Statistics
                    VStack(spacing: 16) {
                        StatCard(
                            title: "Today",
                            value: "\(todayMinutes)",
                            unit: "min",
                            color: .blue
                        )

                        StatCard(
                            title: "This Week",
                            value: "\(weekMinutes)",
                            unit: "min",
                            color: .green
                        )

                        StatCard(
                            title: "All Time",
                            value: "\(totalMinutes)",
                            unit: "min",
                            color: .purple
                        )
                    }
                    .padding(.horizontal)

                    // Streak info
                    if let profile = authService.userProfile {
                        VStack(spacing: 12) {
                            HStack {
                                Image(systemName: "flame.fill")
                                    .foregroundStyle(.orange)
                                Text("Current Streak")
                                    .font(.headline)
                                Spacer()
                                Text("\(profile.currentStreak) days")
                                    .font(.title2.bold())
                                    .foregroundStyle(.orange)
                            }

                            HStack {
                                Image(systemName: "star.fill")
                                    .foregroundStyle(.yellow)
                                Text("Longest Streak")
                                    .font(.headline)
                                Spacer()
                                Text("\(profile.longestStreak) days")
                                    .font(.title2.bold())
                                    .foregroundStyle(.yellow)
                            }

                            HStack {
                                Image(systemName: "heart.fill")
                                    .foregroundStyle(.red)
                                Text("Rest Credits")
                                    .font(.headline)
                                Spacer()
                                Text("\(profile.restCredits)")
                                    .font(.title2.bold())
                                    .foregroundStyle(.red)
                            }
                        }
                        .padding()
                        .background(Color(.secondarySystemBackground))
                        .cornerRadius(16)
                        .padding(.horizontal)
                    }
                }
                .padding(.vertical)
            }
            .navigationTitle("Dashboard")
            .task {
                await loadStatistics()
            }
        }
    }

    private func loadStatistics() async {
        guard let userId = authService.currentUser?.id,
              let profile = authService.userProfile else { return }

        // Calculate day cut time
        let calendar = Calendar.current
        var components = calendar.dateComponents([.year, .month, .day], from: Date())
        components.hour = profile.dayCutTime.hour
        components.minute = profile.dayCutTime.minute

        let dayCutTime = calendar.date(from: components) ?? Date()

        do {
            todayMinutes = try await pomodoroRepository.getTotalMinutesToday(
                userId: userId,
                dayCutTime: dayCutTime
            )
            weekMinutes = try await pomodoroRepository.getTotalMinutesThisWeek(userId: userId)
            totalMinutes = try await pomodoroRepository.getTotalMinutesAllTime(userId: userId)
        } catch {
            print("Error loading statistics: \(error)")
        }
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let unit: String
    let color: Color

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .foregroundStyle(.secondary)

                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text(value)
                        .font(.system(size: 36, weight: .bold))
                        .foregroundStyle(color)

                    Text(unit)
                        .font(.title3)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()
        }
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(16)
    }
}

#Preview {
    DashboardView()
        .environmentObject(AuthService.shared)
}
