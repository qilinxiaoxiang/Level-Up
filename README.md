# Level Up - Gamified Productivity RPG

A personal productivity application that transforms your daily tasks and goals into an engaging RPG adventure. Fight enemies, level up your character, and unlock powerful equipment by completing real-world tasks.

## Core Philosophy

**The Loop**: Complete Tasks → Defeat Enemies → Earn Rewards → Get Stronger → Tackle Bigger Challenges

The game is designed to make you feel motivated and excited about your productivity, turning the grind of daily tasks into an adventure.

---

## Feature Overview

### 1. Task System

#### Daily Tasks (Recurring Quests)
- **Time-based goals**: Each daily task has a target duration (e.g., "Exercise - 1 hour/day", "Study - 2 hours/day")
- **Flexible attendance system**:
  - 6 days of completion = Full week completion (1 rest day allowed)
  - 7 days straight = Bonus rewards (extra gold, XP multiplier)
  - **Attendance Banking**: Complete 6 days to earn 1 "rest credit" that maintains your streak when used
  - Can make up missed days (but without streak bonuses)
- **Daily reset**: Tasks reset at configurable time (default: midnight)
- **Progress tracking**: Visual progress bar showing time completed vs. target

#### One-Time Tasks (Main Quests)
- **Deadline-driven**: Set a due date for task completion
- **Total time estimate**: Define how many hours/Pomodoros needed
- **Burn-down chart**: Visual representation of remaining work vs. time left
- **Subtasks**: Break large tasks into smaller milestones
- **Urgency indicators**: Color coding based on deadline proximity

Both task types include:
- Rich text descriptions
- Priority levels (maps to enemy difficulty)
- Category/tags (maps to different enemy types)
- Reward configuration (gold, XP, special items)

### 2. Pomodoro Battle System

The core mechanic that makes work feel like combat:

#### Battle Mechanics
- **Start a Pomodoro** = **Engage an Enemy**
- **Enemy HP** = **Pomodoro duration** (e.g., 25-minute Pomodoro = 25 HP enemy)
- **Your attacks** = **Each minute of focused work**
- **Battle screen** shows:
  - Animated enemy sprite taking damage
  - Your character attacking
  - HP bar draining as time passes
  - Current task description
  - Remaining time

#### Post-Battle Report
- **Log your accomplishment**: After each Pomodoro, briefly note what you accomplished
- **Reward calculation**: Based on task priority and focus quality
- **Loot drops**: Gold, XP, and occasionally special items

#### Focus Tracking
- Option to rate focus quality (1-5 stars)
- Higher focus = Better loot multiplier
- Build "combo streaks" for consecutive high-focus Pomodoros

### 3. RPG Progression System

#### Character Stats
- **Level**: Increases with XP, unlocks new features
- **HP (Health Points)**: Represents energy/willpower (decreases when missing tasks, recovers with rest)
- **Strength**: Bonus XP from physical/health tasks
- **Intelligence**: Bonus XP from study/learning tasks
- **Discipline**: Increases with streak maintenance
- **Focus**: Increases with high-quality Pomodoros

#### Leveling Benefits
- Unlock new equipment slots
- Unlock new enemy types (task categories)
- Unlock special abilities
- Increase base rewards

### 4. Equipment & Shop System

#### Equipment Types
- **Weapon**: Increases XP gain
- **Armor**: Protects streak when missing a day
- **Accessories**: Special effects (e.g., "Hourglass of Time - adds 5 minutes to Pomodoro")
- **Consumables**: Temporary buffs (e.g., "Focus Potion - 2x XP for next 3 Pomodoros")

#### Rarity System
- Common (gray)
- Uncommon (green)
- Rare (blue)
- Epic (purple)
- Legendary (gold)

#### Purchase & Unlock
- Buy with earned gold
- Some items require special unlock items from quest completion
- Some items only available at certain character levels

### 5. Enemy System

