-- Level Up - Database Schema
-- PostgreSQL / Supabase
--
-- This file contains all table definitions, indexes, triggers, and functions
-- Run this script in your Supabase SQL Editor to initialize the database

-- ============================================================
-- ENABLE EXTENSIONS
-- ============================================================
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USER PROFILES
-- ============================================================
-- Extends Supabase Auth users with game profile data
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Character Stats
  level INTEGER DEFAULT 1,
  current_xp INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  gold INTEGER DEFAULT 0,

  -- HP System
  current_hp INTEGER DEFAULT 100,
  max_hp INTEGER DEFAULT 100,

  -- Stats (grow with usage)
  strength INTEGER DEFAULT 1,
  intelligence INTEGER DEFAULT 1,
  discipline INTEGER DEFAULT 1,
  focus INTEGER DEFAULT 1,

  -- Preferences
  pomodoro_duration INTEGER DEFAULT 25, -- minutes
  daily_reset_time TIME DEFAULT '00:00:00',

  -- Tracking
  rest_credits INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_pomodoros INTEGER DEFAULT 0,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS last_streak_date DATE;

-- ============================================================
-- GOALS (3-year, 1-year, 1-month)
-- ============================================================
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,

  -- Goal Type
  goal_type TEXT NOT NULL CHECK (goal_type IN ('3year', '1year', '1month')),

  -- Content
  description TEXT NOT NULL,

  -- Timeline (fixed to creation date)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  target_date TIMESTAMPTZ NOT NULL, -- calculated as created_at + duration

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_completed BOOLEAN DEFAULT false,

  -- Evaluation (when goal period ends)
  evaluation_note TEXT,
  evaluated_at TIMESTAMPTZ,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_goals_user_type ON goals(user_id, goal_type);
CREATE INDEX idx_goals_active ON goals(user_id, is_active);

-- ============================================================
-- ITEMS (Equipment and Consumables) - MOVED UP BEFORE TASKS
-- ============================================================
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  item_type TEXT NOT NULL CHECK (item_type IN ('weapon', 'armor', 'accessory', 'consumable', 'special')),
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),

  -- Requirements
  required_level INTEGER DEFAULT 1,

  -- Shop Info
  is_purchasable BOOLEAN DEFAULT true,
  gold_cost INTEGER,

  -- Effects (JSON for flexibility)
  stat_bonuses JSONB, -- {"xp_multiplier": 1.1, "gold_bonus": 5}
  special_effects JSONB, -- {"hp_restore": 30, "duration_hours": 24}

  -- Visual (for later)
  emoji TEXT, -- temporary text representation

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TASKS (Daily and One-Time)
-- ============================================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,

  -- Basic Info
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'study', 'exercise', 'work', 'creative', 'admin'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'

  -- Task Type & Scheduling
  task_type TEXT NOT NULL CHECK (task_type IN ('daily', 'onetime')),

  -- For Daily Tasks
  target_duration_minutes INTEGER, -- e.g., 60 for 1 hour/day

  -- For One-Time Tasks
  deadline TIMESTAMPTZ,
  estimated_pomodoros INTEGER,
  estimated_minutes INTEGER,
  completed_pomodoros INTEGER DEFAULT 0,
  completed_minutes INTEGER DEFAULT 0,

  -- Rewards
  gold_reward INTEGER DEFAULT 10,
  xp_reward INTEGER DEFAULT 20,
  special_item_id UUID, -- optional unlock item

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,

  -- Unlocking
  is_locked BOOLEAN DEFAULT false,
  required_item_id UUID, -- item needed to unlock
  unlocked_by_task_id UUID, -- unlocks after completing another task

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_user_type ON tasks(user_id, task_type);
CREATE INDEX idx_tasks_active ON tasks(user_id, is_active);

