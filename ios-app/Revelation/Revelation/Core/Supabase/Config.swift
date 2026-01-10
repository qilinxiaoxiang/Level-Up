//
//  Config.swift
//  Revelation
//
//  Created on 2026-01-08.
//

import Foundation

struct Config {
    static var supabaseURL: String {
        guard let url = Bundle.main.infoDictionary?["SUPABASE_URL"] as? String else {
            return ProcessInfo.processInfo.environment["SUPABASE_URL"] ?? ""
        }
        return url
    }

    static var supabaseAnonKey: String {
        guard let key = Bundle.main.infoDictionary?["SUPABASE_ANON_KEY"] as? String else {
            return ProcessInfo.processInfo.environment["SUPABASE_ANON_KEY"] ?? ""
        }
        return key
    }
}
