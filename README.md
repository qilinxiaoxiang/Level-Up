# Revelation - Gamified Productivity RPG

A personal productivity application that transforms your daily tasks and goals into an engaging RPG experience. Complete Pomodoro sessions, earn rewards, achieve revelations, and track your progress toward long-term goals.

---

# 🚨 CRITICAL DEVELOPMENT RULES - READ FIRST

## ⚠️ MANDATORY: Git Workflow
**ALWAYS follow these steps after ANY code modification:**

1. **Test your changes** - Verify TypeScript compilation and build
2. **Stage changes** - `git add` the modified files
3. **Commit with clear message** - Explain what changed and why
4. **PUSH IMMEDIATELY** - `git push` to keep remote repository up to date

❌ **NEVER leave changes uncommitted or unpushed!**

## ⚠️ Database Design Rules
- **NEVER use foreign key constraints** in the database schema
- Use `user_id` fields for data ownership but WITHOUT foreign key relationships
- When querying with joins, do NOT use Supabase's foreign key syntax - manually join data in application code
- This prevents cascading issues and keeps the database flexible

## ⚠️ Code Quality Standards
- **Always test on both mobile and desktop** - Check responsive design
- **Run TypeScript checks** - `npx tsc --noEmit` before committing
- **Avoid over-engineering** - Only implement what's requested
- **Update documentation** - Record significant changes in README.md

---

## 🎮 Core Features

### Goal System
- **3-tier hierarchical goals**: 3-year, 1-year, and 1-month goals
- Goals must be set on first login
- Edit goals anytime while maintaining original timeline
- Visual countdown showing time remaining

### Task Management
**Daily Tasks**:
- Recurring tasks with daily time targets (e.g., "Study - 60 min/day")
- Real-time progress calculation from pomodoro sessions
- Progress bars showing completion status
- **Freshness cues**: Task cards dim and show "Last worked" age when a task has been idle
- Automatic streak tracking with customizable day cut time
- Rest credits for maintaining flexibility

**One-Time Tasks**:
- Deadline-driven project tasks
- Estimated time/duration tracking
- Burn-down charts to visualize progress vs. deadline
- Archive completed tasks
- Link to daily tasks to share time tracking without double-counting statistics
 - Priority badges use clear alert icons for fast scanning

### Pomodoro System
- Choose duration: 15, 25, 45, 60 minutes (or custom)
- Real-time countdown timer with **overtime tracking**
- **Overtime mode**: Timer continues counting after reaching 0:00
- **Pause tracking**: Record multiple pause/resume cycles with timestamps
- **Duration choice**: Choose between original and extended time on completion
- **Smart appearance**: Orange theme when in overtime mode
- Focus rating (1-5 stars) after completion
- Accomplishment logging
- Real-time time tracking and statistics

### Progress Tracking
- **Streak tracking**: Build and maintain daily completion streaks
- **Rest credits**: Banking system for missed days
- **Time statistics**: View Today, Week, and Total accumulated time
- **Real-time status**: Daily task "Done today" status calculated live from pomodoros

### Check-In Calendar
- **Month navigation**: Browse previous and future months
- **Date-specific pomodoros**: Click any date to view that day's completed pomodoros
- Monthly view of daily completions with color-coded status
- Visual streak display
- Rest credit management
- Make-up functionality for missed days

## 🛠️ Tech Stack

### Web Frontend
- **React 19** with **Vite** - Fast, modern development
- **TypeScript** - Type safety
- **TailwindCSS 4** - Utility-first styling
- **React Router 7** - Client-side routing
- **Zustand** - Lightweight state management
- **Framer Motion** - Animations
- **date-fns** - Date manipulation
- **Lucide React** - Icon library

### iOS App (NEW - In Development)
- **Swift 5.9+** with **SwiftUI** - Native iOS development
- **iOS 17.0+** target - Latest SwiftUI features
- **Supabase Swift SDK** - Shared backend with web app
- **Combine** - Reactive programming
- Feature parity with web app planned

### Backend (Shared)
- **Supabase** - PostgreSQL database + Authentication
- **Row Level Security** - Data isolation per user
- Automated user profile creation on signup
- Real-time data sync across web and iOS platforms

