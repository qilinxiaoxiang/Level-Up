# Level Up - Gamified Productivity RPG

A personal productivity application that transforms your daily tasks and goals into an engaging RPG experience. Complete Pomodoro sessions, earn rewards, level up your character, and track your progress toward long-term goals.

## 🎮 Core Features

### Goal System
- **3-tier hierarchical goals**: 3-year, 1-year, and 1-month goals
- Goals must be set on first login
- Edit goals anytime while maintaining original timeline
- Visual countdown showing time remaining

### Task Management
**Daily Tasks**:
- Recurring tasks with daily time targets (e.g., "Study - 60 min/day")
- Progress bars showing completion status
- Automatic streak tracking
- Rest credits for maintaining flexibility

**One-Time Tasks**:
- Deadline-driven project tasks
- Estimated time/duration tracking
- Burn-down charts to visualize progress vs. deadline
- Archive completed tasks
- Link to daily tasks to share time tracking without double-counting statistics

### Pomodoro System
- Choose duration: 15, 25, 45, 60 minutes (or custom)
- Real-time countdown timer
- Focus rating (1-5 stars) after completion
- Accomplishment logging
- Automatic XP and gold rewards

### RPG Progression
- **Level system**: Gain XP from completed Pomodoros
- **Gold economy**: Earn gold to purchase shop items
- **HP system**: Tracks energy/willpower (currently not penalized)
- **Streak tracking**: Build and maintain daily completion streaks
- **Rest credits**: Banking system for missed days

### Shop System
- Create custom reward goals (e.g., "New keyboard - 500 gold")
- Purchase items with earned gold
- Track purchased items

### Check-In Calendar
- Monthly view of daily completions
- Visual streak display
- Rest credit management
- Make-up functionality for missed days

## 🛠️ Tech Stack

### Frontend
- **React 19** with **Vite** - Fast, modern development
- **TypeScript** - Type safety
- **TailwindCSS 4** - Utility-first styling
- **React Router 7** - Client-side routing
- **Zustand** - Lightweight state management
- **Framer Motion** - Animations
- **date-fns** - Date manipulation
- **Lucide React** - Icon library

### Backend
- **Supabase** - PostgreSQL database + Authentication
- **Row Level Security** - Data isolation per user
- Automated user profile creation on signup
- Database functions for XP/leveling calculations

## 📦 Project Structure

```
Level-Up/
├── frontend/               # React application
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── battle/    # Pomodoro modal
│   │   │   ├── calendar/  # Check-in calendar
│   │   │   ├── dashboard/ # Dashboard widgets
│   │   │   ├── goals/     # Goal setup forms
│   │   │   ├── layout/    # Protected routes
│   │   │   ├── shop/      # Shop panel
│   │   │   └── tasks/     # Task cards & forms
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Supabase client
│   │   ├── pages/         # Page components
│   │   ├── store/         # Zustand stores
│   │   └── types/         # TypeScript types
│   └── package.json
└── database/              # Database schema
    └── schema.sql         # Complete DB setup
```

## 🚀 Setup & Installation

### Prerequisites
- Node.js >= 20.0.0
- npm >= 9.0.0
- Supabase account

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Level-Up
```

### 2. Database Setup
1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor in your Supabase dashboard
3. Run the entire `database/schema.sql` file
4. Note your project URL and anon key

### 3. Frontend Setup
```bash
cd frontend
npm install
```

### 4. Environment Configuration
Create `frontend/.env.local`:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:5173`

### 6. Build for Production
```bash
npm run build
```

## 📱 Usage Flow

### First-Time User
1. **Sign up** with email/password
2. **Set goals** - Required: 3-year, 1-year, and 1-month goals
3. **Create tasks** - Add daily recurring tasks and one-time project tasks
4. **Start working** - Click "Start Pomodoro" on any task
5. **Complete session** - Rate focus and log accomplishments
6. **Earn rewards** - Receive gold and XP automatically

### Daily Workflow
1. View goals and tasks on main page
2. Start Pomodoro sessions on tasks
3. Complete daily task targets to maintain streak
4. Check progress on burn-down charts for projects
5. Purchase reward items from shop when goals are met
6. Review calendar to track consistency

## 🎯 Current Implementation Status

### ✅ Implemented
- User authentication (Supabase Auth)
- Goal management (3-tier system)
- Task CRUD (daily and one-time)
- Pomodoro timer with focus tracking
- XP/leveling system
- Gold rewards
- Streak tracking with rest credits
- Check-in calendar
- Shop system (user-defined items)
- Burn-down charts
- Task archiving
- Mobile-responsive UI
- Icon-based buttons

### 🚧 Planned Features
See `next.md` for upcoming features and improvements:
- Enhanced visual feedback
- Daily/weekly time summaries
- Achievement system
- Equipment system
- HP penalty system
- Task templates
- Advanced analytics

## 🔧 Key Database Features

### Automatic Profile Creation
New users automatically get a profile with default stats (Level 1, 100 HP, 0 Gold/XP).

### XP & Leveling
Formula: `XP needed = current_level * 100`
- Level 1→2: 100 XP
- Level 2→3: 200 XP
- Each level increases max HP by +10

### Row Level Security
All data is isolated per user - you can only access your own tasks, goals, and progress.

## 📊 Database Schema

Complete schema available in `database/schema.sql`, including:
- `user_profiles` - Character stats and preferences
- `goals` - 3-tier goal system
- `tasks` - Daily and one-time tasks
- `task_relationships` - Links between one-time and daily tasks
- `pomodoros` - Completed work sessions
- `daily_task_completions` - Daily progress tracking
- `active_pomodoros` - Current running sessions
- `user_shop_items` - Custom shop rewards
- `streak_history` - Streak tracking

## 🤝 Contributing

This is a personal productivity app, but suggestions and feedback are welcome!

## 📝 License

Private project - Not licensed for public use.

## 🎨 Design Philosophy

**The Loop**: Complete Tasks → Earn Rewards → Level Up → Set Bigger Goals → Repeat

The app gamifies productivity without being distracting. It's designed to:
- Make task completion feel rewarding
- Visualize long-term progress
- Encourage consistent daily habits
- Provide flexible goal setting
- Balance work with rest (via rest credits)

---

**Built with ❤️ to make productivity feel like an adventure**
