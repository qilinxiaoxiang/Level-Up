//
//  AuthView.swift
//  Revelation
//
//  Created on 2026-01-08.
//

import SwiftUI

struct AuthView: View {
    @EnvironmentObject var authService: AuthService
    @State private var isSignUp = false

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color.blue.opacity(0.6), Color.purple.opacity(0.6)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: 40) {
                // Logo and title
                VStack(spacing: 16) {
                    Image(systemName: "sparkles")
                        .font(.system(size: 72))
                        .foregroundStyle(.white)

                    Text("Revelation")
                        .font(.system(size: 48, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)

                    Text("Gamified Productivity RPG")
                        .font(.subheadline)
                        .foregroundStyle(.white.opacity(0.9))
                }
                .padding(.top, 60)

                Spacer()

                // Auth form
                if isSignUp {
                    SignUpView(isSignUp: $isSignUp)
                } else {
                    SignInView(isSignUp: $isSignUp)
                }

                Spacer()
            }
            .padding()
        }
    }
}

#Preview {
    AuthView()
        .environmentObject(AuthService.shared)
}
