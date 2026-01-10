//
//  SignInView.swift
//  Revelation
//
//  Created on 2026-01-08.
//

import SwiftUI

struct SignInView: View {
    @EnvironmentObject var authService: AuthService
    @Binding var isSignUp: Bool

    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        VStack(spacing: 20) {
            Text("Sign In")
                .font(.title2.bold())
                .foregroundStyle(.white)

            VStack(spacing: 16) {
                TextField("Email", text: $email)
                    .textInputAutocapitalization(.never)
                    .keyboardType(.emailAddress)
                    .autocorrectionDisabled()
                    .padding()
                    .background(.white.opacity(0.9))
                    .cornerRadius(12)

                SecureField("Password", text: $password)
                    .padding()
                    .background(.white.opacity(0.9))
                    .cornerRadius(12)
            }

            if let errorMessage {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundStyle(.red)
                    .padding(.horizontal)
            }

            Button {
                Task {
                    await signIn()
                }
            } label: {
                if isLoading {
                    ProgressView()
                        .tint(.white)
                } else {
                    Text("Sign In")
                        .font(.headline)
                        .foregroundStyle(.white)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 50)
            .background(isValid ? Color.blue : Color.gray)
            .cornerRadius(12)
            .disabled(!isValid || isLoading)

            Button {
                isSignUp = true
            } label: {
                Text("Don't have an account? Sign Up")
                    .font(.subheadline)
                    .foregroundStyle(.white)
            }
            .padding(.top, 8)
        }
        .padding(.horizontal, 24)
    }

    private var isValid: Bool {
        !email.isEmpty && !password.isEmpty && password.count >= 6
    }

    private func signIn() async {
        isLoading = true
        errorMessage = nil

        do {
            try await authService.signIn(email: email, password: password)
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}

#Preview {
    SignInView(isSignUp: .constant(false))
        .environmentObject(AuthService.shared)
}