#### Enemy Types (Based on Task Categories)
Different task categories spawn different enemy types:
- **Study/Learning** → Wise Wizards, Book Wyrms
- **Exercise/Health** → Savage Beasts, Mountain Trolls
- **Work/Projects** → Mechanical Constructs, Golems
- **Creative** → Chaotic Sprites, Muses
- **Chores/Admin** → Blob Monsters, Slimes

#### Difficulty Scaling
Task priority determines enemy difficulty:
- **Low Priority** → Weak enemies (slime, goblin)
- **Medium Priority** → Normal enemies (orc, wolf)
- **High Priority** → Elite enemies (dragon, demon)

#### Boss Battles
- Major one-time tasks become boss battles
- Require multiple Pomodoros to defeat
- Special animations and epic loot

### 6. Special Tasks & Unlock System

#### Locked Quests
- Some high-value tasks start locked
- Require special items to unlock (earned from other tasks)
- Example: "Master's Thesis" requires "Discipline Seal" + "Research Tome"

#### Quest Chains
- Complete Task A → Unlocks Task B → Unlocks Task C
- Creates narrative progression
- Final task in chain gives legendary rewards

### 7. Goal System (Hierarchical)

A three-tier goal system to keep you aligned with long-term vision:

#### 3-Year Goal
- Long-term vision (where you want to be in 3 years)
- Example: "Become a technical lead at a top tech company"
- Timeline: 3 years from creation date (fixed, not modified date)
- **Required**: Must set on first login
- **Evaluation**: When timeline reached, evaluate progress and set new 3-year goal

#### 1-Year Goal
- Medium-term milestone (aligned with 3-year goal)
- Example: "Master system design and lead 2 major projects"
- Timeline: 1 year from creation date (fixed)
- **Required**: Must set on first login
- Evaluation and renewal every year

#### 1-Month Goal
- Short-term focused objective
- Example: "Complete advanced algorithms course and solve 50 LeetCode problems"
- Timeline: 1 month from creation date (fixed)
- **Required**: Must set on first login
- Monthly evaluation and renewal

**Goal Management**:
- Can modify goal description anytime, but timeline stays fixed to original creation date
- System reminds you when timeline approaches
- Must evaluate and create new goal when timeline is reached
- Goals are visible on dashboard for constant motivation

### 8. Reward Structure

#### Gold (Currency)
- Earned from completed Pomodoros
- Amount scales with task priority
- Used to buy equipment and consumables

#### Experience Points (XP)
- Earned from completed tasks
- Required to level up
- Bonus XP from streaks and special achievements

#### Special Items
- Unlock tokens for special tasks
- Equipment pieces
- Cosmetic items (character skins, battle backgrounds)

#### Achievements/Badges
- "First Blood" - Complete first Pomodoro
- "Week Warrior" - 7-day streak
- "Dragon Slayer" - Complete a boss battle
- "Perfectionist" - Complete all daily tasks for a week

---

## User Operation Flow

### First-Time User Journey

1. **Authentication**
   - Sign up with email/password
   - Verify email (if enabled)
   - Login to access the system

2. **Goal Setup (Required on First Login)**
   - System detects missing goals
   - Prompt to enter 3-Year Goal
   - Prompt to enter 1-Year Goal
   - Prompt to enter 1-Month Goal
   - Cannot proceed without setting all three goals
   - Goals are timestamped with creation date (fixed timeline)

3. **Task Creation**
   - Navigate to task management
   - Create daily tasks (recurring with time targets)
   - Create one-time tasks (with deadlines)
   - Tasks can be created anytime

### Daily Workflow

1. **Login & Dashboard**
   - See current goals prominently displayed
   - View today's daily tasks with progress
   - See active one-time tasks
   - Check current streak and stats

2. **Starting Work on a Task**
   - Click on any task (daily or one-time)
   - **Pomodoro Setup Dialog appears**:
     - Choose Pomodoro duration (15/25/45/60 minutes)
     - Select task category (determines enemy type)
     - Confirm to start
   - Redirects to Battle Screen

