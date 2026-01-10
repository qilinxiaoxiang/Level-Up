//
//  Pomodoro.swift
//  Revelation
//
//  Created on 2026-01-08.
//

import Foundation

struct Pomodoro: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    let taskId: UUID?
    let duration: Int
    let actualDuration: Int?
    let focusRating: Int?
    var accomplishment: String?
    let completedAt: Date
    let startedAt: Date?
    let wasManual: Bool
    let overtimeMinutes: Int?
    let pausePeriods: [PausePeriod]?

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case taskId = "task_id"
        case duration
        case actualDuration = "actual_duration"
        case focusRating = "focus_rating"
        case accomplishment
        case completedAt = "completed_at"
        case startedAt = "started_at"
        case wasManual = "was_manual"
        case overtimeMinutes = "overtime_minutes"
        case pausePeriods = "pause_periods"
    }

    var effectiveDuration: Int {
        actualDuration ?? duration
    }
}

struct ActivePomodoro: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    let taskId: UUID?
    let plannedDuration: Int
    let startTime: Date
    var pausedAt: Date?
    var totalPausedSeconds: Int
    var pausePeriods: [PausePeriod]?

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case taskId = "task_id"
        case plannedDuration = "planned_duration"
        case startTime = "start_time"
        case pausedAt = "paused_at"
        case totalPausedSeconds = "total_paused_seconds"
        case pausePeriods = "pause_periods"
    }

    var isPaused: Bool {
        pausedAt != nil
    }
}

struct PausePeriod: Codable, Hashable {
    let pausedAt: Date
    let resumedAt: Date?

    enum CodingKeys: String, CodingKey {
        case pausedAt = "paused_at"
        case resumedAt = "resumed_at"
    }

    var duration: TimeInterval? {
        guard let resumedAt else { return nil }
        return resumedAt.timeIntervalSince(pausedAt)
    }
}