## 📦 Project Structure

```
Level-Up/
├── frontend/               # React web application
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── battle/    # Pomodoro modal
│   │   │   ├── calendar/  # Check-in calendar
│   │   │   ├── dashboard/ # Dashboard widgets
│   │   │   ├── goals/     # Goal setup forms
│   │   │   ├── layout/    # Protected routes
│   │   │   └── tasks/     # Task cards & forms
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Supabase client
│   │   ├── pages/         # Page components
│   │   ├── store/         # Zustand stores
│   │   └── types/         # TypeScript types
│   └── package.json
├── database/              # Shared database schema
│   └── schema.sql         # Complete DB setup
└── ios-app/               # iOS planning documents
    ├── SETUP.md           # Legacy setup docs
    └── README.md          # Points to ~/code/revelation/

~/code/revelation/          # Native iOS application (NEW - separate location)
├── App/                   # App entry point
├── Features/              # Feature modules (Auth, Goals, Tasks, etc.)
│   ├── Auth/
│   ├── Goals/
│   ├── Tasks/
│   ├── Dashboard/
│   ├── Calendar/
│   └── Pomodoro/
├── Core/                  # Shared utilities and services
│   ├── Models/           # Swift data models
│   ├── Services/         # Repositories and business logic
│   └── Supabase/         # Supabase client
├── UI/                    # Reusable SwiftUI components
├── Resources/             # Assets, fonts, etc.
├── QUICKSTART.md          # Step-by-step Xcode setup
├── SETUP.md              # Detailed setup instructions
├── README.md             # Project overview
└── IOS_CONVERSION_PLAN.md # Development roadmap
```

## 🚀 Setup & Installation

### Prerequisites

**For Web App:**
- Node.js >= 20.19.0
- npm >= 9.0.0
- Supabase account

**For iOS App:**
- macOS 14.0+
- Xcode 15.0+
- Active Apple Developer Account
- Same Supabase account (shared backend)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Level-Up
```

### 2. Database Setup (Shared - One Time)
1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor in your Supabase dashboard
3. Run the entire `database/schema.sql` file
4. Note your project URL and anon key (needed for both web and iOS)

### 3. Web Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run development server:
```bash
npm run dev
```

Visit `http://localhost:5173`

Build for production:
```bash
npm run build
```

### 4. iOS App Setup (Optional)

**iOS source files are located at**: `~/code/revelation/`

See `~/code/revelation/QUICKSTART.md` for step-by-step Xcode project creation.

**Quick Start:**
1. Open Xcode and create a new iOS App project
2. Save in existing `~/code/revelation/` directory (files already there!)
3. Add existing Swift source files to Xcode project
4. Add Supabase Swift SDK via Swift Package Manager
5. Configure environment variables with your Supabase credentials
6. Build and run on simulator or device

**Documentation:**
- Quick Start: `~/code/revelation/QUICKSTART.md`
- Detailed Setup: `~/code/revelation/SETUP.md`
- Project Overview: `~/code/revelation/README.md`
- Architecture Plan: `~/code/revelation/IOS_CONVERSION_PLAN.md`

**Note:** Web and iOS apps share the same Supabase backend - data syncs in real-time across platforms!

## 📱 Usage Flow

### First-Time User
1. **Sign up** with email/password
2. **Set goals** - Required: 3-year, 1-year, and 1-month goals
3. **Create tasks** - Add daily recurring tasks and one-time project tasks
4. **Configure day cut** - Set your preferred daily reset time and timezone
5. **Start working** - Click "Start Pomodoro" on any task
6. **Complete session** - Rate focus and log accomplishments
7. **Track progress** - View real-time statistics and streaks

### Daily Workflow
1. View goals and tasks on main page
2. Start Pomodoro sessions on tasks
3. Complete daily task targets to maintain streak (resets at your custom day cut time)
4. Check progress on burn-down charts for projects
5. Monitor time statistics: Today, Week, and Total accumulated
6. Review calendar to track consistency

## 🎯 Current Implementation Status