3. **Pomodoro Battle**
   - Timer counts down
   - Enemy HP decreases with time
   - Your hero attacks the enemy
   - Visual feedback and animations
   - Alert when Pomodoro completes

4. **Post-Pomodoro**
   - Dialog to log what you accomplished
   - Rate focus quality (1-5 stars)
   - Rewards calculated and awarded (Gold + XP)
   - Task progress updated
   - HP deducted based on Pomodoro duration
   - Check for level-up

5. **Daily Task Check-In**
   - When daily task target is met, mark as "checked in"
   - Streak counter increments
   - Earn rest credit if 6+ daily tasks completed in a week
   - Visual celebration animation

### Streak & Calendar Management

1. **Check-In Calendar**
   - View monthly calendar showing:
     - Days with completed check-ins (green)
     - Days missed (red)
     - Current day (highlighted)
   - Current streak displayed prominently
   - Available make-up chances shown

2. **Making Up Missed Days**
   - Click on a missed day in calendar
   - If you have rest credits, can mark it as made-up
   - Restores streak continuity
   - Deducts one rest credit

### Goal Evaluation & Renewal

1. **When Goal Timeline Approaches** (1 week before)
   - Dashboard shows reminder
   - Notification to prepare evaluation

2. **When Goal Timeline Is Reached**
   - System prompts for evaluation
   - Text area to reflect on goal achievement
   - Must create new goal for same tier
   - Previous goal archived with evaluation notes
   - New goal timeline set (1 month/1 year/3 years from now)

### Returning User Journey

1. **Login**
2. **Dashboard Check** - See progress, goals, streaks
3. **Work on Tasks** - Complete Pomodoros
4. **Check-In** - Maintain streak
5. **Earn & Spend** - Collect rewards, buy equipment (post-MVP)
6. **Level Up** - Progress your character

---

## User Interface Design

### Dashboard (Home Screen)
- Character portrait with current level and stats
- Today's daily tasks with progress
- Active streak counter
- Quick-start Pomodoro button
- Mission/Vision reminder

### Battle Screen
- Large enemy sprite in center
- Your character on the left
- HP bars and damage numbers
- Task description overlay
- Timer and Pomodoro count

### Inventory & Character
- Equipment slots with drag-and-drop
- Stat sheet showing all bonuses
- Character customization options

### Shop
- Grid of available items
- Filter by type and rarity
- Gold balance displayed

### Progress & Analytics
- Burn-down charts for one-time tasks
- Weekly/monthly completion rates
- XP and gold earned over time
- Focus quality trends
- Category breakdown (which tasks you do most)

### Task Management
- List view and calendar view
- Drag to reorder priority
- Quick add with templates
- Archive completed tasks

---

## Design Decisions (Updated)

Based on discussion:
1. **Penalties**: YES - Missing tasks will reduce HP and break streaks
2. **Character Classes**: NO (not in MVP, maybe later)
3. **Rest Credits**: Accumulate indefinitely (no expiration)
4. **Enemy Mechanics**: Just different appearances initially (no special abilities)
5. **HP System**: See detailed explanation below

### HP (Health Points) System

HP represents your energy and willpower. It affects your effectiveness and available options.

**HP Drain**:
- Missing a daily task: -10 HP
- Breaking a streak: -20 HP
- Failing to complete a one-time task by deadline: -15 HP

**HP Consequences**:
- **100-70 HP**: Normal state, all features available
- **69-40 HP**: Reduced rewards (0.75x multiplier on gold and XP)
- **39-20 HP**: Cannot start high-priority tasks, reduced rewards (0.5x multiplier)
- **19-1 HP**: Can only work on low-priority tasks, minimal rewards (0.25x multiplier)
- **0 HP**: Forced rest day (must recover before continuing)

