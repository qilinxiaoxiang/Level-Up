//
//  TaskEditView.swift
//  Revelation
//
//  Created on 2026-01-08.
//

import SwiftUI

struct TaskEditView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var authService: AuthService

    let existingTask: Task?
    let taskType: TaskType
    let onSave: (Task) -> Void

    @State private var title = ""
    @State private var description = ""
    @State private var priority = 1
    @State private var targetMinutesPerDay: Int?
    @State private var estimatedMinutes: Int?
    @State private var deadline: Date?
    @State private var hasDeadline = false

    init(existingTask: Task? = nil, taskType: TaskType, onSave: @escaping (Task) -> Void) {
        self.existingTask = existingTask
        self.taskType = existingTask?.taskType ?? taskType
        self.onSave = onSave
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Task Title", text: $title)

                    TextField("Description (optional)", text: $description, axis: .vertical)
                        .lineLimit(3...6)
                }

                Section {
                    Picker("Priority", selection: $priority) {
                        Text("Low (P0)").tag(0)
                        Text("Medium (P1)").tag(1)
                        Text("High (P2)").tag(2)
                        Text("Urgent (P3)").tag(3)
                    }
                } header: {
                    Text("Priority")
                }

                if taskType == .daily {
                    Section {
                        HStack {
                            Text("Target")
                            Spacer()
                            TextField("Minutes", value: $targetMinutesPerDay, format: .number)
                                .keyboardType(.numberPad)
                                .multilineTextAlignment(.trailing)
                            Text("min/day")
                                .foregroundStyle(.secondary)
                        }
                    } header: {
                        Text("Daily Target")
                    }
                } else {
                    Section {
                        Toggle("Set Deadline", isOn: $hasDeadline)

                        if hasDeadline {
                            DatePicker(
                                "Deadline",
                                selection: Binding(
                                    get: { deadline ?? Date() },
                                    set: { deadline = $0 }
                                ),
                                in: Date()...,
                                displayedComponents: .date
                            )
                        }
                    } header: {
                        Text("Timeline")
                    }

                    Section {
                        HStack {
                            Text("Estimated Time")
                            Spacer()
                            TextField("Minutes", value: $estimatedMinutes, format: .number)
                                .keyboardType(.numberPad)
                                .multilineTextAlignment(.trailing)
                            Text("min")
                                .foregroundStyle(.secondary)
                        }
                    } header: {
                        Text("Time Estimate")
                    }
                }
            }
            .navigationTitle(existingTask == nil ? "New Task" : "Edit Task")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveTask()
                    }
                    .disabled(title.isEmpty)
                }
            }
            .onAppear {
                loadExistingTask()
            }
        }
    }

    private func loadExistingTask() {
        guard let task = existingTask else { return }

        title = task.title
        description = task.description ?? ""
        priority = task.priority
        targetMinutesPerDay = task.targetMinutesPerDay
        estimatedMinutes = task.estimatedMinutes
        deadline = task.deadline
        hasDeadline = task.deadline != nil
    }

    private func saveTask() {
        let task = Task(
            id: existingTask?.id ?? UUID(),
            userId: authService.currentUser?.id ?? UUID(),
            title: title,
            description: description.isEmpty ? nil : description,
            taskType: taskType,
            status: existingTask?.status ?? "active",
            priority: priority,
            targetMinutesPerDay: taskType == .daily ? targetMinutesPerDay : nil,
            estimatedMinutes: taskType == .oneTime ? estimatedMinutes : nil,
            deadline: taskType == .oneTime && hasDeadline ? deadline : nil,
            isArchived: false,
            createdAt: existingTask?.createdAt ?? Date(),
            updatedAt: Date()
        )

        onSave(task)
    }
}