### ✅ Web App - Implemented
- User authentication (Supabase Auth)
- Goal management (3-tier system)
- Task CRUD (daily and one-time)
- Pomodoro timer with focus tracking
- **Overtime tracking system**
- **Pause period recording**
- **Smart time calculation**: Different logic for natural vs manual completions
- Real-time daily task status calculation
- Customizable day cut time with timezone support
- Streak tracking with rest credits
- **Check-in calendar with month navigation**
- **Date-specific pomodoro viewing**
- Time statistics using actual duration (Today, Week, Total)
- Burn-down charts
- Task archiving
- Client-side prompt composition for Revelation/Next Move
- Mobile-responsive UI
- Icon-based buttons

### 🚧 iOS App - In Development
**Phase 1: Core Infrastructure (Completed)**
- ✅ Project structure and Swift Package setup
- ✅ Supabase Swift SDK integration
- ✅ Data models matching database schema
- ✅ Repository layer for database operations
- ✅ Authentication views (Sign In / Sign Up)

**Phase 2: Core Features (In Progress)**
- ✅ Main tab navigation (Dashboard, Goals, Tasks, Calendar)
- ✅ Goals view with 3-tier system
- ✅ Tasks list and management (daily & one-time)
- ✅ Dashboard with statistics
- ✅ Calendar view with month navigation
- ✅ Basic Pomodoro timer (placeholder)
- ⏳ Full Pomodoro implementation (background execution, notifications)
- ⏳ Real-time data sync
- ⏳ Offline support

**Phase 3: iOS-Specific Features (Planned)**
- ⏳ Lock screen & home screen widgets
- ⏳ Live Activities for running Pomodoros
- ⏳ Local notifications
- ⏳ Siri shortcuts
- ⏳ Apple Watch companion app (future)

See `IOS_CONVERSION_PLAN.md` for complete iOS roadmap.

### 🚧 General Planned Features
See `next.md` for upcoming features and improvements:
- Enhanced visual feedback
- Achievement system
- Task templates
- Advanced analytics
- Category-based time tracking

## 🔧 Key Database Features

### Automatic Profile Creation
New users automatically get a profile with default preferences.

### Schema Notes
- User profiles no longer store RPG level or stat attributes; prompts use raw data only.

### Real-Time Status Calculation
Daily task "Done today" status is calculated in real-time from pomodoro sessions. No persistence needed - status reflects actual time logged since last day cut.

### Row Level Security
All data is isolated per user - you can only access your own tasks, goals, and progress.

## 📊 Database Schema

Complete schema available in `database/schema.sql`, including:
- `user_profiles` - User preferences and streak tracking
- `goals` - 3-tier goal system
- `tasks` - Daily and one-time tasks
- `task_relationships` - Links between one-time and daily tasks
- `pomodoros` - Completed work sessions (source of truth for time tracking)
- `active_pomodoros` - Current running sessions

**Note**: Run `database/cleanup-rewards-and-daily-completions.sql` on existing databases to remove deprecated tables and columns.

## 🤝 Contributing

This is a personal productivity app, but suggestions and feedback are welcome!

## 📝 License

Private project - Not licensed for public use.

## 🎨 Design Philosophy

### Core Essence: Selling Feedback and Meaning

At its foundation, Revelation sells two fundamental things:
1. **Feedback** - Tangible progress indicators, statistics, and validation of your efforts
2. **Meaning** - A sense of purpose and significance in your daily actions

While functionally an efficiency tool, Revelation differs from traditional productivity apps by introducing AI assistance at three progressive levels:

#### Level 1: Personal Assistant
The AI acts as your organizer, helping schedule and prioritize your existing tasks. "You have many tasks - let me arrange them for you: what to do and when."

#### Level 2: Personal Growth Coach
The AI becomes your strategic advisor, helping you align tasks with goals. It suggests which tasks are necessary, which aren't, what's important, what's not, and what new tasks you should consider based on your objectives.

#### Level 3: Revelation (天启)
The ultimate level - a role reversal. When you lack purpose or feel that nothing has meaning, the AI helps construct meaning itself and assigns tasks to you. Instead of you giving the AI tasks, **the AI gives you tasks**.

This isn't absurd - meaning is constructed anyway. Humans are "animals suspended in webs of self-woven meaning." When you can't weave your own meaning, AI helps weave it for you.

