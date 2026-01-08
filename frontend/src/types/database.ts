export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string | null
          created_at: string | null
          criteria: Json | null
          description: string | null
          emoji: string | null
          gold_reward: number | null
          id: string
          item_reward_id: string | null
          name: string
          xp_reward: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          emoji?: string | null
          gold_reward?: number | null
          id?: string
          item_reward_id?: string | null
          name: string
          xp_reward?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          emoji?: string | null
          gold_reward?: number | null
          id?: string
          item_reward_id?: string | null
          name?: string
          xp_reward?: number | null
        }
        Relationships: []
      }
      active_pomodoros: {
        Row: {
          created_at: string | null
          duration_minutes: number
          ends_at: string
          id: string
          is_active: boolean | null
          is_paused: boolean | null
          overtime_seconds: number | null
          pause_periods: Json | null
          paused_seconds_remaining: number | null
          started_at: string
          task_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration_minutes: number
          ends_at: string
          id?: string
          is_active?: boolean | null
          is_paused?: boolean | null
          overtime_seconds?: number | null
          pause_periods?: Json | null
          paused_seconds_remaining?: number | null
          started_at: string
          task_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number
          ends_at?: string
          id?: string
          is_active?: boolean | null
          is_paused?: boolean | null
          overtime_seconds?: number | null
          pause_periods?: Json | null
          paused_seconds_remaining?: number | null
          started_at?: string
          task_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      daily_check_ins: {
        Row: {
          completed_at: string
          created_at: string | null
          date: string
          id: string
          user_id: string
        }
        Insert: {
          completed_at: string
          created_at?: string | null
          date: string
          id?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string | null
          date?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string | null
          description: string
          evaluated_at: string | null
          evaluation_note: string | null
          goal_type: string
          id: string
          is_active: boolean | null
          is_completed: boolean | null
          target_date: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          evaluated_at?: string | null
          evaluation_note?: string | null
          goal_type: string
          id?: string
          is_active?: boolean | null
          is_completed?: boolean | null
          target_date: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          evaluated_at?: string | null
          evaluation_note?: string | null
          goal_type?: string
          id?: string
          is_active?: boolean | null
          is_completed?: boolean | null
          target_date?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      items: {
        Row: {
          created_at: string | null
          description: string | null
          emoji: string | null
          gold_cost: number | null
          id: string
          is_purchasable: boolean | null
          item_type: string
          name: string
          rarity: string | null
          special_effects: Json | null
          stat_bonuses: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          gold_cost?: number | null
          id?: string
          is_purchasable?: boolean | null
          item_type: string
          name: string
          rarity?: string | null
          special_effects?: Json | null
          stat_bonuses?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          gold_cost?: number | null
          id?: string
          is_purchasable?: boolean | null
          item_type?: string
          name?: string
          rarity?: string | null
          special_effects?: Json | null
          stat_bonuses?: Json | null
        }
        Relationships: []
      }
      pomodoros: {
        Row: {
          accomplishment_note: string | null
          actual_duration_minutes: number | null
          completed_at: string | null
          completion_type: string | null
          created_at: string | null
          duration_minutes: number
          enemy_name: string | null
          enemy_type: string | null
          focus_rating: number | null
          id: string
          overtime_minutes: number | null
          pause_periods: Json | null
          started_at: string
          task_id: string | null
          user_id: string | null
        }
        Insert: {
          accomplishment_note?: string | null
          actual_duration_minutes?: number | null
          completed_at?: string | null
          completion_type?: string | null
          created_at?: string | null
          duration_minutes: number
          enemy_name?: string | null
          enemy_type?: string | null
          focus_rating?: number | null
          id?: string
          overtime_minutes?: number | null
          pause_periods?: Json | null
          started_at: string
          task_id?: string | null
          user_id?: string | null
        }
        Update: {
          accomplishment_note?: string | null
          actual_duration_minutes?: number | null
          completed_at?: string | null
          completion_type?: string | null
          created_at?: string | null
          duration_minutes?: number
          enemy_name?: string | null
          enemy_type?: string | null
          focus_rating?: number | null
          id?: string
          overtime_minutes?: number | null
          pause_periods?: Json | null
          started_at?: string
          task_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      revelations: {
        Row: {
          context_snapshot: Json | null
          created_at: string
          id: string
          provider: string
          revelation_text: string
          suggestion_type: string | null
          user_id: string
          user_message: string | null
        }
        Insert: {
          context_snapshot?: Json | null
          created_at?: string
          id?: string
          provider?: string
          revelation_text: string
          suggestion_type?: string | null
          user_id: string
          user_message?: string | null
        }
        Update: {
          context_snapshot?: Json | null
          created_at?: string
          id?: string
          provider?: string
          revelation_text?: string
          suggestion_type?: string | null
          user_id?: string
          user_message?: string | null
        }
        Relationships: []
      }
      task_relationships: {
        Row: {
          created_at: string | null
          daily_task_id: string
          id: string
          onetime_task_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          daily_task_id: string
          id?: string
          onetime_task_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          daily_task_id?: string
          id?: string
          onetime_task_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          archived_at: string | null
          category: string | null
          completed_at: string | null
          completed_minutes: number | null
          completed_pomodoros: number | null
          created_at: string | null
          deadline: string | null
          description: string | null
          estimated_minutes: number | null
          estimated_pomodoros: number | null
          id: string
          is_active: boolean | null
          is_archived: boolean | null
          is_completed: boolean | null
          is_locked: boolean | null
          priority: string | null
          required_item_id: string | null
          target_duration_minutes: number | null
          task_type: string
          title: string
          unlocked_by_task_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          archived_at?: string | null
          category?: string | null
          completed_at?: string | null
          completed_minutes?: number | null
          completed_pomodoros?: number | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          estimated_minutes?: number | null
          estimated_pomodoros?: number | null
          id?: string
          is_active?: boolean | null
          is_archived?: boolean | null
          is_completed?: boolean | null
          is_locked?: boolean | null
          priority?: string | null
          required_item_id?: string | null
          target_duration_minutes?: number | null
          task_type: string
          title: string
          unlocked_by_task_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          archived_at?: string | null
          category?: string | null
          completed_at?: string | null
          completed_minutes?: number | null
          completed_pomodoros?: number | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          estimated_minutes?: number | null
          estimated_pomodoros?: number | null
          id?: string
          is_active?: boolean | null
          is_archived?: boolean | null
          is_completed?: boolean | null
          is_locked?: boolean | null
          priority?: string | null
          required_item_id?: string | null
          target_duration_minutes?: number | null
          task_type?: string
          title?: string
          unlocked_by_task_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string | null
          id: string
          unlocked_at: string | null
          user_id: string | null
        }
        Insert: {
          achievement_id?: string | null
          id?: string
          unlocked_at?: string | null
          user_id?: string | null
        }
        Update: {
          achievement_id?: string | null
          id?: string
          unlocked_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_equipment: {
        Row: {
          accessory_1_id: string | null
          accessory_2_id: string | null
          armor_id: string | null
          updated_at: string | null
          user_id: string
          weapon_id: string | null
        }
        Insert: {
          accessory_1_id?: string | null
          accessory_2_id?: string | null
          armor_id?: string | null
          updated_at?: string | null
          user_id: string
          weapon_id?: string | null
        }
        Update: {
          accessory_1_id?: string | null
          accessory_2_id?: string | null
          armor_id?: string | null
          updated_at?: string | null
          user_id?: string
          weapon_id?: string | null
        }
        Relationships: []
      }
      user_inventory: {
        Row: {
          acquired_at: string | null
          id: string
          item_id: string | null
          quantity: number | null
          user_id: string | null
        }
        Insert: {
          acquired_at?: string | null
          id?: string
          item_id?: string | null
          quantity?: number | null
          user_id?: string | null
        }
        Update: {
          acquired_at?: string | null
          id?: string
          item_id?: string | null
          quantity?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          current_streak: number | null
          daily_reset_time: string | null
          id: string
          last_streak_date: string | null
          longest_streak: number | null
          pomodoro_duration: number | null
          rest_credits: number | null
          timezone_name: string | null
          total_pomodoros: number | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          daily_reset_time?: string | null
          id: string
          last_streak_date?: string | null
          longest_streak?: number | null
          pomodoro_duration?: number | null
          rest_credits?: number | null
          timezone_name?: string | null
          total_pomodoros?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          daily_reset_time?: string | null
          id?: string
          last_streak_date?: string | null
          longest_streak?: number | null
          pomodoro_duration?: number | null
          rest_credits?: number | null
          timezone_name?: string | null
          total_pomodoros?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_active_goals: {
        Args: { user_uuid: string }
        Returns: {
          days_remaining: number
          description: string
          goal_type: string
          target_date: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