-- ============================================================
-- TASK RELATIONSHIPS (One-Time ↔ Daily Links)
-- ============================================================
-- Links one-time tasks to daily tasks for shared time tracking
CREATE TABLE IF NOT EXISTS task_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  onetime_task_id UUID NOT NULL,
  daily_task_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(onetime_task_id, daily_task_id)
);

CREATE INDEX idx_task_relationships_onetime ON task_relationships(onetime_task_id);
CREATE INDEX idx_task_relationships_daily ON task_relationships(daily_task_id);
CREATE INDEX idx_task_relationships_user ON task_relationships(user_id);

-- ============================================================
-- ACTIVE POMODOROS (Single running session per user)
-- ============================================================
CREATE TABLE active_pomodoros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  task_id UUID,
  duration_minutes INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_active_pomodoros_user_active
  ON active_pomodoros(user_id)
  WHERE is_active = true;

-- ============================================================
-- DAILY TASK COMPLETIONS
-- ============================================================
-- Tracks daily progress for recurring tasks
CREATE TABLE daily_task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID,
  user_id UUID NOT NULL,

  date DATE NOT NULL,
  minutes_completed INTEGER DEFAULT 0,
  target_minutes INTEGER NOT NULL,
  is_completed BOOLEAN DEFAULT false,

  -- Rewards earned that day
  gold_earned INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(task_id, date)
);

CREATE INDEX idx_daily_completions_date ON daily_task_completions(user_id, date);

-- ============================================================
-- POMODOROS (Work Sessions / Battles)
-- ============================================================
CREATE TABLE pomodoros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  task_id UUID,

  -- Pomodoro Details
  duration_minutes INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,

  -- Battle Info
  enemy_type TEXT, -- based on category
  enemy_name TEXT, -- e.g., "Book Wyrm", "Slime"

  -- Focus & Results
  focus_rating INTEGER CHECK (focus_rating >= 1 AND focus_rating <= 5),
  accomplishment_note TEXT,

  -- Rewards
  gold_earned INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  item_dropped_id UUID,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pomodoros_user_date ON pomodoros(user_id, completed_at);
CREATE INDEX idx_pomodoros_task ON pomodoros(task_id);

-- ============================================================
-- USER INVENTORY
-- ============================================================
CREATE TABLE user_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  item_id UUID,

  quantity INTEGER DEFAULT 1, -- for stackable items (consumables)
  acquired_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, item_id)
);

CREATE INDEX idx_inventory_user ON user_inventory(user_id);

-- ============================================================
-- USER EQUIPMENT (What's Currently Equipped)
-- ============================================================
CREATE TABLE user_equipment (
  user_id UUID PRIMARY KEY,

  weapon_id UUID,
  armor_id UUID,
  accessory_1_id UUID,
  accessory_2_id UUID,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ACHIEVEMENTS
-- ============================================================
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'streak', 'completion', 'combat', 'collection'

  -- Unlock Criteria (JSON for flexibility)
  criteria JSONB, -- {"streak_days": 7} or {"total_pomodoros": 100}

  -- Rewards
  gold_reward INTEGER DEFAULT 0,
  xp_reward INTEGER DEFAULT 0,
  item_reward_id UUID,

  emoji TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USER ACHIEVEMENTS
-- ============================================================
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_id UUID,

  unlocked_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, achievement_id)
);

-- ============================================================
-- STREAK HISTORY
-- ============================================================
CREATE TABLE streak_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,

  streak_count INTEGER NOT NULL,
  started_at DATE NOT NULL,
  ended_at DATE,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SHOP ITEMS (User-defined goals to buy)
-- ============================================================
CREATE TABLE user_shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  gold_cost INTEGER NOT NULL,
  is_purchased BOOLEAN DEFAULT false,
  purchased_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_pomodoros ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoros ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_shop_items ENABLE ROW LEVEL SECURITY;

-- Items and Achievements are public (read-only for all users)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies for goals
CREATE POLICY "Users can manage own goals" ON goals
  FOR ALL USING (auth.uid() = user_id);

