//
//  PomodoroRepository.swift
//  Revelation
//
//  Created on 2026-01-08.
//

import Foundation
import Supabase

@MainActor
class PomodoroRepository: ObservableObject {
    private let supabase = SupabaseClient.shared

    // Active Pomodoro operations
    func fetchActivePomodoro(userId: UUID) async throws -> ActivePomodoro? {
        let response: [ActivePomodoro] = try await supabase.client
            .from("active_pomodoros")
            .select()
            .eq("user_id", value: userId)
            .limit(1)
            .execute()
            .value

        return response.first
    }

    func createActivePomodoro(taskId: UUID?, plannedDuration: Int, userId: UUID) async throws -> ActivePomodoro {
        let activePomodoro = ActivePomodoro(
            id: UUID(),
            userId: userId,
            taskId: taskId,
            plannedDuration: plannedDuration,
            startTime: Date(),
            pausedAt: nil,
            totalPausedSeconds: 0,
            pausePeriods: []
        )

        let response: [ActivePomodoro] = try await supabase.client
            .from("active_pomodoros")
            .insert(activePomodoro)
            .select()
            .execute()
            .value

        guard let created = response.first else {
            throw RepositoryError.createFailed
        }

        return created
    }

    func updateActivePomodoro(_ pomodoro: ActivePomodoro) async throws {
        try await supabase.client
            .from("active_pomodoros")
            .update(pomodoro)
            .eq("id", value: pomodoro.id)
            .execute()
    }

    func deleteActivePomodoro(id: UUID) async throws {
        try await supabase.client
            .from("active_pomodoros")
            .delete()
            .eq("id", value: id)
            .execute()
    }

    // Completed Pomodoro operations
    func fetchPomodoros(
        userId: UUID,
        taskId: UUID? = nil,
        startDate: Date? = nil,
        endDate: Date? = nil
    ) async throws -> [Pomodoro] {
        var query = supabase.client
            .from("pomodoros")
            .select()
            .eq("user_id", value: userId)

        if let taskId {
            query = query.eq("task_id", value: taskId)
        }

        if let startDate {
            query = query.gte("completed_at", value: startDate)
        }

        if let endDate {
            query = query.lte("completed_at", value: endDate)
        }

        let response: [Pomodoro] = try await query
            .order("completed_at", ascending: false)
            .execute()
            .value

        return response
    }

    func createPomodoro(_ pomodoro: Pomodoro) async throws -> Pomodoro {
        let response: [Pomodoro] = try await supabase.client
            .from("pomodoros")
            .insert(pomodoro)
            .select()
            .execute()
            .value

        guard let created = response.first else {
            throw RepositoryError.createFailed
        }

        return created
    }

    func updatePomodoro(_ pomodoro: Pomodoro) async throws {
        try await supabase.client
            .from("pomodoros")
            .update(pomodoro)
            .eq("id", value: pomodoro.id)
            .execute()
    }

    // Statistics
    func getTotalMinutesToday(userId: UUID, dayCutTime: Date) async throws -> Int {
        let pomodoros = try await fetchPomodoros(
            userId: userId,
            startDate: dayCutTime
        )

        return pomodoros.reduce(0) { $0 + ($1.effectiveDuration / 60) }
    }

    func getTotalMinutesThisWeek(userId: UUID) async throws -> Int {
        let calendar = Calendar.current
        let weekStart = calendar.dateInterval(of: .weekOfYear, for: Date())?.start ?? Date()

        let pomodoros = try await fetchPomodoros(
            userId: userId,
            startDate: weekStart
        )

        return pomodoros.reduce(0) { $0 + ($1.effectiveDuration / 60) }
    }

    func getTotalMinutesAllTime(userId: UUID) async throws -> Int {
        let pomodoros = try await fetchPomodoros(userId: userId)
        return pomodoros.reduce(0) { $0 + ($1.effectiveDuration / 60) }
    }
}
