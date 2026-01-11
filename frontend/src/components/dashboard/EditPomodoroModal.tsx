import { useEffect, useState } from 'react';
import { X, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Task, PausePeriod } from '../../types';

interface TaskOption {
  id: string;
  title: string;
  task_type: string;
  category: string;
}

interface EditPomodoroModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  pomodoro: {
    id: string;
    task_id: string | null;
    linked_task_ids?: string[] | null;
    duration_minutes: number;
    actual_duration_minutes?: number | null;
    overtime_minutes?: number | null;
    completion_type?: string | null;
    pause_periods?: PausePeriod[] | null;
    started_at: string;
    completed_at: string | null;
    focus_rating: number | null;
    accomplishment_note: string | null;
    primaryTask?: Task;
    linkedTasks?: Task[];
  } | null;
  onSave: () => void;
}

const EditPomodoroModal = ({ isOpen, onClose, userId, pomodoro, onSave }: EditPomodoroModalProps) => {
  const [focusRating, setFocusRating] = useState<number>(1);
  const [accomplishmentNote, setAccomplishmentNote] = useState<string>('');
  const [actualDuration, setActualDuration] = useState<number>(0);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [tasks, setTasks] = useState<TaskOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && pomodoro) {
      // Initialize form with current values
      setFocusRating(pomodoro.focus_rating || 1);
      setAccomplishmentNote(pomodoro.accomplishment_note || '');
      setActualDuration(pomodoro.actual_duration_minutes || pomodoro.duration_minutes);

      // Initialize selected tasks from linked_task_ids or fallback to task_id
      const initialTaskIds = pomodoro.linked_task_ids && pomodoro.linked_task_ids.length > 0
        ? pomodoro.linked_task_ids
        : pomodoro.task_id
          ? [pomodoro.task_id]
          : [];
      setSelectedTaskIds(new Set(initialTaskIds));

      // Fetch all tasks for the task selector
      fetchTasks();
    }
  }, [isOpen, pomodoro]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, task_type, category')
        .eq('user_id', userId)
        .eq('is_archived', false)
        .order('title', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  const toggleTask = (taskId: string) => {
    const newSelected = new Set(selectedTaskIds);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTaskIds(newSelected);
  };

  const handleSave = async () => {
    if (!pomodoro) return;

    setLoading(true);
    setError(null);

    try {
      const oldDuration = pomodoro.actual_duration_minutes || pomodoro.duration_minutes;

      // Get old linked task IDs (from linked_task_ids or fallback to task_id)
      const oldTaskIds = pomodoro.linked_task_ids && pomodoro.linked_task_ids.length > 0
        ? new Set(pomodoro.linked_task_ids)
        : pomodoro.task_id
          ? new Set([pomodoro.task_id])
          : new Set<string>();

      const newTaskIds = selectedTaskIds;
      const durationChanged = oldDuration !== actualDuration;

      // Find tasks that were added, removed, or kept
      const addedTaskIds = Array.from(newTaskIds).filter(id => !oldTaskIds.has(id));
      const removedTaskIds = Array.from(oldTaskIds).filter(id => !newTaskIds.has(id));
      const keptTaskIds = Array.from(newTaskIds).filter(id => oldTaskIds.has(id));

      // Remove progress from tasks that are no longer linked
      for (const taskId of removedTaskIds) {
        const { data: taskData } = await supabase
          .from('tasks')
          .select('completed_pomodoros, completed_minutes, task_type')
          .eq('id', taskId)
          .limit(1);

        const task = taskData?.[0];
        if (task) {
          await supabase
            .from('tasks')
            .update({
              completed_pomodoros: Math.max((task.completed_pomodoros || 0) - 1, 0),
              completed_minutes: Math.max((task.completed_minutes || 0) - oldDuration, 0),
            })
            .eq('id', taskId);
        }
      }

      // Add progress to newly linked tasks
      for (const taskId of addedTaskIds) {
        const { data: taskData } = await supabase
          .from('tasks')
          .select('completed_pomodoros, completed_minutes, task_type, estimated_minutes')
          .eq('id', taskId)
          .limit(1);

        const task = taskData?.[0];
        if (task) {
          const newCompletedPomodoros = (task.completed_pomodoros || 0) + 1;
          const newCompletedMinutes = (task.completed_minutes || 0) + actualDuration;

          // Check if one-time task is now complete
          const isCompleted = task.task_type === 'onetime' &&
            task.estimated_minutes &&
            newCompletedMinutes >= task.estimated_minutes;

          await supabase
            .from('tasks')
            .update({
              completed_pomodoros: newCompletedPomodoros,
              completed_minutes: newCompletedMinutes,
              ...(task.task_type === 'onetime' && {
                is_completed: isCompleted,
                completed_at: isCompleted ? new Date().toISOString() : null,
              }),
            })
            .eq('id', taskId);
        }
      }

      // Adjust duration for tasks that remained linked
      if (durationChanged && keptTaskIds.length > 0) {
        for (const taskId of keptTaskIds) {
          const { data: taskData } = await supabase
            .from('tasks')
            .select('completed_minutes, task_type, estimated_minutes')
            .eq('id', taskId)
            .limit(1);

          const task = taskData?.[0];
          if (task) {
            const durationDiff = actualDuration - oldDuration;
            const newCompletedMinutes = (task.completed_minutes || 0) + durationDiff;

            // Check if one-time task is now complete
            const isCompleted = task.task_type === 'onetime' &&
              task.estimated_minutes &&
              newCompletedMinutes >= task.estimated_minutes;

            await supabase
              .from('tasks')
              .update({
                completed_minutes: Math.max(newCompletedMinutes, 0),
                ...(task.task_type === 'onetime' && {
                  is_completed: isCompleted,
                  completed_at: isCompleted ? new Date().toISOString() : null,
                }),
              })
              .eq('id', taskId);
          }
        }
      }

      // Update the pomodoro
      const linkedTaskIdsArray = Array.from(newTaskIds);
      const { error: updateError } = await supabase
        .from('pomodoros')
        .update({
          focus_rating: focusRating,
          accomplishment_note: accomplishmentNote,
          actual_duration_minutes: actualDuration,
          linked_task_ids: linkedTaskIdsArray,
          // Keep task_id for backward compatibility (use first task or null)
          task_id: linkedTaskIdsArray.length > 0 ? linkedTaskIdsArray[0] : null,
        })
        .eq('id', pomodoro.id);

      if (updateError) throw updateError;

      // Success - refresh parent and close
      onSave();
      onClose();
    } catch (err) {
      console.error('Error updating pomodoro:', err);
      setError('Failed to update pomodoro. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !pomodoro) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-purple-500/30 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Edit Pomodoro</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-5">
          {/* Focus Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Focus Rating
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFocusRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={
                      star <= focusRating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-600 hover:text-gray-500'
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-300 mb-2">
              Duration (minutes)
            </label>
            <input
              type="number"
              id="duration"
              min="1"
              max="300"
              value={actualDuration}
              onChange={(e) => setActualDuration(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Original: {pomodoro.duration_minutes}m
              {pomodoro.overtime_minutes && pomodoro.overtime_minutes > 0 && (
                <span className="text-orange-400"> (+{pomodoro.overtime_minutes}m overtime)</span>
              )}
            </p>
          </div>

          {/* Linked Tasks (Multi-select) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Linked Tasks {selectedTaskIds.size > 0 && `(${selectedTaskIds.size} selected)`}
            </label>
            <div className="bg-slate-800 border border-slate-700 rounded-lg max-h-48 overflow-y-auto">
              {tasks.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500">No tasks available</div>
              ) : (
                tasks.map((task) => (
                  <label
                    key={task.id}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700/50 cursor-pointer transition-colors border-b border-slate-700/50 last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTaskIds.has(task.id)}
                      onChange={() => toggleTask(task.id)}
                      className="w-4 h-4 bg-slate-700 border-slate-600 rounded text-purple-500 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0"
                    />
                    <span className="flex-1 text-sm text-white">
                      {task.title}
                      <span className="ml-2 text-xs text-gray-500">
                        ({task.task_type === 'daily' ? 'Daily' : 'One-time'})
                      </span>
                    </span>
                  </label>
                ))
              )}
            </div>
            {pomodoro.linkedTasks && pomodoro.linkedTasks.length > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                Currently: {pomodoro.linkedTasks.map(t => t.title).join(', ')}
              </p>
            )}
          </div>

          {/* Accomplishment Note */}
          <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-300 mb-2">
              Accomplishment Note
            </label>
            <textarea
              id="note"
              rows={4}
              value={accomplishmentNote}
              onChange={(e) => setAccomplishmentNote(e.target.value)}
              placeholder="What did you accomplish during this pomodoro?"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-slate-700 text-gray-300 rounded-lg text-sm font-semibold hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-purple-500 text-white rounded-lg text-sm font-semibold hover:bg-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPomodoroModal;
