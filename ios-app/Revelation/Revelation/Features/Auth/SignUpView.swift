//
//  SignUpView.swift
//  Revelation
//
//  Created on 2026-01-08.
//

import SwiftUI

struct SignUpView: View {
    @EnvironmentObject var authService: AuthService
    @Binding var isSignUp: Bool

    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        VStack(spacing: 20) {
            Text("Create Account")
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

                SecureField("Confirm Password", text: $confirmPassword)
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
                    await signUp()
                }
            } label: {
                if isLoading {
                    ProgressView()
                        .tint(.white)
                } else {
                    Text("Sign Up")
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
                isSignUp = false
            } label: {
                Text("Already have an account? Sign In")
                    .font(.subheadline)
                    .foregroundStyle(.white)
            }
            .padding(.top, 8)
        }
        .padding(.horizontal, 24)
    }

    private var isValid: Bool {
        !email.isEmpty &&
        !password.isEmpty &&
        password.count >= 6 &&
        password == confirmPassword
    }

    private func signUp() async {
        isLoading = true
        errorMessage = nil

        do {
            try await authService.signUp(email: email, password: password)
            // After successful signup, switch to sign in
            isSignUp = false
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}

#Preview {
    SignUpView(isSignUp: .constant(true))
        .environmentObject(AuthService.shared)
}