-- Policies for tasks
CREATE POLICY "Users can manage own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);

-- Policies for task_relationships
CREATE POLICY "Users can manage own task relationships" ON task_relationships
  FOR ALL USING (auth.uid() = user_id);

-- Policies for active_pomodoros
CREATE POLICY "Users can manage own active pomodoros" ON active_pomodoros
  FOR ALL USING (auth.uid() = user_id);

-- Policies for daily_task_completions
CREATE POLICY "Users can manage own daily completions" ON daily_task_completions
  FOR ALL USING (auth.uid() = user_id);

-- Policies for pomodoros
CREATE POLICY "Users can manage own pomodoros" ON pomodoros
  FOR ALL USING (auth.uid() = user_id);

-- Policies for user_inventory
CREATE POLICY "Users can manage own inventory" ON user_inventory
  FOR ALL USING (auth.uid() = user_id);

-- Policies for user_equipment
CREATE POLICY "Users can manage own equipment" ON user_equipment
  FOR ALL USING (auth.uid() = user_id);

-- Policies for user_achievements
CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for streak_history
CREATE POLICY "Users can view own streak history" ON streak_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage streak history" ON streak_history
  FOR ALL USING (auth.uid() = user_id);

-- Policies for user_shop_items
CREATE POLICY "Users can manage own shop items" ON user_shop_items
  FOR ALL USING (auth.uid() = user_id);