**HP Recovery**:
- Completing any task: +5 HP
- Taking a designated rest day: +30 HP
- Completing self-care tasks (exercise, meditation, sleep tracking): +15 HP
- Using HP potions (consumable items): +20-50 HP
- Passive recovery: +5 HP per day automatically

**Strategic Depth**: This creates a risk/reward system where pushing too hard leads to burnout, encouraging balanced productivity.

---

## Technical Stack & Architecture

### Frontend
- **Framework**: Modern web framework (React/Vue/Svelte - TBD)
- **Styling**: CSS/TailwindCSS for responsive design
- **Animations**: CSS animations + Canvas for battle effects
- **State Management**: Context API or Zustand (lightweight)

### Backend
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Real-time**: Supabase real-time subscriptions (for future multi-device sync)
- **Storage**: Supabase Storage (for future image uploads)

### MVP Approach
- **No pixel art initially**: Use text, emojis, and CSS styling
- **Canvas animations**: Simple shapes and bars for battle effects
- **Responsive web app**: Desktop-first, mobile-friendly
- **Single user**: No social features in MVP

---

## Database Schema (Supabase)

The complete database schema including all tables, indexes, triggers, RLS policies, and sample data is available in:

**[`database/schema.sql`](database/schema.sql)**

Run this file in your Supabase SQL Editor to set up the entire database.

```

---

## Key Database Features

### Row Level Security (RLS)
All tables will have RLS policies ensuring users can only access their own data:

```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own profile" ON user_profiles
  FOR ALL USING (auth.uid() = id);

-- Similar policies for all other tables
```

### Triggers for Auto-updates

```sql
-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Functions for Complex Logic

```sql
-- Function to calculate if user levels up
CREATE OR REPLACE FUNCTION check_level_up(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_xp INTEGER;
  user_level INTEGER;
  xp_needed INTEGER;
BEGIN
  SELECT current_xp, level INTO user_xp, user_level
  FROM user_profiles WHERE id = user_uuid;

  -- XP needed = level * 100 (simple formula, can be adjusted)
  xp_needed := user_level * 100;

  IF user_xp >= xp_needed THEN
    UPDATE user_profiles
    SET level = level + 1,
        current_xp = current_xp - xp_needed,
        max_hp = max_hp + 10
    WHERE id = user_uuid;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
```

---

## API Design (Supabase Client)

Key queries the frontend will make:

### Dashboard Data
```javascript
// Get user profile with stats
const { data: profile } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('id', userId)
  .single();

// Get today's daily tasks with progress
const { data: dailyTasks } = await supabase
  .from('tasks')
  .select(`
    *,
    daily_task_completions!inner(*)
  `)
  .eq('user_id', userId)
  .eq('task_type', 'daily')
  .eq('is_active', true)
  .eq('daily_task_completions.date', today);

// Get active one-time tasks
const { data: oneTimeTasks } = await supabase
  .from('tasks')
  .select('*')
  .eq('user_id', userId)
  .eq('task_type', 'onetime')
  .eq('is_active', true)
  .order('deadline', { ascending: true });
```

### Complete a Pomodoro
```javascript
// Insert pomodoro record
const { data: pomodoro } = await supabase
  .from('pomodoros')
  .insert({
    user_id: userId,
    task_id: taskId,
    duration_minutes: 25,
    started_at: startTime,
    completed_at: endTime,
    focus_rating: focusRating,
    accomplishment_note: note,
    gold_earned: goldAmount,
    xp_earned: xpAmount
  })
  .select()
  .single();

// Update user stats
await supabase.rpc('add_rewards', {
  user_uuid: userId,
  gold_amount: goldAmount,
  xp_amount: xpAmount
});

// Update task progress (for one-time tasks)
await supabase
  .from('tasks')
  .update({ completed_pomodoros: completedPomodoros + 1 })
  .eq('id', taskId);
```

---

## Pixel Art Assets & Libraries

### Recommended Approaches

