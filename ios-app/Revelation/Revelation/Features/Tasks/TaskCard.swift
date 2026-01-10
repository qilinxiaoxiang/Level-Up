//
//  TaskCard.swift
//  Revelation
//
//  Created on 2026-01-08.
//

import SwiftUI

struct TaskCard: View {
    let task: Task
    let onTap: () -> Void
    let onStart: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(task.title)
                        .font(.headline)

                    if let description = task.description, !description.isEmpty {
                        Text(description)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .lineLimit(2)
                    }
                }

                Spacer()

                priorityBadge
            }

            if task.taskType == .daily {
                dailyTaskInfo
            } else {
                oneTimeTaskInfo
            }

            Divider()

            HStack {
                Button(action: onTap) {
                    Label("Edit", systemImage: "pencil")
                        .font(.caption)
                }
                .buttonStyle(.bordered)

                Spacer()

                Button(action: onStart) {
                    Label("Start", systemImage: "play.fill")
                        .font(.caption)
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 4)
    }

    private var priorityBadge: some View {
        HStack(spacing: 4) {
            Image(systemName: priorityIcon)
                .font(.caption)
            Text("P\(task.priority)")
                .font(.caption.bold())
        }
        .foregroundStyle(priorityColor)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(priorityColor.opacity(0.15))
        .cornerRadius(8)
    }

    private var priorityIcon: String {
        switch task.priority {
        case 3: return "exclamationmark.3"
        case 2: return "exclamationmark.2"
        case 1: return "exclamationmark"
        default: return "minus"
        }
    }

    private var priorityColor: Color {
        switch task.priority {
        case 3: return .red
        case 2: return .orange
        case 1: return .yellow
        default: return .gray
        }
    }

    @ViewBuilder
    private var dailyTaskInfo: some View {
        if let targetMinutes = task.targetMinutesPerDay {
            HStack {
                Image(systemName: "clock")
                    .font(.caption)
                Text("\(targetMinutes) min/day")
                    .font(.caption)

                Spacer()

                // Progress would be calculated from pomodoros
                Text("Today: 0/\(targetMinutes) min")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }

    @ViewBuilder
    private var oneTimeTaskInfo: some View {
        VStack(spacing: 8) {
            if let deadline = task.deadline {
                HStack {
                    Image(systemName: "calendar")
                        .font(.caption)
                    Text("Due: \(deadline.formatted(date: .abbreviated, time: .omitted))")
                        .font(.caption)

                    Spacer()

                    let daysRemaining = Calendar.current.dateComponents([.day], from: Date(), to: deadline).day ?? 0
                    Text("\(daysRemaining) days left")
                        .font(.caption)
                        .foregroundStyle(daysRemaining < 7 ? .red : .secondary)
                }
            }

            if let estimatedMinutes = task.estimatedMinutes {
                HStack {
                    Image(systemName: "hourglass")
                        .font(.caption)
                    Text("Estimated: \(estimatedMinutes) min")
                        .font(.caption)

                    Spacer()

                    // Progress would be calculated from pomodoros
                    Text("Spent: 0 min")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }
}