-- Policies for items (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view items" ON items
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policies for achievements (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view achievements" ON achievements
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_completions_updated_at
  BEFORE UPDATE ON daily_task_completions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_equipment_updated_at
  BEFORE UPDATE ON user_equipment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- DATABASE FUNCTIONS
-- ============================================================

-- Function to calculate XP needed for next level
-- Formula: level * 100 (can be adjusted)
CREATE OR REPLACE FUNCTION xp_needed_for_level(current_level INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN current_level * 100;
END;
$$ LANGUAGE plpgsql;

-- Function to add rewards and check for level up
CREATE OR REPLACE FUNCTION add_rewards(
  user_uuid UUID,
  gold_amount INTEGER,
  xp_amount INTEGER
)
RETURNS JSONB AS $$
DECLARE
  new_level INTEGER;
  new_xp INTEGER;
  xp_needed INTEGER;
  leveled_up BOOLEAN := false;
BEGIN
  -- Add gold and XP
  UPDATE user_profiles
  SET
    gold = gold + gold_amount,
    current_xp = current_xp + xp_amount,
    total_xp = total_xp + xp_amount
  WHERE id = user_uuid
  RETURNING level, current_xp INTO new_level, new_xp;

  -- Check for level up
  xp_needed := xp_needed_for_level(new_level);

  WHILE new_xp >= xp_needed LOOP
    new_xp := new_xp - xp_needed;
    new_level := new_level + 1;
    leveled_up := true;
    xp_needed := xp_needed_for_level(new_level);
  END LOOP;

  -- If leveled up, update profile
  IF leveled_up THEN
    UPDATE user_profiles
    SET
      level = new_level,
      current_xp = new_xp,
      max_hp = max_hp + 10 * (new_level - level) -- +10 HP per level
    WHERE id = user_uuid;
  END IF;

  -- Return result
  RETURN jsonb_build_object(
    'leveled_up', leveled_up,
    'new_level', new_level,
    'current_xp', new_xp
  );
END;
$$ LANGUAGE plpgsql;

-- Function to update HP
CREATE OR REPLACE FUNCTION update_hp(
  user_uuid UUID,
  hp_change INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  new_hp INTEGER;
  max_hp_value INTEGER;
BEGIN
  SELECT current_hp + hp_change, max_hp
  INTO new_hp, max_hp_value
  FROM user_profiles
  WHERE id = user_uuid;

  -- Clamp HP between 0 and max_hp
  new_hp := LEAST(GREATEST(new_hp, 0), max_hp_value);

  UPDATE user_profiles
  SET current_hp = new_hp
  WHERE id = user_uuid;

  RETURN new_hp;
END;
$$ LANGUAGE plpgsql;

-- Function to get active goals
CREATE OR REPLACE FUNCTION get_active_goals(user_uuid UUID)
RETURNS TABLE (
  goal_type TEXT,
  description TEXT,
  target_date TIMESTAMPTZ,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.goal_type,
    g.description,
    g.target_date,
    EXTRACT(DAY FROM g.target_date - NOW())::INTEGER as days_remaining
  FROM goals g
  WHERE g.user_id = user_uuid
    AND g.is_active = true
  ORDER BY
    CASE g.goal_type
      WHEN '1month' THEN 1
      WHEN '1year' THEN 2
      WHEN '3year' THEN 3
    END;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SEED DATA (Optional - for testing)
-- ============================================================

-- Insert some starter items
INSERT INTO items (name, description, item_type, rarity, gold_cost, stat_bonuses, emoji) VALUES
  ('Rusty Sword', 'A basic weapon for beginners', 'weapon', 'common', 50, '{"xp_multiplier": 1.05}', '🗡️'),
  ('Wooden Shield', 'Provides minimal protection', 'armor', 'common', 50, '{"hp_bonus": 10}', '🛡️'),
  ('HP Potion', 'Restores 30 HP', 'consumable', 'common', 20, '{}', '🧪'),
  ('Focus Elixir', 'Doubles XP for 3 Pomodoros', 'consumable', 'uncommon', 100, '{}', '✨'),
  ('Iron Sword', 'A solid weapon', 'weapon', 'uncommon', 200, '{"xp_multiplier": 1.15}', '⚔️'),
  ('Steel Armor', 'Good protection', 'armor', 'uncommon', 250, '{"hp_bonus": 25}', '🛡️'),
  ('Dragon Blade', 'A legendary weapon', 'weapon', 'legendary', 5000, '{"xp_multiplier": 1.5, "gold_bonus": 50}', '🐉');

-- Insert some achievements
INSERT INTO achievements (name, description, category, criteria, gold_reward, xp_reward, emoji) VALUES
  ('First Blood', 'Complete your first Pomodoro', 'combat', '{"total_pomodoros": 1}', 50, 100, '⚔️'),
  ('Week Warrior', 'Maintain a 7-day streak', 'streak', '{"streak_days": 7}', 100, 200, '🔥'),
  ('Century Club', 'Complete 100 Pomodoros', 'combat', '{"total_pomodoros": 100}', 500, 1000, '💯'),
  ('Dedication', 'Maintain a 30-day streak', 'streak', '{"streak_days": 30}', 500, 1000, '🏆'),
  ('Level 10', 'Reach level 10', 'completion', '{"level": 10}', 1000, 0, '⭐'),
  ('Wealthy', 'Accumulate 10,000 gold', 'collection', '{"total_gold": 10000}', 0, 2000, '💰');

-- Seed initial user profile if the auth user already exists
INSERT INTO user_profiles (id, username, created_at)
SELECT id, email, NOW()
FROM auth.users
WHERE email = 'zhengxia@andrew.cmu.edu'
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================================
-- This trigger automatically creates a user_profiles record when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- MIGRATIONS / CLEANUP STATEMENTS
-- ============================================================

-- Remove active_days column if it exists (from earlier design)
ALTER TABLE tasks
  DROP COLUMN IF EXISTS active_days;

-- Backfill estimated_minutes from estimated_pomodoros if needed
UPDATE tasks
SET estimated_minutes = COALESCE(estimated_minutes, estimated_pomodoros * 25)
WHERE estimated_minutes IS NULL
  AND estimated_pomodoros IS NOT NULL;

-- ============================================================
-- DONE!
-- ============================================================
-- Your database is now ready!
--
-- Next steps:
-- 1. Start building your frontend
-- 2. Test with sample data
