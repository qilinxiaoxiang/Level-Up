-- Migration: Add linked_task_ids column to pomodoros table
-- This allows pomodoros to be linked to multiple tasks instead of just one

-- Add the new column
ALTER TABLE pomodoros
ADD COLUMN IF NOT EXISTS linked_task_ids JSONB DEFAULT '[]'::jsonb;

-- Migrate existing data: copy task_id into linked_task_ids as a single-element array
UPDATE pomodoros
SET linked_task_ids = jsonb_build_array(task_id::text)
WHERE task_id IS NOT NULL AND (linked_task_ids IS NULL OR linked_task_ids = '[]'::jsonb);

-- Note: We keep task_id column for backward compatibility
-- New code should use linked_task_ids, but old code can still read task_id
