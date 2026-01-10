//
//  UserProfile.swift
//  Revelation
//
//  Created on 2026-01-08.
//

import Foundation

struct UserProfile: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    var dayPreference: String
    var customDayCutHour: Int?
    var customDayCutMinute: Int?
    var timezone: String?
    var currentStreak: Int
    var longestStreak: Int
    var restCredits: Int
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case dayPreference = "day_preference"
        case customDayCutHour = "custom_day_cut_hour"
        case customDayCutMinute = "custom_day_cut_minute"
        case timezone
        case currentStreak = "current_streak"
        case longestStreak = "longest_streak"
        case restCredits = "rest_credits"
        case createdAt = "created_at"
    }

    var dayCutTime: (hour: Int, minute: Int) {
        (customDayCutHour ?? 0, customDayCutMinute ?? 0)
    }
}
