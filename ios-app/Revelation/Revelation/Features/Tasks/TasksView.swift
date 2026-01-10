//
//  TasksView.swift
//  Revelation
//
//  Created on 2026-01-08.
//

import SwiftUI

struct TasksView: View {
    @EnvironmentObject var authService: AuthService
    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel = TasksViewModel()
    @State private var selectedTaskType: TaskType = .daily
    @State private var showingAddTask = false
    @State private var selectedTask: Task?

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Task type picker
                Picker("Task Type", selection: $selectedTaskType) {
                    Text("Daily").tag(TaskType.daily)
                    Text("One-Time").tag(TaskType.oneTime)
                }
                .pickerStyle(.segmented)
                .padding()

                // Task list
                if viewModel.isLoading {
                    ProgressView()
                        .frame(maxHeight: .infinity)
                } else {
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(filteredTasks) { task in
                                TaskCard(task: task) {
                                    selectedTask = task
                                } onStart: {
                                    startPomodoro(for: task)
                                }
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Tasks")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showingAddTask = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingAddTask) {
                TaskEditView(taskType: selectedTaskType) { task in
                    Task {
                        await viewModel.saveTask(task)
                        showingAddTask = false
                    }
                }
            }
            .sheet(item: $selectedTask) { task in
                TaskEditView(existingTask: task, taskType: task.taskType) { updatedTask in
                    Task {
                        await viewModel.saveTask(updatedTask)
                        selectedTask = nil
                    }
                }
            }
            .task {
                await viewModel.loadTasks(userId: authService.currentUser?.id ?? UUID())
            }
        }
    }

    private var filteredTasks: [Task] {
        viewModel.tasks.filter { $0.taskType == selectedTaskType }
    }

    private func startPomodoro(for task: Task) {
        // This will be implemented with PomodoroView
        print("Start pomodoro for task: \(task.title)")
    }
}

#Preview {
    TasksView()
        .environmentObject(AuthService.shared)
        .environmentObject(AppState())
}
