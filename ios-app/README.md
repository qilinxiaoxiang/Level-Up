# Revelation iOS App

⚠️ **IMPORTANT: iOS app has been moved to a new location!**

## New Location

The iOS app source files are now located at:

```
~/code/revelation/
```

This was necessary to avoid conflicts when creating the Xcode project.

## Quick Links

- **Start Here**: `~/code/revelation/QUICKSTART.md`
- **Setup Guide**: `~/code/revelation/SETUP.md`
- **Project Info**: `~/code/revelation/README.md`
- **Roadmap**: `~/code/revelation/IOS_CONVERSION_PLAN.md`

## What's in the New Location

All Swift source files have been moved to `~/code/revelation/`:
- ✅ App/ - Application entry point
- ✅ Core/ - Models, Services, Supabase client
- ✅ Features/ - Auth, Goals, Tasks, Calendar, Dashboard, Pomodoro
- ✅ UI/ - Reusable SwiftUI components
- ✅ All documentation files

## Next Steps

1. Navigate to: `cd ~/code/revelation/`
2. Read: `QUICKSTART.md` for Xcode project creation
3. Follow the step-by-step guide to create your Xcode project

---

Native iOS application for the Revelation productivity RPG, built with SwiftUI and sharing the same Supabase backend as the web app.

## 📱 What's Been Implemented

### ✅ Core Infrastructure (Phase 1)
- **Project Structure**: Clean, feature-based architecture
- **Swift Package Manager**: Dependency management with Supabase Swift SDK
- **Data Models**: All models matching the database schema
  - `UserProfile`, `Goal`, `Task`, `Pomodoro`, `ActivePomodoro`
  - Proper Codable conformance with snake_case mapping
- **Repository Layer**: Data access abstraction
  - `GoalRepository`, `TaskRepository`, `PomodoroRepository`
  - Type-safe database operations
- **Supabase Integration**: Authentication and database client

### ✅ Authentication (Phase 2)
- Sign up and sign in views
- Email/password authentication
- Session management
- Error handling

### ✅ Main Features (Phase 2)
- **Tab Navigation**: Dashboard, Goals, Tasks, Calendar
- **Goals Management**:
  - View 3-tier goals (3-year, 1-year, 1-month)
  - Create and edit goals
  - Time remaining countdown
  - Color-coded goal cards
- **Tasks Management**:
  - List view with filters (daily vs one-time)
  - Task creation and editing
  - Priority badges
  - Target time for daily tasks
  - Deadline and estimates for one-time tasks
- **Dashboard**:
  - Statistics (Today, Week, All Time)
  - Streak information
  - Rest credits display
- **Calendar**:
  - Month navigation
  - Day selection
  - Pomodoro history view
- **Pomodoro Timer** (basic):
  - Duration selection
  - Timer display
  - Start/pause/complete functionality
  - Placeholder for full implementation

## 📂 Project Structure

```
ios-app/
├── README.md                              # This file
├── SETUP.md                               # Xcode setup instructions
├── Package.swift                          # Swift package dependencies
└── Revelation/
    └── Revelation/
        ├── App/                           # App configuration
        │   ├── RevelationApp.swift       # Main app entry point
        │   ├── AppState.swift            # Global app state
        │   └── MainTabView.swift         # Tab navigation
        ├── Features/                      # Feature modules
        │   ├── Auth/                     # Authentication
        │   │   ├── AuthView.swift
        │   │   ├── SignInView.swift
        │   │   └── SignUpView.swift
        │   ├── Goals/                    # Goal management
        │   │   ├── GoalsView.swift
        │   │   ├── GoalsViewModel.swift
        │   │   ├── GoalCard.swift
        │   │   └── GoalEditView.swift
        │   ├── Tasks/                    # Task management
        │   │   ├── TasksView.swift
        │   │   ├── TasksViewModel.swift
        │   │   ├── TaskCard.swift
        │   │   └── TaskEditView.swift
        │   ├── Dashboard/                # Statistics dashboard
        │   │   └── DashboardView.swift
        │   ├── Calendar/                 # Check-in calendar
        │   │   └── CalendarView.swift
        │   └── Pomodoro/                 # Timer (basic)
        │       └── PomodoroView.swift
        └── Core/                         # Shared utilities
            ├── Models/                   # Data models
            │   ├── UserProfile.swift
            │   ├── Goal.swift
            │   ├── Task.swift
            │   └── Pomodoro.swift
            ├── Services/                 # Business logic
            │   ├── AuthService.swift
            │   ├── GoalRepository.swift
            │   ├── TaskRepository.swift
            │   └── PomodoroRepository.swift
            └── Supabase/                 # Supabase config
                ├── SupabaseClient.swift
                └── Config.swift
```

