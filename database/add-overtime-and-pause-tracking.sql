-- Migration: Add Overtime and Pause Tracking
-- Date: 2026-01-02
-- Description: Adds overtime tracking and pause periods to active_pomodoros and pomodoros tables

-- ============================================================
-- ALTER ACTIVE_POMODOROS TABLE
-- ============================================================

-- Add overtime_seconds to track time beyond original duration
ALTER TABLE active_pomodoros
  ADD COLUMN IF NOT EXISTS overtime_seconds INTEGER DEFAULT 0;

-- Add pause_periods to track multiple pause/resume cycles
ALTER TABLE active_pomodoros
  ADD COLUMN IF NOT EXISTS pause_periods JSONB DEFAULT '[]'::jsonb;

-- ============================================================
-- ALTER POMODOROS TABLE
-- ============================================================

-- Add actual_duration_minutes to track the final duration user chose
ALTER TABLE pomodoros
  ADD COLUMN IF NOT EXISTS actual_duration_minutes INTEGER;

-- Add overtime_minutes to track overtime that occurred
ALTER TABLE pomodoros
  ADD COLUMN IF NOT EXISTS overtime_minutes INTEGER DEFAULT 0;

-- Add completion_type to distinguish between natural, manual, and overtime completions
ALTER TABLE pomodoros
  ADD COLUMN IF NOT EXISTS completion_type TEXT DEFAULT 'natural';

-- Add constraint for completion_type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'pomodoros_completion_type_check'
  ) THEN
    ALTER TABLE pomodoros
      ADD CONSTRAINT pomodoros_completion_type_check
      CHECK (completion_type IN ('natural', 'manual', 'overtime'));
  END IF;
END $$;

-- Add pause_periods to track pause/resume cycles
ALTER TABLE pomodoros
  ADD COLUMN IF NOT EXISTS pause_periods JSONB DEFAULT '[]'::jsonb;

-- ============================================================
-- UPDATE EXISTING DATA
-- ============================================================

-- For existing pomodoros, set actual_duration_minutes to duration_minutes
UPDATE pomodoros
SET actual_duration_minutes = duration_minutes
WHERE actual_duration_minutes IS NULL;

-- ============================================================
-- DONE!
-- ============================================================
-- Your database now supports overtime tracking and pause periods!
--
-- Next steps:
-- 1. Update your frontend to use these new fields
-- 2. Test the new overtime and pause functionality
