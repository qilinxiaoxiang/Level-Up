//
//  GoalRepository.swift
//  Revelation
//
//  Created on 2026-01-08.
//

import Foundation
import Supabase

@MainActor
class GoalRepository: ObservableObject {
    private let supabase = SupabaseClient.shared

    func fetchGoals(userId: UUID) async throws -> [Goal] {
        let response: [Goal] = try await supabase.client
            .from("goals")
            .select()
            .eq("user_id", value: userId)
            .order("type")
            .execute()
            .value

        return response
    }

    func createGoal(_ goal: Goal) async throws -> Goal {
        let response: [Goal] = try await supabase.client
            .from("goals")
            .insert(goal)
            .select()
            .execute()
            .value

        guard let created = response.first else {
            throw RepositoryError.createFailed
        }

        return created
    }

    func updateGoal(_ goal: Goal) async throws {
        try await supabase.client
            .from("goals")
            .update(goal)
            .eq("id", value: goal.id)
            .execute()
    }

    func deleteGoal(id: UUID) async throws {
        try await supabase.client
            .from("goals")
            .delete()
            .eq("id", value: id)
            .execute()
    }
}

enum RepositoryError: Error {
    case createFailed
    case updateFailed
    case deleteFailed
    case notFound
}
