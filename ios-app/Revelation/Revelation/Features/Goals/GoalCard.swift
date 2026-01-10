//
//  GoalCard.swift
//  Revelation
//
//  Created on 2026-01-08.
//

import SwiftUI

struct GoalCard: View {
    let goal: Goal
    let onEdit: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(goal.type.displayName)
                    .font(.headline)
                    .foregroundStyle(.white)

                Spacer()

                Button(action: onEdit) {
                    Image(systemName: "pencil")
                        .foregroundStyle(.white.opacity(0.8))
                }
            }

            Text(goal.description)
                .font(.body)
                .foregroundStyle(.white.opacity(0.95))
                .lineLimit(3)

            Divider()
                .background(.white.opacity(0.3))

            HStack {
                Image(systemName: "clock")
                    .font(.caption)

                Text(timeRemainingText)
                    .font(.caption)

                Spacer()

                Text("Due: \(formattedDate)")
                    .font(.caption)
            }
            .foregroundStyle(.white.opacity(0.8))
        }
        .padding()
        .background(
            LinearGradient(
                colors: gradientColors,
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(16)
        .shadow(radius: 4)
    }

    private var gradientColors: [Color] {
        switch goal.type {
        case .threeYear:
            return [Color.purple, Color.purple.opacity(0.7)]
        case .oneYear:
            return [Color.blue, Color.blue.opacity(0.7)]
        case .oneMonth:
            return [Color.green, Color.green.opacity(0.7)]
        }
    }

    private var timeRemainingText: String {
        let components = goal.timeRemaining

        if let years = components.year, years > 0 {
            return "\(years)y \(components.month ?? 0)m remaining"
        } else if let months = components.month, months > 0 {
            return "\(months)m \(components.day ?? 0)d remaining"
        } else if let days = components.day, days > 0 {
            return "\(days) days remaining"
        } else {
            return "Due soon!"
        }
    }

    private var formattedDate: String {
        goal.targetDate.formatted(date: .abbreviated, time: .omitted)
    }
}

struct AddGoalCard: View {
    let type: GoalType
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 12) {
                Image(systemName: "plus.circle")
                    .font(.title)

                Text("Set \(type.displayName)")
                    .font(.headline)
            }
            .frame(maxWidth: .infinity)
            .padding(32)
            .foregroundStyle(.gray)
            .background(Color.gray.opacity(0.1))
            .cornerRadius(16)
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color.gray.opacity(0.3), style: StrokeStyle(lineWidth: 2, dash: [8]))
            )
        }
    }
}
