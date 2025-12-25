-- Re-runnable migration to add last streak date

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS last_streak_date DATE;