### The Loop

**Set Goals → Complete Tasks → Track Progress → Maintain Streaks → Achieve More**

The app provides structure and motivation for productivity without gamification distractions. It's designed to:
- Make task completion visible and measurable
- Visualize long-term progress with real-time statistics
- Encourage consistent daily habits with streak tracking
- Provide flexible goal setting with 3-tier timeline
- Balance work with rest (via rest credits and customizable day cut)
- **Progressively introduce AI assistance from assistant to revelation**

---

## 🔨 Additional Technical Guidelines

**⚠️ See "CRITICAL DEVELOPMENT RULES" at the top of this document first!**

This section contains additional technical details for specific scenarios.

### TypeScript & Supabase Best Practices
- **Avoid `.single()` in Supabase queries** - Use array access `data?.[0]` instead to prevent "excessively deep type instantiation" errors
  ```typescript
  // ❌ Avoid - can cause TypeScript compilation errors
  const { data } = await supabase.from('table').select('*').single();

  // ✅ Prefer - safer type instantiation
  const { data } = await supabase.from('table').select('*').limit(1);
  const record = data?.[0];
  ```
- **Use direct type paths** - Prefer `Database['public']['Tables']['table_name']['Row']` over `Tables<'table_name'>` helper
- **Test TypeScript compilation** - Run `npx tsc --noEmit` before committing to catch type errors early

### Database Changes

1. **Update schema**: Edit `database/schema.sql`
2. **Create migration**: `supabase/migrations/YYYYMMDDHHmmss_description.sql`
   ```bash
   # Generate timestamp and create migration file
   timestamp=$(date +"%Y%m%d%H%M%S")
   touch supabase/migrations/${timestamp}_your_migration_name.sql
   # Edit the file with your SQL changes
   ```
3. **Handle migration conflicts** (if remote has migrations not in local):
   ```bash
   # Check migration status
   supabase migration list --linked

   # If remote migrations are missing locally, create placeholder files
   # (Replace TIMESTAMP with the actual timestamp from the list)
   echo "-- Placeholder for remote migration" > supabase/migrations/TIMESTAMP_remote_migration.sql
   ```
4. **Deploy**:
   ```bash
   # Use auto-confirm to avoid interactive prompt
   echo "Y" | supabase db push --linked

   # Or manually confirm when prompted
   supabase db push --linked
   ```
5. **⚠️ CRITICAL - Update types** (Vercel will fail without this):
   ```bash
   supabase gen types typescript --linked > frontend/src/types/database.ts
   cd frontend && npx tsc --noEmit  # Verify no errors
   ```
6. **Commit changes**:
   ```bash
   git add supabase/migrations/ database/schema.sql frontend/src/types/database.ts
   git commit -m "Add database migration: [description]"
   git push
   ```

---

## 📱 iOS App Development

### Current Status
The native iOS app is in active development with core infrastructure and features implemented. The app shares the same Supabase backend as the web version, enabling seamless data sync across platforms.

### Key Features Implemented
- **Native SwiftUI Interface**: Modern, declarative UI matching iOS design patterns
- **Shared Backend**: Same Supabase database, authentication, and business logic
- **Feature Modules**: Clean architecture with separate modules for Auth, Goals, Tasks, Calendar, and Pomodoro
- **Repository Pattern**: Data access layer abstracting Supabase operations
- **Real-Time Sync**: Changes made on web instantly appear on iOS and vice versa

### Documentation
- **Setup Guide**: See `ios-app/SETUP.md` for detailed Xcode setup instructions
- **Architecture Plan**: See `IOS_CONVERSION_PLAN.md` for complete development roadmap
- **Package Manager**: Swift Package Manager for dependency management

### Next Steps for iOS
1. Complete Pomodoro timer with background execution and notifications
2. Implement real-time Supabase subscriptions
3. Add offline support with local caching
4. Create iOS widgets (lock screen and home screen)
5. Implement Live Activities for running Pomodoros
6. Add Siri shortcuts integration
7. Beta testing via TestFlight
8. App Store submission

**Note**: Both web and iOS apps can be used interchangeably - user data stays perfectly in sync!

---

**Built with ❤️ to make productivity feel like an adventure**
