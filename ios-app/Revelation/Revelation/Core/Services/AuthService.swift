//
//  AuthService.swift
//  Revelation
//
//  Created on 2026-01-08.
//

import Foundation
import SwiftUI
import Supabase

@MainActor
class AuthService: ObservableObject {
    static let shared = AuthService()

    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var userProfile: UserProfile?

    private let supabase = SupabaseClient.shared
    private var authStateTask: Task<Void, Never>?

    private init() {
        // Listen for auth state changes
        authStateTask = Task {
            for await state in supabase.client.auth.authStateChanges {
                await handleAuthStateChange(state)
            }
        }
    }

    deinit {
        authStateTask?.cancel()
    }

    private func handleAuthStateChange(_ state: AuthChangeEvent) async {
        switch state {
        case .signedIn:
            currentUser = try? await supabase.client.auth.session.user
            isAuthenticated = currentUser != nil
            if isAuthenticated {
                await fetchUserProfile()
            }
        case .signedOut:
            currentUser = nil
            userProfile = nil
            isAuthenticated = false
        default:
            break
        }
    }

    func signUp(email: String, password: String) async throws {
        try await supabase.client.auth.signUp(email: email, password: password)
    }

    func signIn(email: String, password: String) async throws {
        try await supabase.client.auth.signIn(email: email, password: password)
    }

    func signOut() async throws {
        try await supabase.client.auth.signOut()
    }

    func fetchUserProfile() async {
        guard let userId = currentUser?.id else { return }

        do {
            let response: [UserProfile] = try await supabase.client
                .from("user_profiles")
                .select()
                .eq("user_id", value: userId)
                .limit(1)
                .execute()
                .value

            userProfile = response.first
        } catch {
            print("Error fetching user profile: \(error)")
        }
    }

    func updateUserProfile(_ profile: UserProfile) async throws {
        try await supabase.client
            .from("user_profiles")
            .update(profile)
            .eq("id", value: profile.id)
            .execute()

        await fetchUserProfile()
    }
}
