// Database types - Generated from Supabase schema
// TODO: Generate these automatically using Supabase CLI

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          username: string | null
          created_at: string
          level: number
          current_xp: number
          total_xp: number
          gold: number
          current_hp: number
          max_hp: number
          strength: number
          intelligence: number
          discipline: number
          focus: number
          pomodoro_duration: number
          daily_reset_time: string
          rest_credits: number
          current_streak: number
          longest_streak: number
          total_pomodoros: number
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          created_at?: string
          level?: number
          current_xp?: number
          total_xp?: number
          gold?: number
          current_hp?: number
          max_hp?: number
          strength?: number
          intelligence?: number
          discipline?: number
          focus?: number
          pomodoro_duration?: number
          daily_reset_time?: string
          rest_credits?: number
          current_streak?: number
          longest_streak?: number
          total_pomodoros?: number
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          created_at?: string
          level?: number
          current_xp?: number
          total_xp?: number
          gold?: number
          current_hp?: number
          max_hp?: number
          strength?: number
          intelligence?: number
          discipline?: number
          focus?: number
          pomodoro_duration?: number
          daily_reset_time?: string
          rest_credits?: number
          current_streak?: number
          longest_streak?: number
          total_pomodoros?: number
          updated_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          goal_type: '3year' | '1year' | '1month'
          description: string
          created_at: string
          target_date: string
          is_active: boolean
          is_completed: boolean
          evaluation_note: string | null
          evaluated_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_type: '3year' | '1year' | '1month'
          description: string
          created_at?: string
          target_date: string
          is_active?: boolean
          is_completed?: boolean
          evaluation_note?: string | null
          evaluated_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal_type?: '3year' | '1year' | '1month'
          description?: string
          created_at?: string
          target_date?: string
          is_active?: boolean
          is_completed?: boolean
          evaluation_note?: string | null
          evaluated_at?: string | null
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          category: string | null
          priority: 'low' | 'medium' | 'high'
          task_type: 'daily' | 'onetime'
          target_duration_minutes: number | null
          deadline: string | null
          estimated_pomodoros: number | null
          estimated_minutes: number | null
          completed_pomodoros: number
          completed_minutes: number
          gold_reward: number
          xp_reward: number
          special_item_id: string | null
          is_active: boolean
          is_completed: boolean
          completed_at: string | null
          is_archived: boolean
          archived_at: string | null
          is_locked: boolean
          required_item_id: string | null
          unlocked_by_task_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          category?: string | null
          priority?: 'low' | 'medium' | 'high'
          task_type: 'daily' | 'onetime'
          target_duration_minutes?: number | null
          deadline?: string | null
          estimated_pomodoros?: number | null
          estimated_minutes?: number | null
          completed_pomodoros?: number
          completed_minutes?: number
          gold_reward?: number
          xp_reward?: number
          special_item_id?: string | null
          is_active?: boolean
          is_completed?: boolean
          completed_at?: string | null
          is_archived?: boolean
          archived_at?: string | null
          is_locked?: boolean
          required_item_id?: string | null
          unlocked_by_task_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          category?: string | null
          priority?: 'low' | 'medium' | 'high'
          task_type?: 'daily' | 'onetime'
          target_duration_minutes?: number | null
          deadline?: string | null
          estimated_pomodoros?: number | null
          estimated_minutes?: number | null
          completed_pomodoros?: number
          completed_minutes?: number
          gold_reward?: number
          xp_reward?: number
          special_item_id?: string | null
          is_active?: boolean
          is_completed?: boolean
          completed_at?: string | null
          is_archived?: boolean
          archived_at?: string | null
          is_locked?: boolean
          required_item_id?: string | null
          unlocked_by_task_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      pomodoros: {
        Row: {
          id: string
          user_id: string
          task_id: string | null
          duration_minutes: number
          started_at: string
          completed_at: string | null
          enemy_type: string | null
          enemy_name: string | null
          focus_rating: number | null
          accomplishment_note: string | null
          gold_earned: number
          xp_earned: number
          item_dropped_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          task_id?: string | null
          duration_minutes: number
          started_at: string
          completed_at?: string | null
          enemy_type?: string | null
          enemy_name?: string | null
          focus_rating?: number | null
          accomplishment_note?: string | null
          gold_earned?: number
          xp_earned?: number
          item_dropped_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          task_id?: string | null
          duration_minutes?: number
          started_at?: string
          completed_at?: string | null
          enemy_type?: string | null
          enemy_name?: string | null
          focus_rating?: number | null
          accomplishment_note?: string | null
          gold_earned?: number
          xp_earned?: number
          item_dropped_id?: string | null
          created_at?: string
        }
      }
      // Add other tables as needed (items, achievements, etc.)
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      xp_needed_for_level: {
        Args: { current_level: number }
        Returns: number
      }
      add_rewards: {
        Args: { user_uuid: string; gold_amount: number; xp_amount: number }
        Returns: Json
      }
      update_hp: {
        Args: { user_uuid: string; hp_change: number }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
