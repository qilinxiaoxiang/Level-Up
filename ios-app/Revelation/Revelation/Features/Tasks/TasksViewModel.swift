//
//  TasksViewModel.swift
//  Revelation
//
//  Created on 2026-01-08.
//

import Foundation
import SwiftUI

@MainActor
class TasksViewModel: ObservableObject {
    @Published var tasks: [Task] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let repository = TaskRepository()

    func loadTasks(userId: UUID) async {
        isLoading = true
        defer { isLoading = false }

        do {
            tasks = try await repository.fetchTasks(userId: userId, includeArchived: false)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func saveTask(_ task: Task) async {
        do {
            if tasks.contains(where: { $0.id == task.id }) {
                try await repository.updateTask(task)
            } else {
                let created = try await repository.createTask(task)
                tasks.append(created)
            }
            // Reload to get fresh data
            if let userId = tasks.first?.userId {
                await loadTasks(userId: userId)
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func archiveTask(_ task: Task) async {
        do {
            try await repository.archiveTask(id: task.id)
            tasks.removeAll { $0.id == task.id }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func deleteTask(_ task: Task) async {
        do {
            try await repository.deleteTask(id: task.id)
            tasks.removeAll { $0.id == task.id }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
