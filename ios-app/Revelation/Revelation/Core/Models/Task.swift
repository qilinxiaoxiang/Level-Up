//
//  Task.swift
//  Revelation
//
//  Created on 2026-01-08.
//

import Foundation

struct Task: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    var title: String
    var description: String?
    var taskType: TaskType
    var status: String
    var priority: Int
    var targetMinutesPerDay: Int?
    var estimatedMinutes: Int?
    var deadline: Date?
    var isArchived: Bool
    let createdAt: Date
    let updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case title
        case description
        case taskType = "task_type"
        case status
        case priority
        case targetMinutesPerDay = "target_minutes_per_day"
        case estimatedMinutes = "estimated_minutes"
        case deadline
        case isArchived = "is_archived"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

enum TaskType: String, Codable {
    case daily
    case oneTime = "one_time"

    var displayName: String {
        switch self {
        case .daily: return "Daily Task"
        case .oneTime: return "One-Time Task"
        }
    }
}

struct TaskRelationship: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    let oneTimeTaskId: UUID
    let dailyTaskId: UUID
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case oneTimeTaskId = "one_time_task_id"
        case dailyTaskId = "daily_task_id"
        case createdAt = "created_at"
    }
}
