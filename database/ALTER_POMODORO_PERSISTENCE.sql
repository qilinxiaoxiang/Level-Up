-- Re-runnable migration for persistent pomodoro sessions and time-based task progress

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS completed_minutes INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS active_pomodoros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  task_id UUID,
  duration_minutes INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_active_pomodoros_user_active
  ON active_pomodoros(user_id)
  WHERE is_active = true;

ALTER TABLE active_pomodoros ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'active_pomodoros'
      AND policyname = 'Users can manage own active pomodoros'
  ) THEN
    CREATE POLICY "Users can manage own active pomodoros" ON active_pomodoros
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END
$$;
