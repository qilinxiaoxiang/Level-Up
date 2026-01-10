//
//  SupabaseClient.swift
//  Revelation
//
//  Created on 2026-01-08.
//

import Foundation
import Supabase

class SupabaseClient {
    static let shared = SupabaseClient()

    let client: SupabaseClient

    private init() {
        // Read from environment or configuration
        guard let supabaseURL = ProcessInfo.processInfo.environment["SUPABASE_URL"],
              let supabaseKey = ProcessInfo.processInfo.environment["SUPABASE_ANON_KEY"],
              let url = URL(string: supabaseURL) else {
            fatalError("Supabase configuration not found. Please set SUPABASE_URL and SUPABASE_ANON_KEY.")
        }

        client = SupabaseClient(
            supabaseURL: url,
            supabaseKey: supabaseKey
        )
    }

    // Convenience accessors
    var auth: AuthClient {
        client.auth
    }

    var database: PostgrestClient {
        client.database
    }

    var realtime: RealtimeClient {
        client.realtime
    }
}
