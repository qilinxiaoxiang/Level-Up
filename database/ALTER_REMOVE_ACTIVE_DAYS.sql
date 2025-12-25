-- Re-runnable migration to remove active_days from tasks
ALTER TABLE tasks
  DROP COLUMN IF EXISTS active_days;