#### Option 1: Use Existing Pixel Art Libraries
- **[Kenney Assets](https://kenney.nl/)** - Free pixel art game assets (characters, items, UI)
- **[itch.io Asset Packs](https://itch.io/game-assets/free)** - Many free pixel art collections
- **[OpenGameArt](https://opengameart.org/)** - Community-created game assets
- **[Pixel Adventure Asset Pack](https://pixelfrog-assets.itch.io/)** - Beautiful free character sprites

#### Option 2: Use Icon/Sprite Generators
- **[Piskel](https://www.piskelapp.com/)** - Free online pixel art editor
- **[Lospec](https://lospec.com/)** - Pixel art tools and palettes
- **Aseprite** - Professional pixel art tool ($20, open source)

#### Option 3: CSS/SVG Based Pixel Art
- Use CSS grid to create pixel art programmatically
- Libraries like **[pixelartcss](https://github.com/chriswrightdesign/pixelartcss)**
- Good for simple, consistent style

#### Option 4: AI-Generated Pixel Art
- Use tools like Midjourney/DALL-E with "pixel art" prompts
- Requires manual cleanup but good for inspiration

### Animation Libraries
- **[PixiJS](https://pixijs.com/)** - 2D WebGL renderer, great for sprite animations
- **[Phaser](https://phaser.io/)** - Full game framework with sprite support
- **[Kaboom.js](https://kaboomjs.com/)** - Simple game library with pixel art focus

---

## Development Phases

### Phase 1: MVP (Core Loop)
- Basic task creation (daily + one-time)
- Pomodoro timer with simple battle screen
- XP and leveling system
- Basic stats display

### Phase 2: RPG Elements
- Equipment system
- Shop with gold currency
- Enemy variety and animations
- Character customization

### Phase 3: Advanced Features
- Streak and attendance system
- Burn-down charts
- Achievement system
- Vision/Mission tracking

### Phase 4: Polish & Extend
- Advanced analytics
- Social features (optional: compete with friends)
- Mobile app version
- Cloud sync

---

## MVP Scope (Phase 1)

Focus on core loop - completing tasks through Pomodoro battles and earning rewards.

### Must Have (MVP)
- [ ] User authentication (Supabase Auth)
- [ ] Create/edit/delete daily tasks
- [ ] Create/edit/delete one-time tasks
- [ ] Pomodoro timer with battle screen (text-based enemies)
- [ ] Complete Pomodoro and log accomplishment
- [ ] XP and gold rewards
- [ ] Leveling system
- [ ] Basic dashboard showing:
  - Character stats (Level, XP, Gold, HP)
  - Today's daily tasks with progress bars
  - Active one-time tasks
  - Current streak
- [ ] Mark daily tasks as complete
- [ ] Track time spent on tasks
- [ ] HP system with consequences

### Nice to Have (Post-MVP)
- Equipment and shop system
- Achievements
- Visions and missions
- Burn-down charts for one-time tasks
- Advanced analytics
- Different enemy types with animations
- Rest credit system refinement
- Task templates
- Mobile responsiveness optimization

---

## Open Design Questions (For Later)

1. **Difficulty Balance**: How should we prevent "gaming the system" (creating many easy tasks for quick rewards)?
   - Possible solution: Reward scaling based on task completion history

2. **Time Tracking**: Should we integrate with actual time-tracking (detect if user is active), or trust self-reporting?
   - MVP: Trust self-reporting
   - Future: Optional integration with time-tracking tools

3. **Enemy Variety**: Start with 5 enemy types (one per category), add more later based on feel

4. **Social Features**: Not in scope initially, but design schema to allow future addition

5. **Task Templates**: Not in MVP, but easy to add later

---

## Development Roadmap

### Step 1: Setup (Week 1)
- [ ] Choose frontend framework
- [ ] Set up Supabase project
- [ ] Create database schema and tables
- [ ] Set up Row Level Security policies
- [ ] Initialize frontend project with routing

### Step 2: Authentication & Profile (Week 1)
- [ ] Implement sign up / login
- [ ] Create user profile on first login
- [ ] Build profile/stats page

### Step 3: Task Management (Week 2)
- [ ] Build task creation forms (daily and one-time)
- [ ] Implement task list views
- [ ] Add edit and delete functionality
- [ ] Create daily task completion tracking

### Step 4: Pomodoro Battle System (Week 2-3)
- [ ] Build timer component
- [ ] Create battle screen UI (text-based)
- [ ] Implement HP bar animations with Canvas
- [ ] Add post-battle logging form
- [ ] Calculate and award rewards

### Step 5: Progression & Stats (Week 3)
- [ ] Implement XP and leveling logic
- [ ] Build HP system with consequences
- [ ] Create streak tracking
- [ ] Add reward calculation based on priority/focus

### Step 6: Dashboard & Polish (Week 4)
- [ ] Build comprehensive dashboard
- [ ] Add data visualization (simple charts)
- [ ] Improve UI/UX with CSS animations
- [ ] Test all flows end-to-end
- [ ] Fix bugs and refine

### Step 7: Deploy & Iterate
- [ ] Deploy to hosting (Vercel/Netlify)
- [ ] Use personally for 1-2 weeks
- [ ] Gather feedback and pain points
- [ ] Plan Phase 2 features

---

## Tech Stack Recommendation

### Frontend
- **Framework**: **React** with **Vite** (fast, familiar, great ecosystem)
- **Styling**: **TailwindCSS** (rapid UI development)
- **State**: **Zustand** (simple, lightweight)
- **Routing**: **React Router**
- **Animation**: **Framer Motion** + **Canvas API** for battle effects
- **Date/Time**: **date-fns** (lightweight)

### Backend
- **Database/Auth**: **Supabase** (as planned)
- **Client**: **@supabase/supabase-js**

### Development Tools
- **TypeScript**: Type safety
- **ESLint + Prettier**: Code quality
- **Vite**: Fast dev server and builds

This stack is modern, performant, and well-documented.

---

## UI/UX Approach (Text-First MVP)

Since we're avoiding pixel art initially, here's how to make it look good:

### Visual Style
- **Color Palette**:
  - Background: Dark theme (#1a1a2e, #16213e)
  - Primary: Gold/Yellow (#f9ca24) for rewards
  - Accent: Electric blue (#00d2ff) for XP
  - Health: Red gradient (#e74c3c → #c0392b)
  - Success: Green (#2ecc71)

- **Typography**:
  - Headings: Bold, game-inspired font (e.g., "Press Start 2P" or "VT323")
  - Body: Clean sans-serif for readability

- **Enemy Representation**:
  - Large emoji (📚 for study, 💪 for exercise, 🏢 for work, etc.)
  - ASCII art for special enemies
  - Colored text boxes with "names" and descriptions

### Battle Screen Example (Text-Based)
```
┌─────────────────────────────────────┐
│                                     │
│           📚 BOOK WYRM              │
│                                     │
│    ▓▓▓▓▓▓▓▓▓▓░░░░░░░  HP: 15/25    │
│                                     │
└─────────────────────────────────────┘

        ⚔️  YOU
    ████████████  HP: 85/100

    Task: Study Algorithms - 25 min
    Time Remaining: 18:32

    [You deal 1 damage!]
```

### Canvas Animations
- Smooth HP bar draining
- Particle effects on hit (simple circles)
- Screen shake on critical moments
- Color pulsing for engagement

This approach keeps development fast while still feeling game-like!

---

## Next Steps

Ready to start building? Here's what we should do:

1. **Finalize tech stack choice** - React + Vite + TailwindCSS?
2. **Set up Supabase project** - Create database and run schema
3. **Initialize frontend project** - Scaffold with selected framework
4. **Start with authentication** - Get login/signup working first

Let's discuss and then start building!