## 🚀 Getting Started

1. **Read the setup guide**: `SETUP.md` contains detailed Xcode project setup instructions
2. **Review the plan**: `../IOS_CONVERSION_PLAN.md` has the complete development roadmap
3. **Configure Supabase**: You'll need the same Supabase credentials as the web app
4. **Build and run**: Follow the setup guide to build in Xcode

## ⚠️ Important Notes

### Known Issues to Fix

1. **SupabaseClient Naming Conflict**:
   - The custom `SupabaseClient` class conflicts with Supabase SDK's `SupabaseClient`
   - **Fix**: Rename to `SupabaseManager` or use fully qualified names

2. **API Compatibility**:
   - Some Supabase Swift SDK APIs may differ from the implementation
   - **Fix**: Refer to official Supabase Swift documentation for correct usage

3. **Missing Xcode Project File**:
   - Swift files are created but need to be added to an Xcode project
   - **Fix**: Create Xcode project and import files (see SETUP.md)

### What Still Needs Implementation

#### High Priority
- [ ] Fix SupabaseClient naming conflict
- [ ] Create actual Xcode project file (.xcodeproj)
- [ ] Test and fix Supabase API calls
- [ ] Implement real-time subscriptions
- [ ] Complete Pomodoro timer with:
  - Background execution
  - Local notifications
  - Timer state persistence

#### Medium Priority
- [ ] Offline support with local caching
- [ ] Pull-to-refresh on list views
- [ ] Loading states and error handling
- [ ] Task progress calculation from pomodoros
- [ ] Streak calculation logic
- [ ] Real day cut time handling

#### Low Priority (iOS-Specific)
- [ ] Lock screen widgets
- [ ] Home screen widgets
- [ ] Live Activities for Pomodoro
- [ ] Siri shortcuts
- [ ] Haptic feedback
- [ ] Dark mode support
- [ ] iPad optimization
- [ ] Apple Watch companion app

## 🔧 Development Workflow

### Making Changes

1. Edit Swift files in the directory structure
2. Build in Xcode to check for errors
3. Test on simulator or device
4. Commit changes to git

### Adding New Features

1. Create new files in appropriate feature directory
2. Add to Xcode project
3. Update view models and repositories as needed
4. Test thoroughly before committing

### Database Changes

⚠️ **Important**: iOS app shares the database with the web app!

- Make schema changes in `../database/schema.sql`
- Follow the database migration process in main README
- Update Swift models to match new schema
- Test on both web and iOS

## 📚 Resources

### Apple Documentation
- [SwiftUI Documentation](https://developer.apple.com/documentation/swiftui)
- [Combine Framework](https://developer.apple.com/documentation/combine)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

### Supabase
- [Supabase Swift SDK](https://github.com/supabase/supabase-swift)
- [Supabase Documentation](https://supabase.com/docs)

### Project Documentation
- Main README: `../README.md`
- iOS Setup: `SETUP.md`
- Development Plan: `../IOS_CONVERSION_PLAN.md`

## 🎯 Next Steps

1. **Create Xcode Project**: Follow `SETUP.md` to set up the Xcode project
2. **Fix Known Issues**: Address naming conflicts and API compatibility
3. **Test Core Features**: Verify authentication, goals, and tasks work
4. **Implement Pomodoro**: Complete the timer with background support
5. **Add Real-Time Sync**: Subscribe to database changes
6. **Build Widgets**: Create iOS-specific features
7. **Beta Testing**: Use TestFlight for user testing
8. **App Store**: Submit for review and launch

---

**Status**: Phase 1 & 2 Complete - Ready for Xcode project creation and testing!
