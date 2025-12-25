// Application-specific types

export type TaskCategory = 'study' | 'exercise' | 'work' | 'creative' | 'admin';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskType = 'daily' | 'onetime';
export type GoalType = '3year' | '1year' | '1month';

export interface UserProfile {
  id: string;
  username: string | null;
  level: number;
  current_xp: number;
  total_xp: number;
  gold: number;
  current_hp: number;
  max_hp: number;
  strength: number;
  intelligence: number;
  discipline: number;
  focus: number;
  pomodoro_duration: number;
  rest_credits: number;
  current_streak: number;
  longest_streak: number;
  total_pomodoros: number;
}

export interface Goal {
  id: string;
  user_id: string;
  goal_type: GoalType;
  description: string;
  created_at: string;
  target_date: string;
  is_active: boolean;
  is_completed: boolean;
  evaluation_note: string | null;
  evaluated_at: string | null;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: TaskCategory | null;
  priority: TaskPriority;
  task_type: TaskType;
  // Daily task fields
  target_duration_minutes: number | null;
  // One-time task fields
  deadline: string | null;
  estimated_pomodoros: number | null;
  estimated_minutes: number | null;
  completed_pomodoros: number;
  completed_minutes: number;
  // Rewards
  gold_reward: number;
  xp_reward: number;
  // Status
  is_active: boolean;
  is_completed: boolean;
  completed_at: string | null;
  is_archived: boolean;
  archived_at: string | null;
}

export interface Pomodoro {
  id: string;
  user_id: string;
  task_id: string | null;
  duration_minutes: number;
  started_at: string;
  completed_at: string | null;
  enemy_type: string | null;
  enemy_name: string | null;
  focus_rating: number | null;
  accomplishment_note: string | null;
  gold_earned: number;
  xp_earned: number;
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
