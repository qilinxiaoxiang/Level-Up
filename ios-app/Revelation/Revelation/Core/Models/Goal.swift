//
//  Goal.swift
//  Revelation
//
//  Created on 2026-01-08.
//

import Foundation

struct Goal: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    let type: GoalType
    var description: String
    let targetDate: Date
    let createdAt: Date
    let updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case type
        case description
        case targetDate = "target_date"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    var timeRemaining: DateComponents {
        Calendar.current.dateComponents(
            [.year, .month, .day, .hour],
            from: Date(),
            to: targetDate
        )
    }
}

enum GoalType: String, Codable, CaseIterable {
    case threeYear = "3_year"
    case oneYear = "1_year"
    case oneMonth = "1_month"

    var displayName: String {
        switch self {
        case .threeYear: return "3-Year Goal"
        case .oneYear: return "1-Year Goal"
        case .oneMonth: return "1-Month Goal"
        }
    }

    var durationInMonths: Int {
        switch self {
        case .threeYear: return 36
        case .oneYear: return 12
        case .oneMonth: return 1
        }
    }
}
