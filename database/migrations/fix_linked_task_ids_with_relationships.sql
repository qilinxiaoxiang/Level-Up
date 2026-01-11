-- Migration: Fix linked_task_ids to include related tasks from task_relationships
-- This updates existing pomodoros to include both the primary task and related tasks

-- Update pomodoros for one-time tasks that have related daily tasks
UPDATE pomodoros p
SET linked_task_ids = (
  SELECT jsonb_agg(DISTINCT task_id)
  FROM (
    -- Primary task
    SELECT p.task_id::text as task_id
    WHERE p.task_id IS NOT NULL

    UNION

    -- Related daily tasks (for one-time tasks)
    SELECT tr.daily_task_id::text as task_id
    FROM task_relationships tr
    WHERE tr.onetime_task_id = p.task_id
  ) AS all_tasks
)
WHERE p.task_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM task_relationships tr
    WHERE tr.onetime_task_id = p.task_id
  );

-- Verify the update
-- SELECT
--   p.id,
--   p.task_id,
--   p.linked_task_ids,
--   t.title as primary_task,
--   t.task_type
-- FROM pomodoros p
-- LEFT JOIN tasks t ON t.id = p.task_id
-- WHERE p.linked_task_ids IS NOT NULL
-- ORDER BY p.created_at DESC
-- LIMIT 10;
