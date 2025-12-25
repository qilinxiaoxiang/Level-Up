-- Re-runnable migration to move one-time task estimate to minutes

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER;

-- Optional backfill from pomodoros if already used
UPDATE tasks
SET estimated_minutes = COALESCE(estimated_minutes, estimated_pomodoros * 25)
WHERE estimated_minutes IS NULL
  AND estimated_pomodoros IS NOT NULL;
