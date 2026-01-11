// Application-specific types

export type TaskCategory = 'study' | 'exercise' | 'work' | 'creative' | 'admin';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskType = 'daily' | 'onetime';
export type GoalType = '3year' | '1year' | '1month';

export interface UserProfile {
  id: string;
  username: string | null;
  pomodoro_duration: number | null;
  rest_credits: number | null;
  timezone_name: string | null;
  current_streak: number | null;
  longest_streak: number | null;
  total_pomodoros: number | null;
  last_streak_date: string | null;
  daily_reset_time: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Goal {
  id: string;
  user_id: string | null;
  goal_type: string;
  description: string;
  created_at: string | null;
  target_date: string;
  is_active: boolean | null;
  is_completed: boolean | null;
  evaluation_note: string | null;
  evaluated_at: string | null;
  updated_at: string | null;
}

export interface Task {
  id: string;
  user_id: string | null;
  title: string;
  description: string | null;
  category: string | null;
  priority: string | null;
  task_type: string;
  // Daily task fields
  target_duration_minutes: number | null;
  // One-time task fields
  deadline: string | null;
  estimated_pomodoros: number | null;
  estimated_minutes: number | null;
  completed_pomodoros: number | null;
  completed_minutes: number | null;
  // Status
  is_active: boolean | null;
  is_completed: boolean | null;
  completed_at: string | null;
  is_archived: boolean | null;
  archived_at: string | null;
  // Additional fields from database
  created_at: string | null;
  updated_at: string | null;
  is_locked: boolean | null;
  required_item_id: string | null;
  unlocked_by_task_id: string | null;
}

export interface PausePeriod {
  paused_at: string;
  resumed_at?: string;
}

export interface Pomodoro {
  id: string;
  user_id: string | null;
  task_id: string | null; // deprecated: use linked_task_ids instead
  linked_task_ids?: string[] | null; // array of task UUIDs this pomodoro counts toward
  duration_minutes: number;
  actual_duration_minutes?: number | null;
  overtime_minutes?: number | null;
  completion_type?: string | null;
  pause_periods?: PausePeriod[] | null;
  started_at: string;
  completed_at: string | null;
  enemy_type: string | null;
  enemy_name: string | null;
  focus_rating: number | null;
  accomplishment_note: string | null;
  created_at: string | null;
}

export interface DailyCheckIn {
  id: string;
  user_id: string;
  date: string;
  completed_at: string;
  created_at: string | null;
}

// Enemy configuration
export interface Enemy {
  name: string;
  emoji: string;
  category: TaskCategory;
  priority: TaskPriority;
}

// Constants
export const CATEGORY_EMOJIS: Record<TaskCategory, string> = {
  study: '📚',
  exercise: '💪',
  work: '🏢',
  creative: '🎨',
  admin: '📋',
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-red-400',
};
