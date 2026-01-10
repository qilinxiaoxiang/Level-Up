//
//  GoalEditView.swift
//  Revelation
//
//  Created on 2026-01-08.
//

import SwiftUI

struct GoalEditView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var authService: AuthService

    let goalType: GoalType
    let existingGoal: Goal?
    let onSave: (Goal) -> Void

    @State private var description = ""
    @State private var targetDate = Date()

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Text(goalType.displayName)
                        .font(.headline)
                } header: {
                    Text("Goal Type")
                }

                Section {
                    TextEditor(text: $description)
                        .frame(minHeight: 100)
                } header: {
                    Text("Description")
                } footer: {
                    Text("Describe what you want to achieve")
                }

                Section {
                    DatePicker(
                        "Target Date",
                        selection: $targetDate,
                        in: Date()...,
                        displayedComponents: .date
                    )
                } header: {
                    Text("Timeline")
                }
            }
            .navigationTitle(existingGoal == nil ? "New Goal" : "Edit Goal")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveGoal()
                    }
                    .disabled(description.isEmpty)
                }
            }
            .onAppear {
                if let goal = existingGoal {
                    description = goal.description
                    targetDate = goal.targetDate
                } else {
                    // Set default target date based on goal type
                    let calendar = Calendar.current
                    targetDate = calendar.date(
                        byAdding: .month,
                        value: goalType.durationInMonths,
                        to: Date()
                    ) ?? Date()
                }
            }
        }
    }

    private func saveGoal() {
        let goal = Goal(
            id: existingGoal?.id ?? UUID(),
            userId: authService.currentUser?.id ?? UUID(),
            type: goalType,
            description: description,
            targetDate: targetDate,
            createdAt: existingGoal?.createdAt ?? Date(),
            updatedAt: Date()
        )

        onSave(goal)
    }
}
