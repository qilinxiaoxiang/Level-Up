//
//  TaskRepository.swift
//  Revelation
//
//  Created on 2026-01-08.
//

import Foundation
import Supabase

@MainActor
class TaskRepository: ObservableObject {
    private let supabase = SupabaseClient.shared

    func fetchTasks(userId: UUID, type: TaskType? = nil, includeArchived: Bool = false) async throws -> [Task] {
        var query = supabase.client
            .from("tasks")
            .select()
            .eq("user_id", value: userId)

        if let type {
            query = query.eq("task_type", value: type.rawValue)
        }

        if !includeArchived {
            query = query.eq("is_archived", value: false)
        }

        let response: [Task] = try await query
            .order("priority", ascending: false)
            .order("created_at", ascending: false)
            .execute()
            .value

        return response
    }

    func createTask(_ task: Task) async throws -> Task {
        let response: [Task] = try await supabase.client
            .from("tasks")
            .insert(task)
            .select()
            .execute()
            .value

        guard let created = response.first else {
            throw RepositoryError.createFailed
        }

        return created
    }

    func updateTask(_ task: Task) async throws {
        try await supabase.client
            .from("tasks")
            .update(task)
            .eq("id", value: task.id)
            .execute()
    }

    func archiveTask(id: UUID) async throws {
        try await supabase.client
            .from("tasks")
            .update(["is_archived": true])
            .eq("id", value: id)
            .execute()
    }

    func deleteTask(id: UUID) async throws {
        try await supabase.client
            .from("tasks")
            .delete()
            .eq("id", value: id)
            .execute()
    }

    // Task relationships
    func linkTasks(oneTimeTaskId: UUID, dailyTaskId: UUID, userId: UUID) async throws {
        let relationship = TaskRelationship(
            id: UUID(),
            userId: userId,
            oneTimeTaskId: oneTimeTaskId,
            dailyTaskId: dailyTaskId,
            createdAt: Date()
        )

        try await supabase.client
            .from("task_relationships")
            .insert(relationship)
            .execute()
    }

    func unlinkTasks(oneTimeTaskId: UUID, dailyTaskId: UUID) async throws {
        try await supabase.client
            .from("task_relationships")
            .delete()
            .eq("one_time_task_id", value: oneTimeTaskId)
            .eq("daily_task_id", value: dailyTaskId)
            .execute()
    }
}
