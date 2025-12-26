import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Task } from '../../types';

interface TaskRelationshipManagerProps {
  task: Task;
  userId: string;
  defaultOpen?: boolean;
  deferred?: boolean;
}

interface RelatedTask {
  id: string;
  title: string;
  category: string | null;
  task_type: 'daily' | 'onetime';
}

export interface TaskRelationshipHandle {
  saveDraft: () => Promise<void>;
  resetDraft: () => void;
}

const TaskRelationshipManager = forwardRef<TaskRelationshipHandle, TaskRelationshipManagerProps>(
  ({ task, userId, defaultOpen = false, deferred = false }, ref) => {
  const [relatedTasks, setRelatedTasks] = useState<RelatedTask[]>([]);
  const [oppositeTasks, setOppositeTasks] = useState<RelatedTask[]>([]);
  const [showManager, setShowManager] = useState(defaultOpen);
  const [loading, setLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [draftRelatedIds, setDraftRelatedIds] = useState<string[]>([]);
  const [hasDraftChanges, setHasDraftChanges] = useState(false);

  useEffect(() => {
    fetchRelatedTasks();
  }, [task.id]);

  useEffect(() => {
    setShowManager(defaultOpen);
  }, [defaultOpen]);

  useEffect(() => {
    if (!showManager) return;
    fetchRelatedTasks();
    fetchOppositeTasks();
  }, [showManager, task.id, userId]);

  const fetchRelatedTasks = async () => {
    setLoading(true);
    try {
      // Fetch existing relationships
      const { data: relationships } = await supabase
        .from('task_relationships')
        .select('onetime_task_id, daily_task_id')
        .or(`onetime_task_id.eq.${task.id},daily_task_id.eq.${task.id}`);

      if (relationships) {
        const relatedTaskIds: string[] = [];
        relationships.forEach((rel) => {
          if (rel.onetime_task_id === task.id) {
            relatedTaskIds.push(rel.daily_task_id);
          } else if (rel.daily_task_id === task.id) {
            relatedTaskIds.push(rel.onetime_task_id);
          }
        });

        if (relatedTaskIds.length > 0) {
          const { data: tasksData } = await supabase
            .from('tasks')
            .select('id, title, category, task_type')
            .in('id', relatedTaskIds);

          if (tasksData) {
            setRelatedTasks(tasksData as RelatedTask[]);
          }
        } else {
          setRelatedTasks([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch related tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOppositeTasks = async () => {
    try {
      // Fetch tasks that can be linked (opposite type)
      const oppositeType = task.task_type === 'daily' ? 'onetime' : 'daily';
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, category, task_type')
        .eq('user_id', userId)
        .eq('task_type', oppositeType)
        .eq('is_archived', false)
        .order('title');

      if (tasks) {
        setOppositeTasks(tasks as RelatedTask[]);
      }
    } catch (error) {
      console.error('Failed to fetch opposite tasks:', error);
    }
  };

  const handleLinkTask = async (relatedTaskId: string) => {
    try {
      setIsMutating(true);
      const onetimeTaskId = task.task_type === 'onetime' ? task.id : relatedTaskId;
      const dailyTaskId = task.task_type === 'daily' ? task.id : relatedTaskId;

      await supabase.from('task_relationships').insert({
        user_id: userId,
        onetime_task_id: onetimeTaskId,
        daily_task_id: dailyTaskId,
      });

      fetchRelatedTasks();
    } catch (error) {
      console.error('Failed to link task:', error);
    } finally {
      setIsMutating(false);
    }
  };

  const handleUnlinkTask = async (relatedTaskId: string) => {
    try {
      setIsMutating(true);
      const onetimeTaskId = task.task_type === 'onetime' ? task.id : relatedTaskId;
      const dailyTaskId = task.task_type === 'daily' ? task.id : relatedTaskId;

      await supabase
        .from('task_relationships')
        .delete()
        .eq('onetime_task_id', onetimeTaskId)
        .eq('daily_task_id', dailyTaskId);

      fetchRelatedTasks();
    } catch (error) {
      console.error('Failed to unlink task:', error);
    } finally {
      setIsMutating(false);
    }
  };

  const relatedTaskIds = useMemo(() => relatedTasks.map((rel) => rel.id), [relatedTasks]);

  useEffect(() => {
    if (!showManager) return;
    if (deferred && !hasDraftChanges) {
      setDraftRelatedIds(relatedTaskIds);
    }
  }, [showManager, deferred, relatedTaskIds, hasDraftChanges]);

  const toggleDraft = (taskId: string) => {
    setDraftRelatedIds((prev) => {
      const next = prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId];
      setHasDraftChanges(true);
      return next;
    });
  };

  const handleSaveDraft = async () => {
    if (!deferred) return;
    if (!hasDraftChanges) return;
    setIsMutating(true);
    try {
      const currentIds = relatedTaskIds;
      const toAdd = draftRelatedIds.filter((id) => !currentIds.includes(id));
      const toRemove = currentIds.filter((id) => !draftRelatedIds.includes(id));

      if (toAdd.length > 0) {
        const rows = toAdd.map((relatedId) => ({
          user_id: userId,
          onetime_task_id: task.task_type === 'onetime' ? task.id : relatedId,
          daily_task_id: task.task_type === 'daily' ? task.id : relatedId,
        }));
        const { error } = await supabase.from('task_relationships').insert(rows);
        if (error) throw error;
      }

      if (toRemove.length > 0) {
        const query = supabase.from('task_relationships').delete();
        if (task.task_type === 'onetime') {
          const { error } = await query
            .eq('onetime_task_id', task.id)
            .in('daily_task_id', toRemove);
          if (error) throw error;
        } else {
          const { error } = await query
            .eq('daily_task_id', task.id)
            .in('onetime_task_id', toRemove);
          if (error) throw error;
        }
      }

      await fetchRelatedTasks();
      setHasDraftChanges(false);
    } catch (error) {
      console.error('Failed to save task relationships:', error);
      throw error;
    } finally {
      setIsMutating(false);
    }
  };

  useImperativeHandle(
    ref,
    () => ({
      saveDraft: handleSaveDraft,
      resetDraft: () => {
        setDraftRelatedIds(relatedTaskIds);
        setHasDraftChanges(false);
      },
    }),
    [handleSaveDraft, relatedTaskIds]
  );

  if (!showManager) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400">
        Toggle tasks to relate/unrelate. Pomodoros add minutes to both tasks; stats stay single-source.
      </p>
      {loading && (
        <p className="text-xs text-gray-500">Loading tasks...</p>
      )}
      {oppositeTasks.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-2">
          No available tasks to link.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {oppositeTasks.map((availableTask) => {
            const isRelated = deferred
              ? draftRelatedIds.includes(availableTask.id)
              : relatedTaskIds.includes(availableTask.id);
            return (
              <button
                key={availableTask.id}
                type="button"
                disabled={isMutating}
                aria-pressed={isRelated}
                onClick={() =>
                  deferred
                    ? toggleDraft(availableTask.id)
                    : isRelated
                    ? handleUnlinkTask(availableTask.id)
                    : handleLinkTask(availableTask.id)
                }
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                  isRelated
                    ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40'
                    : 'bg-slate-800 text-gray-300 border-slate-700 hover:text-white hover:border-slate-500'
                } ${isMutating ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {availableTask.title}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
  }
);

TaskRelationshipManager.displayName = 'TaskRelationshipManager';

export default TaskRelationshipManager;
