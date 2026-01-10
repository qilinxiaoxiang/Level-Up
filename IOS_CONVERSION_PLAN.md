# iOS App Conversion Plan - Revelation

## Overview
Plan for converting Revelation (gamified productivity RPG) into a native iOS application while maintaining the existing web frontend.

## Project Goals
- Create a native iOS experience with full feature parity
- Reuse existing Supabase backend infrastructure
- Maintain consistent user experience across web and iOS
- Leverage iOS-specific capabilities (notifications, widgets, Siri shortcuts)

---

## Technology Stack Decision

### Option 1: Native Swift/SwiftUI (Recommended)
**Pros:**
- Best performance and native feel
- Full access to iOS APIs and features
- SwiftUI aligns well with React's declarative approach
- Better long-term maintainability for iOS-specific features
- Native widgets, live activities, and system integrations

**Cons:**
- Complete rewrite required
- Different language/paradigm from web frontend
- Steeper learning curve if unfamiliar with Swift

### Option 2: React Native
**Pros:**
- Reuse React knowledge and some component logic
- Shared business logic between web and mobile
- Large ecosystem of libraries
- Faster initial development

**Cons:**
- Additional bridge overhead
- Some native features require custom modules
- Less "native" feel compared to SwiftUI
- Another framework to maintain

### Option 3: Capacitor (Web-to-Native Wrapper)
**Pros:**
- Minimal code changes - wrap existing web app
- Fastest time to App Store
- Single codebase for web and mobile

**Cons:**
- Performance limitations
- Limited access to native iOS features
- Less polished user experience
- May not meet App Store quality standards

**Recommendation:** Swift/SwiftUI for best user experience and iOS ecosystem integration.

---

## Architecture

### Backend & Database
- **Continue using Supabase** - Already has excellent iOS SDK
- No backend changes required
- Authentication via Supabase Auth (supports Apple Sign In)
- Real-time subscriptions work on iOS
- Row Level Security policies remain unchanged

### Project Structure
```
Level-Up/
├── frontend/              # Existing React web app (unchanged)
├── ios-app/              # New iOS application
│   ├── Revelation/       # Xcode project
│   │   ├── App/          # App entry point & configuration
│   │   ├── Features/     # Feature modules
│   │   │   ├── Auth/
│   │   │   ├── Goals/
│   │   │   ├── Tasks/
│   │   │   ├── Pomodoro/
│   │   │   └── Calendar/
│   │   ├── Core/         # Shared utilities
│   │   │   ├── Supabase/ # Supabase client
│   │   │   ├── Models/   # Data models
│   │   │   ├── Services/ # Business logic
│   │   │   └── Extensions/
│   │   ├── UI/           # Reusable UI components
│   │   └── Resources/    # Assets, fonts, etc.
│   └── RevelationWidget/ # iOS widget extension
└── database/             # Shared schema (unchanged)
```

### State Management
- **SwiftUI + Combine** for reactive data flow
- `@Observable` macro for view models (iOS 17+)
- `@State`, `@StateObject`, `@EnvironmentObject` for view state
- Repository pattern for data access layer

---

## Feature Implementation Plan

### Phase 1: Core Infrastructure
1. **Project Setup**
   - Create Xcode project with SwiftUI
   - Set up Supabase iOS SDK
   - Configure development certificates & provisioning profiles
   - Set up App Groups for widget/extension sharing

2. **Supabase Integration**
   - Initialize Supabase client
   - Implement authentication flow (email/password + Apple Sign In)
   - Create data models matching database schema
   - Implement repository layer for database operations

3. **Navigation & App Structure**
   - Tab-based navigation (Dashboard, Goals, Tasks, Calendar)
   - Protected route handling (auth state)
   - Deep linking support

### Phase 2: Core Features
1. **Authentication**
   - Sign up / Sign in screens
   - Apple Sign In integration
   - Biometric authentication (Face ID/Touch ID)
   - Session persistence

2. **Goal Management**
   - Goal setup flow (first-time users)
   - 3-tier goal display (3-year, 1-year, 1-month)
   - Goal editing
   - Countdown timers

