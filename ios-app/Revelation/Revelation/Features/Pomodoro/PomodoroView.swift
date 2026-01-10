//
//  PomodoroView.swift
//  Revelation
//
//  Created on 2026-01-08.
//
//  Note: This is a placeholder implementation. Full Pomodoro timer with
//  background execution, notifications, and pause tracking to be implemented.
//

import SwiftUI

struct PomodoroView: View {
    @EnvironmentObject var authService: AuthService
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel: PomodoroViewModel

    let task: Task?

    init(task: Task? = nil) {
        self.task = task
        self._viewModel = StateObject(wrappedValue: PomodoroViewModel(task: task))
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 32) {
                // Task info
                if let task {
                    VStack(spacing: 8) {
                        Text(task.title)
                            .font(.title2.bold())

                        if let description = task.description {
                            Text(description)
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                                .multilineTextAlignment(.center)
                        }
                    }
                    .padding()
                }

                // Duration selection or timer display
                if viewModel.activePomodoro == nil {
                    durationSelection
                } else {
                    timerDisplay
                }

                Spacer()

                // Action buttons
                actionButtons
            }
            .padding()
            .navigationTitle("Pomodoro")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }

    private var durationSelection: some View {
        VStack(spacing: 16) {
            Text("Select Duration")
                .font(.headline)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                ForEach([15, 25, 45, 60], id: \.self) { minutes in
                    Button {
                        viewModel.selectedDuration = minutes
                    } label: {
                        Text("\(minutes) min")
                            .font(.headline)
                            .foregroundStyle(viewModel.selectedDuration == minutes ? .white : .primary)
                            .frame(maxWidth: .infinity)
                            .frame(height: 60)
                            .background(viewModel.selectedDuration == minutes ? Color.blue : Color(.secondarySystemBackground))
                            .cornerRadius(12)
                    }
                }
            }
        }
    }

    private var timerDisplay: some View {
        VStack(spacing: 24) {
            // Large timer display
            Text(viewModel.formattedTime)
                .font(.system(size: 72, weight: .bold, design: .rounded))
                .monospacedDigit()

            // Progress ring (placeholder)
            Circle()
                .stroke(Color.gray.opacity(0.2), lineWidth: 20)
                .frame(width: 200, height: 200)
                .overlay(
                    Circle()
                        .trim(from: 0, to: viewModel.progress)
                        .stroke(Color.blue, style: StrokeStyle(lineWidth: 20, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                        .frame(width: 200, height: 200)
                )
        }
    }

    private var actionButtons: some View {
        VStack(spacing: 16) {
            if viewModel.activePomodoro == nil {
                Button {
                    Task {
                        await viewModel.startPomodoro(
                            userId: authService.currentUser?.id ?? UUID()
                        )
                    }
                } label: {
                    Label("Start", systemImage: "play.fill")
                        .font(.headline)
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(Color.blue)
                        .cornerRadius(16)
                }
                .disabled(viewModel.selectedDuration == 0)
            } else {
                HStack(spacing: 12) {
                    Button {
                        viewModel.togglePause()
                    } label: {
                        Label(
                            viewModel.isPaused ? "Resume" : "Pause",
                            systemImage: viewModel.isPaused ? "play.fill" : "pause.fill"
                        )
                        .font(.headline)
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(Color.orange)
                        .cornerRadius(16)
                    }

                    Button {
                        Task {
                            await viewModel.completePomodoro(
                                userId: authService.currentUser?.id ?? UUID()
                            )
                            dismiss()
                        }
                    } label: {
                        Label("Complete", systemImage: "checkmark")
                            .font(.headline)
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 56)
                            .background(Color.green)
                            .cornerRadius(16)
                    }
                }
            }
        }
    }
}

@MainActor
class PomodoroViewModel: ObservableObject {
    @Published var selectedDuration = 25
    @Published var activePomodoro: ActivePomodoro?
    @Published var elapsedTime: TimeInterval = 0
    @Published var isPaused = false

    private let task: Task?
    private let repository = PomodoroRepository()
    private var timer: Timer?

    init(task: Task?) {
        self.task = task
    }

    var formattedTime: String {
        let totalSeconds = max(0, Double(selectedDuration * 60) - elapsedTime)
        let minutes = Int(totalSeconds) / 60
        let seconds = Int(totalSeconds) % 60
        return String(format: "%02d:%02d", minutes, seconds)
    }

    var progress: CGFloat {
        let totalSeconds = Double(selectedDuration * 60)
        return CGFloat(elapsedTime / totalSeconds)
    }

    func startPomodoro(userId: UUID) async {
        do {
            activePomodoro = try await repository.createActivePomodoro(
                taskId: task?.id,
                plannedDuration: selectedDuration * 60,
                userId: userId
            )

            startTimer()
        } catch {
            print("Error starting pomodoro: \(error)")
        }
    }

    func togglePause() {
        isPaused.toggle()

        if isPaused {
            timer?.invalidate()
        } else {
            startTimer()
        }
    }

    func completePomodoro(userId: UUID) async {
        timer?.invalidate()

        guard let active = activePomodoro else { return }

        let pomodoro = Pomodoro(
            id: UUID(),
            userId: userId,
            taskId: active.taskId,
            duration: active.plannedDuration,
            actualDuration: Int(elapsedTime),
            focusRating: nil,
            accomplishment: nil,
            completedAt: Date(),
            startedAt: active.startTime,
            wasManual: false,
            overtimeMinutes: nil,
            pausePeriods: active.pausePeriods
        )

        do {
            _ = try await repository.createPomodoro(pomodoro)
            try await repository.deleteActivePomodoro(id: active.id)
        } catch {
            print("Error completing pomodoro: \(error)")
        }
    }

    private func startTimer() {
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            self?.elapsedTime += 1
        }
    }
}

#Preview {
    PomodoroView(task: nil)
        .environmentObject(AuthService.shared)
}
