# Frontend Project Structure

This document explains the organization of the Revelation frontend codebase.

## Directory Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── auth/           # Authentication related components
│   │   ├── battle/         # Pomodoro battle screen components
│   │   ├── dashboard/      # Dashboard widgets
│   │   ├── goals/          # Goal management components
│   │   ├── tasks/          # Task management components
│   │   ├── common/         # Shared/common components (buttons, cards, etc.)
│   │   └── layout/         # Layout components (header, sidebar, etc.)
│   │
│   ├── pages/              # Full page components (one per route)
│   │   ├── Auth.tsx        # Login/Signup page
│   │   ├── Dashboard.tsx   # Main dashboard
│   │   ├── Goals.tsx       # Goal setup/management page
│   │   ├── Tasks.tsx       # Task management page
│   │   ├── Battle.tsx      # Pomodoro battle page
│   │   ├── Profile.tsx     # User profile/stats page
│   │   └── Calendar.tsx    # Check-in calendar page
│   │
│   ├── lib/                # Third-party library configurations
│   │   └── supabase.ts     # Supabase client setup
│   │
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts      # Authentication hook
│   │   ├── useGoals.ts     # Goals data fetching
│   │   ├── useTasks.ts     # Tasks data fetching
│   │   ├── usePomodoro.ts  # Pomodoro timer logic
│   │   └── useRewards.ts   # Reward calculation logic
│   │
│   ├── store/              # Zustand state management
│   │   ├── useUserStore.ts     # User & profile state
│   │   ├── useTaskStore.ts     # Tasks state
│   │   ├── useGoalStore.ts     # Goals state
│   │   └── usePomodoroStore.ts # Pomodoro state
│   │
│   ├── types/              # TypeScript type definitions
│   │   ├── database.ts     # Supabase database types
│   │   └── index.ts        # Application types
│   │
│   ├── utils/              # Utility functions
│   │   ├── rewards.ts      # Reward calculation helpers
│   │   ├── enemies.ts      # Enemy generation logic
│   │   ├── date.ts         # Date/time helpers
│   │   └── validation.ts   # Form validation helpers
│   │
│   ├── constants/          # Application constants
│   │   ├── enemies.ts      # Enemy definitions
│   │   ├── items.ts        # Item definitions (post-MVP)
│   │   └── config.ts       # App configuration
│   │
│   ├── App.tsx             # Main app component with routing
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles (Tailwind)
│
├── public/                 # Static assets
├── .env.local              # Environment variables (create from .env.example)
├── .env.example            # Environment variable template
├── tailwind.config.js      # Tailwind CSS configuration
├── vite.config.ts          # Vite configuration
└── package.json            # Dependencies
```

## Module Responsibilities

### Components (`src/components/`)
Reusable, presentational components that receive data via props.

**Example structure:**
- `components/common/Button.tsx` - Reusable button component
- `components/tasks/TaskCard.tsx` - Display a single task
- `components/battle/EnemyDisplay.tsx` - Show enemy during battle

### Pages (`src/pages/`)
Top-level route components that compose multiple components together.

**Naming convention:** PascalCase matching route name
- `/` → `Dashboard.tsx`
- `/battle` → `Battle.tsx`
- `/goals` → `Goals.tsx`

### Hooks (`src/hooks/`)
Custom React hooks for data fetching, business logic, and side effects.

**Example:**
```typescript
// useGoals.ts
export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  // Fetch and manage goals
  return { goals, loading, error };
}
```

### Store (`src/store/`)
Zustand stores for global state management.

**When to use:**
- Data needed across multiple components
- User authentication state
- Complex state logic

**When NOT to use:**
- Local component state (use `useState`)
- Form state (use local state or form libraries)

### Utils (`src/utils/`)
Pure functions for calculations, transformations, and helpers.

**Guidelines:**
- Should be pure functions (no side effects)
- Should be testable
- Should have a single responsibility

### Constants (`src/constants/`)
Static data and configuration values.

**Example:**
```typescript
// enemies.ts
export const ENEMIES = {
  study: { name: 'Book Wyrm', emoji: '📚' },
  // ...
};
```

## Development Workflow

### Creating a New Feature

1. **Define Types** (`src/types/`)
   - Add TypeScript interfaces
   - Update database types if needed

2. **Create Store** (if needed) (`src/store/`)
   - Define state shape
   - Create actions

3. **Build Components** (`src/components/`)
   - Start with presentational components
   - Add to appropriate subfolder

4. **Create Hooks** (if needed) (`src/hooks/`)
   - Extract data fetching logic
   - Extract complex business logic

5. **Compose Page** (`src/pages/`)
   - Combine components
   - Connect to store/hooks

6. **Add Route** (`src/App.tsx`)
   - Define new route

### Naming Conventions

- **Components**: PascalCase (e.g., `TaskCard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useGoals.ts`)
- **Stores**: camelCase with `use` prefix and `Store` suffix (e.g., `useTaskStore.ts`)
- **Utils**: camelCase (e.g., `calculateRewards.ts`)
- **Types**: PascalCase for interfaces/types (e.g., `UserProfile`)
- **Constants**: UPPER_SNAKE_CASE for values, PascalCase for objects (e.g., `MAX_HP`, `ENEMIES`)

## State Management Strategy

### Local State (useState)
Use for:
- Form inputs
- Toggle states
- Component-specific UI state

### Global State (Zustand)
Use for:
- User authentication
- User profile/stats
- Active tasks/goals
- Pomodoro session state

### Server State (Supabase)
Use for:
- Database queries
- Real-time subscriptions (future)

## Import Organization

Organize imports in this order:
```typescript
// 1. External libraries
import { useState } from 'react';
import { supabase } from '@supabase/supabase-js';

// 2. Internal modules (absolute paths)
import { useUserStore } from '@/store/useUserStore';
import { TaskCard } from '@/components/tasks/TaskCard';

// 3. Types
import type { Task } from '@/types';

// 4. Styles/assets
import './styles.css';
```

## Component Example

```typescript
// src/components/tasks/TaskCard.tsx
import { CATEGORY_EMOJIS, PRIORITY_COLORS } from '@/types';
import type { Task } from '@/types';

interface TaskCardProps {
  task: Task;
  onStart: (taskId: string) => void;
}

export function TaskCard({ task, onStart }: TaskCardProps) {
  const emoji = CATEGORY_EMOJIS[task.category || 'admin'];
  const priorityColor = PRIORITY_COLORS[task.priority];

  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <span className="character-sprite">{emoji}</span>
        <div className="flex-1">
          <h3 className={`font-bold ${priorityColor}`}>{task.title}</h3>
          <p className="text-sm text-gray-400">{task.description}</p>
        </div>
        <button
          onClick={() => onStart(task.id)}
          className="btn btn-primary"
        >
          Start
        </button>
      </div>
    </div>
  );
}
```

## Next Steps

1. Set up `.env.local` with Supabase credentials
2. Run `npm run dev` to start development server
3. Start building features module by module:
   - Auth (login/signup)
   - Goals setup
   - Dashboard
   - Task management
   - Pomodoro battle

Happy coding! 🚀