3. **Task Management**
   - Daily recurring task list
   - One-time task list with burn-down charts
   - Task creation/editing forms
   - Task archiving
   - Progress bars and freshness indicators
   - Task linking (one-time ↔ daily)

4. **Pomodoro System**
   - Timer selection (15, 25, 45, 60, custom)
   - Running timer view with pause/resume
   - Overtime tracking
   - Background timer support (notifications)
   - Focus rating & accomplishment logging
   - Time calculation (original vs extended duration)

5. **Progress Tracking**
   - Real-time statistics (Today, Week, Total)
   - Streak tracking
   - Rest credits system
   - Check-in calendar with month navigation
   - Date-specific pomodoro history

### Phase 3: iOS-Specific Enhancements
1. **Notifications**
   - Pomodoro completion alerts
   - Daily reminder notifications
   - Streak at risk warnings
   - Custom notification sounds

2. **Widgets**
   - Lock screen widget (current streak, today's progress)
   - Home screen widget (active timer, daily tasks)
   - Live Activities for running Pomodoros (iOS 16.1+)

3. **App Shortcuts**
   - Siri shortcuts for starting Pomodoros
   - Quick actions for common tasks

4. **Background Modes**
   - Background timer continuation
   - Background fetch for syncing data
   - Silent push notifications

5. **Apple Watch Companion** (Future)
   - View current task
   - Control Pomodoro timer
   - Quick glance at streak

### Phase 4: Polish & Optimization
1. **Offline Support**
   - Local data caching (Core Data or SwiftData)
   - Queue operations when offline
   - Sync when connection restored

2. **Performance**
   - Lazy loading for large lists
   - Image caching
   - Optimize database queries

3. **Accessibility**
   - VoiceOver support
   - Dynamic Type support
   - High contrast mode
   - Reduced motion support

4. **App Store Preparation**
   - App icon and screenshots
   - Privacy policy
   - App Store description
   - TestFlight beta testing

---

## Data Models

### Swift Models (Mirror Database Schema)

```swift
struct UserProfile: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    var dayPreference: String
    var customDayCutHour: Int?
    var customDayCutMinute: Int?
    var timezone: String?
    var currentStreak: Int
    var longestStreak: Int
    var restCredits: Int
    let createdAt: Date
}

struct Goal: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    let type: GoalType // "3_year", "1_year", "1_month"
    var description: String
    let targetDate: Date
    let createdAt: Date
    let updatedAt: Date
}

struct Task: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    var title: String
    var description: String?
    var taskType: TaskType // "daily" or "one_time"
    var status: String
    var priority: Int
    var targetMinutesPerDay: Int?
    var estimatedMinutes: Int?
    var deadline: Date?
    var isArchived: Bool
    let createdAt: Date
    let updatedAt: Date
}

struct Pomodoro: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    let taskId: UUID?
    let duration: Int
    let actualDuration: Int?
    let focusRating: Int?
    var accomplishment: String?
    let completedAt: Date
    let startedAt: Date?
    let wasManual: Bool
    let overtimeMinutes: Int?
    let pausePeriods: [PausePeriod]?
}

struct ActivePomodoro: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    let taskId: UUID?
    let plannedDuration: Int
    let startTime: Date
    var pausedAt: Date?
    var totalPausedSeconds: Int
    var pausePeriods: [PausePeriod]?
}

struct PausePeriod: Codable {
    let pausedAt: Date
    let resumedAt: Date?
}
```

---

## Key Technical Considerations

### Timer Implementation
- Use `Timer.publish()` with Combine for reactive timer
- Support background execution with `beginBackgroundTask`
- Local notifications when timer completes
- Handle app lifecycle (foreground/background/terminated)
- Preserve timer state in UserDefaults or local DB

### Real-Time Updates
- Supabase Realtime subscriptions for live data
- Combine publishers for reactive UI updates
- Debouncing for frequent updates

### Day Cut Time Handling
- Use user's timezone for calculations
- Calendar operations for date comparisons
- Background refresh to update "today" status

### Data Sync Strategy
- Pull latest data on app launch
- Real-time subscriptions for active session
- Optimistic updates with rollback on error
- Conflict resolution (last write wins)

### Security
- Keychain for storing Supabase tokens
- Biometric authentication for app access
- Certificate pinning for API requests
- Secure enclave for sensitive data

---

## Development Workflow

### Setup Requirements
- macOS with Xcode 15+
- iOS 17+ target (for latest SwiftUI features)
- Apple Developer Account (for TestFlight & App Store)
- Supabase project (existing)

### Development Phases
1. **Sprint 1-2**: Infrastructure, Auth, Basic Navigation
2. **Sprint 3-4**: Goal & Task Management
3. **Sprint 5-6**: Pomodoro System
4. **Sprint 7-8**: Calendar & Progress Tracking
5. **Sprint 9-10**: iOS-specific features (widgets, notifications)
6. **Sprint 11-12**: Polish, testing, App Store submission

### Testing Strategy
- Unit tests for business logic & data models
- UI tests for critical user flows
- Manual testing on physical devices
- TestFlight beta with small user group
- Accessibility audit

### Deployment
- TestFlight for beta testing
- Staged rollout on App Store
- Crash reporting (e.g., Crashlytics)
- Analytics for user behavior

---

## Migration & Coexistence

### User Perspective
- Same backend data - seamless switching between web and iOS
- Shared authentication (same credentials)
- Real-time sync across platforms
- No data migration needed

### Shared Components
- Database schema (unchanged)
- Supabase backend (unchanged)
- Business logic can be documented/referenced from web app
- Design tokens can be shared (colors, spacing)

### Platform-Specific
- Web: React components, Zustand stores
- iOS: SwiftUI views, ViewModels
- Each maintains its own UI/UX patterns

---

## Risks & Mitigations

### Risk 1: Timer Background Execution
- **Risk**: iOS limits background execution
- **Mitigation**: Use background modes, local notifications, and state restoration

### Risk 2: Supabase SDK Differences
- **Risk**: iOS SDK may have different API than JS SDK
- **Mitigation**: Review Supabase Swift documentation early, create adapter layer if needed

### Risk 3: Development Time
- **Risk**: Full rewrite takes significant time
- **Mitigation**: MVP approach - start with core features, iterate

### Risk 4: App Store Approval
- **Risk**: App could be rejected for policy violations
- **Mitigation**: Follow Human Interface Guidelines, thorough testing, clear privacy policy

### Risk 5: Maintaining Two Codebases
- **Risk**: Features diverge between web and iOS
- **Mitigation**: Shared roadmap, feature parity checklist, coordinated releases

---

## Success Criteria

### MVP (Minimum Viable Product)
- [ ] User authentication (sign up, sign in, sign out)
- [ ] Goal setup and viewing (3-tier system)
- [ ] Create and view daily tasks
- [ ] Create and view one-time tasks
- [ ] Start and complete Pomodoro sessions
- [ ] View today's progress and current streak
- [ ] Basic calendar view

### V1.0 (Feature Complete)
- [ ] All web features implemented
- [ ] iOS widgets (lock screen + home screen)
- [ ] Local notifications
- [ ] Offline support with sync
- [ ] Accessibility compliance
- [ ] App Store approved and published

### V2.0+ (Enhanced)
- [ ] Apple Watch companion app
- [ ] Siri shortcuts
- [ ] Live Activities for Pomodoro
- [ ] Advanced analytics
- [ ] Share/export functionality
- [ ] iPad optimization with multi-window support

---

## Next Steps

1. **Validate Approach**: Review this plan and confirm technology choices
2. **Prototype**: Build a simple Supabase + SwiftUI proof of concept
3. **Design System**: Adapt UI/UX for iOS (mockups/wireframes)
4. **Sprint Planning**: Break down Phase 1 into actionable tasks
5. **Development Setup**: Create Xcode project, configure Supabase SDK
6. **Begin Implementation**: Start with auth and basic navigation

---

## Resources

### Documentation
- [Supabase Swift SDK](https://github.com/supabase/supabase-swift)
- [SwiftUI Documentation](https://developer.apple.com/documentation/swiftui)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

### Similar Apps (for inspiration)
- Structured (task + timer app)
- Streaks (habit tracking)
- Focus (Pomodoro timer)
- Things 3 (task management)

---

**Last Updated**: 2026-01-08
