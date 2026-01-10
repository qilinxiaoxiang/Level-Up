//
//  GoalsView.swift
//  Revelation
//
//  Created on 2026-01-08.
//

import SwiftUI

struct GoalsView: View {
    @EnvironmentObject var authService: AuthService
    @StateObject private var viewModel = GoalsViewModel()
    @State private var showingEditSheet = false
    @State private var selectedGoalType: GoalType?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    if viewModel.isLoading {
                        ProgressView()
                            .padding()
                    } else if viewModel.goals.isEmpty {
                        emptyState
                    } else {
                        ForEach(GoalType.allCases, id: \.self) { type in
                            if let goal = viewModel.goals.first(where: { $0.type == type }) {
                                GoalCard(goal: goal) {
                                    selectedGoalType = type
                                    showingEditSheet = true
                                }
                            } else {
                                AddGoalCard(type: type) {
                                    selectedGoalType = type
                                    showingEditSheet = true
                                }
                            }
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("Goals")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task {
                            await authService.signOut()
                        }
                    } label: {
                        Image(systemName: "rectangle.portrait.and.arrow.right")
                    }
                }
            }
            .sheet(isPresented: $showingEditSheet) {
                if let goalType = selectedGoalType {
                    GoalEditView(
                        goalType: goalType,
                        existingGoal: viewModel.goals.first(where: { $0.type == goalType })
                    ) { updatedGoal in
                        Task {
                            await viewModel.saveGoal(updatedGoal)
                            showingEditSheet = false
                        }
                    }
                }
            }
            .task {
                await viewModel.loadGoals(userId: authService.currentUser?.id ?? UUID())
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "target")
                .font(.system(size: 64))
                .foregroundStyle(.gray)

            Text("No Goals Set")
                .font(.title2.bold())

            Text("Set your 3-tier goals to start your productivity journey")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            Button("Set Goals") {
                selectedGoalType = .threeYear
                showingEditSheet = true
            }
            .buttonStyle(.borderedProminent)
            .padding(.top)
        }
        .padding()
    }
}

#Preview {
    GoalsView()
        .environmentObject(AuthService.shared)
}
