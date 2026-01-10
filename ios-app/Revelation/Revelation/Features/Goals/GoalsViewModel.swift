//
//  GoalsViewModel.swift
//  Revelation
//
//  Created on 2026-01-08.
//

import Foundation
import SwiftUI

@MainActor
class GoalsViewModel: ObservableObject {
    @Published var goals: [Goal] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let repository = GoalRepository()

    func loadGoals(userId: UUID) async {
        isLoading = true
        defer { isLoading = false }

        do {
            goals = try await repository.fetchGoals(userId: userId)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func saveGoal(_ goal: Goal) async {
        do {
            if goals.contains(where: { $0.id == goal.id }) {
                try await repository.updateGoal(goal)
            } else {
                let created = try await repository.createGoal(goal)
                goals.append(created)
            }
            // Reload to get fresh data
            if let userId = goals.first?.userId {
                await loadGoals(userId: userId)
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func deleteGoal(id: UUID) async {
        do {
            try await repository.deleteGoal(id: id)
            goals.removeAll { $0.id == id }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
