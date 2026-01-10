//
//  CalendarView.swift
//  Revelation
//
//  Created on 2026-01-08.
//

import SwiftUI

struct CalendarView: View {
    @EnvironmentObject var authService: AuthService
    @StateObject private var pomodoroRepository = PomodoroRepository()
    @State private var selectedDate = Date()
    @State private var pomodoros: [Pomodoro] = []
    @State private var currentMonth = Date()

    private let calendar = Calendar.current
    private let columns = Array(repeating: GridItem(.flexible()), count: 7)

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Month navigation
                HStack {
                    Button {
                        changeMonth(by: -1)
                    } label: {
                        Image(systemName: "chevron.left")
                            .font(.title3)
                    }

                    Spacer()

                    Text(currentMonth.formatted(.dateTime.month(.wide).year()))
                        .font(.title2.bold())

                    Spacer()

                    Button {
                        changeMonth(by: 1)
                    } label: {
                        Image(systemName: "chevron.right")
                            .font(.title3)
                    }
                }
                .padding()

                // Weekday headers
                LazyVGrid(columns: columns, spacing: 8) {
                    ForEach(calendar.shortWeekdaySymbols, id: \.self) { day in
                        Text(day)
                            .font(.caption.bold())
                            .foregroundStyle(.secondary)
                    }
                }
                .padding(.horizontal)

                Divider()
                    .padding(.vertical, 8)

                // Calendar grid
                ScrollView {
                    LazyVGrid(columns: columns, spacing: 12) {
                        ForEach(daysInMonth, id: \.self) { date in
                            if let date {
                                DayCell(date: date, isSelected: calendar.isDate(date, inSameDayAs: selectedDate)) {
                                    selectedDate = date
                                    Task {
                                        await loadPomodoros(for: date)
                                    }
                                }
                            } else {
                                Color.clear
                            }
                        }
                    }
                    .padding()

                    // Pomodoros for selected date
                    if !pomodoros.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Pomodoros on \(selectedDate.formatted(date: .abbreviated, time: .omitted))")
                                .font(.headline)
                                .padding(.horizontal)

                            ForEach(pomodoros) { pomodoro in
                                PomodoroHistoryCard(pomodoro: pomodoro)
                            }
                            .padding(.horizontal)
                        }
                        .padding(.vertical)
                    }
                }
            }
            .navigationTitle("Calendar")
        }
    }

    private var daysInMonth: [Date?] {
        guard let monthInterval = calendar.dateInterval(of: .month, for: currentMonth),
              let monthFirstWeek = calendar.dateInterval(of: .weekOfMonth, for: monthInterval.start) else {
            return []
        }

        let days = calendar.generateDates(
            inside: monthInterval,
            matching: DateComponents(hour: 0, minute: 0, second: 0)
        )

        // Pad with nil for leading empty cells
        let firstDayWeekday = calendar.component(.weekday, from: monthInterval.start)
        let leadingEmptyDays = Array(repeating: nil as Date?, count: firstDayWeekday - 1)

        return leadingEmptyDays + days.map { $0 as Date? }
    }

    private func changeMonth(by value: Int) {
        if let newMonth = calendar.date(byAdding: .month, value: value, to: currentMonth) {
            currentMonth = newMonth
        }
    }

    private func loadPomodoros(for date: Date) async {
        guard let userId = authService.currentUser?.id else { return }

        let startOfDay = calendar.startOfDay(for: date)
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay) ?? date

        do {
            pomodoros = try await pomodoroRepository.fetchPomodoros(
                userId: userId,
                startDate: startOfDay,
                endDate: endOfDay
            )
        } catch {
            print("Error loading pomodoros: \(error)")
        }
    }
}

struct DayCell: View {
    let date: Date
    let isSelected: Bool
    let onTap: () -> Void

    private let calendar = Calendar.current

    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 4) {
                Text("\(calendar.component(.day, from: date))")
                    .font(.body)
                    .foregroundStyle(isToday ? .white : (isSelected ? .primary : .primary))

                // Placeholder for completion indicator
                Circle()
                    .fill(Color.green.opacity(0.3))
                    .frame(width: 4, height: 4)
                    .opacity(0) // Hidden for now - would show if has pomodoros
            }
            .frame(height: 44)
            .frame(maxWidth: .infinity)
            .background(backgroundColor)
            .cornerRadius(8)
        }
    }

    private var isToday: Bool {
        calendar.isDateInToday(date)
    }

    private var backgroundColor: Color {
        if isToday {
            return .blue
        } else if isSelected {
            return .blue.opacity(0.2)
        } else {
            return .clear
        }
    }
}

struct PomodoroHistoryCard: View {
    let pomodoro: Pomodoro

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("\(pomodoro.effectiveDuration / 60) minutes")
                    .font(.headline)

                if let accomplishment = pomodoro.accomplishment {
                    Text(accomplishment)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }
            }

            Spacer()

            if let rating = pomodoro.focusRating {
                HStack(spacing: 2) {
                    ForEach(1...5, id: \.self) { star in
                        Image(systemName: star <= rating ? "star.fill" : "star")
                            .font(.caption)
                            .foregroundStyle(.yellow)
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }
}

// Helper extension
extension Calendar {
    func generateDates(
        inside interval: DateInterval,
        matching components: DateComponents
    ) -> [Date] {
        var dates: [Date] = []
        dates.append(interval.start)

        enumerateDates(
            startingAfter: interval.start,
            matching: components,
            matchingPolicy: .nextTime
        ) { date, _, stop in
            if let date = date {
                if date < interval.end {
                    dates.append(date)
                } else {
                    stop = true
                }
            }
        }

        return dates
    }
}

#Preview {
    CalendarView()
        .environmentObject(AuthService.shared)
}
