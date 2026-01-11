import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { X, Clock, Star, Pen, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getStartOfDayUTC, getEndOfDayUTC } from '../../utils/dateUtils';
import type { Pomodoro, Task, PausePeriod } from '../../types';
import EditPomodoroModal from './EditPomodoroModal';

interface TodayPomodorosModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  timezone: string;
  specificDate?: string; // Optional: YYYY-MM-DD format. If not provided, uses today
  isCompleted?: boolean; // Whether the day has a check-in
  restCredits?: number; // Available rest credits
  onMakeUp?: () => void; // Callback when user makes up the day
}

interface PomodoroWithDetails {
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
  linkedTasks: Task[];
}

const convertToDetailedPomodoro = (pomodoro: any, primaryTask?: Task, linkedTasks: Task[] = []): PomodoroWithDetails => {
  return {
    id: pomodoro.id,
    task_id: pomodoro.task_id,
    linked_task_ids: pomodoro.linked_task_ids,
    duration_minutes: pomodoro.duration_minutes,
    actual_duration_minutes: pomodoro.actual_duration_minutes,
    overtime_minutes: pomodoro.overtime_minutes,
    completion_type: pomodoro.completion_type,
    pause_periods: Array.isArray(pomodoro.pause_periods) ? pomodoro.pause_periods : [],
    started_at: pomodoro.started_at,
    completed_at: pomodoro.completed_at,
    focus_rating: pomodoro.focus_rating,
    accomplishment_note: pomodoro.accomplishment_note,
    primaryTask,
    linkedTasks,
  };
};

const TodayPomodorosModal = ({
  isOpen,
  onClose,
  userId,
  timezone,
  specificDate,
  isCompleted = false,
  restCredits = 0,
  onMakeUp
}: TodayPomodorosModalProps) => {
  const [pomodoros, setPomodoros] = useState<PomodoroWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMakeUpConfirm, setShowMakeUpConfirm] = useState(false);
  const [editingPomodoro, setEditingPomodoro] = useState<PomodoroWithDetails | null>(null);
  const [deletingPomodoroId, setDeletingPomodoroId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTodayPomodoros();
    }
  }, [isOpen, userId, specificDate]);

  const fetchTodayPomodoros = async () => {
    setLoading(true);
    setError(null);

    try {
      // Determine date range
      let dayStart: string;
      let dayEnd: string;

      if (specificDate) {
        // Use specific date
        const targetDate = new Date(specificDate + 'T00:00:00');
        dayStart = new Date(targetDate.setHours(0, 0, 0, 0)).toISOString();
        dayEnd = new Date(targetDate.setHours(23, 59, 59, 999)).toISOString();
      } else {
        // Use today
        dayStart = getStartOfDayUTC();
        dayEnd = getEndOfDayUTC();
      }

      // 1. Fetch pomodoros for the date range
      const { data: pomodorosData, error: pomodorosError } = await supabase
        .from('pomodoros')
        .select('id, task_id, linked_task_ids, duration_minutes, actual_duration_minutes, overtime_minutes, completion_type, pause_periods, started_at, completed_at, focus_rating, accomplishment_note')
        .eq('user_id', userId)
        .gte('completed_at', dayStart)
        .lte('completed_at', dayEnd)
        .not('completed_at', 'is', null)
        .order('started_at', { ascending: true });

      if (pomodorosError) throw pomodorosError;
      if (!pomodorosData || pomodorosData.length === 0) {
        setPomodoros([]);
        setLoading(false);
        return;
      }

      // 2. Get unique task IDs from linked_task_ids or fallback to task_id
      const taskIds = [...new Set(
        pomodorosData.flatMap(p => {
          // Prefer linked_task_ids, fallback to task_id
          if (p.linked_task_ids && Array.isArray(p.linked_task_ids) && p.linked_task_ids.length > 0) {
            return p.linked_task_ids;
          } else if (p.task_id) {
            return [p.task_id];
          }
          return [];
        })
      )] as string[];

      // 3. Fetch all tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('id, title, task_type, category')
        .in('id', taskIds);

      if (tasksError) throw tasksError;

      // Create task lookup map
      const tasksMap = new Map<string, Task>();
      tasksData?.forEach(task => tasksMap.set(task.id, task as Task));

      // 4. Combine data - use linked_task_ids to get all linked tasks
      const enrichedPomodoros: PomodoroWithDetails[] = pomodorosData.map(pomodoro => {
        // Get task IDs from linked_task_ids or fallback to task_id
        const rawLinkedIds = pomodoro.linked_task_ids;
        const linkedIds = (Array.isArray(rawLinkedIds) && rawLinkedIds.length > 0)
          ? (rawLinkedIds as string[])
          : pomodoro.task_id
            ? [pomodoro.task_id]
            : [];

        // Get all linked tasks (filter out deleted tasks)
        const linkedTasks = linkedIds
          .map(id => tasksMap.get(id))
          .filter(task => task !== undefined) as Task[];

        // For backward compatibility, set primaryTask as first linked task
        const primaryTask = linkedTasks.length > 0 ? linkedTasks[0] : undefined;

        return convertToDetailedPomodoro(pomodoro, primaryTask, linkedTasks);
      });

      setPomodoros(enrichedPomodoros);
    } catch (err) {
      console.error('Error fetching today\'s pomodoros:', err);
      setError('Failed to load pomodoros. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const formatTimeRange = (
    startedAt: string | null,
    completedAt: string | null,
    durationMinutes: number,
    actualDurationMinutes: number | null,
    completionType: string | null
  ) => {
    if (!completedAt || !startedAt) return '';

    const duration = actualDurationMinutes || durationMinutes;

    if (completionType === 'manual') {
      // Manual completion (makeup pomodoro): trace back from completed_at
      const end = new Date(completedAt);
      const start = new Date(end.getTime() - duration * 60 * 1000);
      return `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
    } else {
      // Natural or overtime completion: use actual started_at
      const start = new Date(startedAt);
      const end = new Date(start.getTime() + duration * 60 * 1000);
      return `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
    }
  };

  const calculateWorkPeriods = (
    startedAt: string,
    completedAt: string,
    pausePeriods: PausePeriod[] | null | undefined
  ): string[] => {
    if (!pausePeriods || pausePeriods.length === 0) {
      // No pauses - single time slot
      return [`${format(new Date(startedAt), 'h:mm a')} - ${format(new Date(completedAt), 'h:mm a')}`];
    }

    const periods: string[] = [];
    let currentStart = new Date(startedAt);

    // Sort pause periods by paused_at time
    const sortedPauses = [...pausePeriods].sort((a, b) =>
      new Date(a.paused_at).getTime() - new Date(b.paused_at).getTime()
    );

    sortedPauses.forEach(pause => {
      const pauseTime = new Date(pause.paused_at);
      // Add work period before this pause
      periods.push(`${format(currentStart, 'h:mm a')} - ${format(pauseTime, 'h:mm a')}`);

      // Next work period starts when resumed (or skip if no resume time)
      if (pause.resumed_at) {
        currentStart = new Date(pause.resumed_at);
      }
    });

    // Add final work period from last resume to completion
    const lastPause = sortedPauses[sortedPauses.length - 1];
    if (lastPause?.resumed_at) {
      periods.push(`${format(new Date(lastPause.resumed_at), 'h:mm a')} - ${format(new Date(completedAt), 'h:mm a')}`);
    }

    return periods;
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-xs text-gray-500">No rating</span>;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            size={14}
            className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}
          />
        ))}
      </div>
    );
  };

  const getCategoryColor = (category: string | null | undefined) => {
    switch (category) {
      case 'study':
        return 'text-blue-400';
      case 'work':
        return 'text-purple-400';
      case 'exercise':
        return 'text-emerald-400';
      case 'creative':
        return 'text-pink-400';
      case 'admin':
        return 'text-orange-400';
      default:
        return 'text-gray-300';
    }
  };

  const totalMinutes = pomodoros.reduce((sum, p) => sum + (p.actual_duration_minutes || p.duration_minutes || 0), 0);
  const totalCount = pomodoros.length;

  const getModalTitle = () => {
    if (specificDate) {
      const date = new Date(specificDate + 'T00:00:00');
      return format(date, 'MMM d, yyyy') + ' Pomodoros';
    }
    return "Today's Pomodoros";
  };

  const isToday = () => {
    if (!specificDate) return true; // If no specific date, it's today's modal
    const today = new Date();
    const selected = new Date(specificDate + 'T00:00:00');
    return (
      selected.getFullYear() === today.getFullYear() &&
      selected.getMonth() === today.getMonth() &&
      selected.getDate() === today.getDate()
    );
  };

  const handleDeletePomodoro = async (pomodoroId: string) => {
    try {
      // First, get the pomodoro data to update task progress
      const { data: pomodoroData, error: fetchError } = await supabase
        .from('pomodoros')
        .select('task_id, linked_task_ids, duration_minutes, actual_duration_minutes')
        .eq('id', pomodoroId)
        .limit(1);

      if (fetchError) throw fetchError;

      const pomodoro = pomodoroData?.[0];
      if (!pomodoro) {
        throw new Error('Pomodoro not found');
      }

      const duration = pomodoro.actual_duration_minutes || pomodoro.duration_minutes;

      // Get linked task IDs (prefer linked_task_ids, fallback to task_id)
      const rawLinkedIds = pomodoro.linked_task_ids;
      const linkedIds = (Array.isArray(rawLinkedIds) && rawLinkedIds.length > 0)
        ? (rawLinkedIds as string[])
        : pomodoro.task_id
          ? [pomodoro.task_id]
          : [];

      // Update progress for all linked tasks
      for (const taskId of linkedIds) {
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
              completed_minutes: Math.max((task.completed_minutes || 0) - duration, 0),
            })
            .eq('id', taskId);
        }
      }

      // Delete the pomodoro
      const { error: deleteError } = await supabase
        .from('pomodoros')
        .delete()
        .eq('id', pomodoroId);

      if (deleteError) throw deleteError;

      // Refresh the list
      await fetchTodayPomodoros();
      setDeletingPomodoroId(null);
    } catch (err) {
      console.error('Error deleting pomodoro:', err);
      setError('Failed to delete pomodoro. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg bg-slate-900 rounded-2xl border border-purple-500/30 shadow-2xl p-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">{getModalTitle()}</h2>
            {!isCompleted && !isToday() && onMakeUp && (
              <button
                onClick={() => restCredits > 0 && setShowMakeUpConfirm(true)}
                disabled={restCredits <= 0}
                title={restCredits <= 0 ? 'No rest credits available' : 'Use 1 rest credit to mark this day as complete'}
                className={`px-3 py-1.5 border text-sm font-semibold rounded-lg transition-colors ${
                  restCredits > 0
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 cursor-pointer'
                    : 'bg-slate-700/20 border-slate-600/40 text-slate-500 cursor-not-allowed opacity-60'
                }`}
              >
                Make Up
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Summary Stats */}
        <div className="bg-slate-800/60 rounded-lg px-4 py-3 mb-4 border border-blue-500/20">
          <p className="text-sm text-gray-300">
            <span className="font-bold text-blue-400">{totalCount}</span> Pomodoro{totalCount !== 1 ? 's' : ''} ·
            <span className="font-bold text-blue-400 ml-2">{formatTime(totalMinutes)}</span>
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {loading && (
            <div className="text-center py-8 text-gray-400">
              Loading...
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-red-400">
              {error}
            </div>
          )}

          {!loading && !error && pomodoros.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-2">No pomodoros completed yet today</p>
              <p className="text-sm text-gray-500">Start a pomodoro to see it here!</p>
            </div>
          )}

          {!loading && !error && pomodoros.map((pomodoro) => (
            <div
              key={pomodoro.id}
              className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50 space-y-2 relative"
            >
              {/* Edit and Delete Buttons */}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  onClick={() => setEditingPomodoro(pomodoro)}
                  className="text-gray-400 hover:text-blue-400 transition-colors"
                  title="Edit pomodoro"
                  aria-label="Edit pomodoro"
                >
                  <Pen size={16} />
                </button>
                <button
                  onClick={() => setDeletingPomodoroId(pomodoro.id)}
                  className="text-gray-400 hover:text-red-400 transition-colors"
                  title="Delete pomodoro"
                  aria-label="Delete pomodoro"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Time Range */}
              <div className="space-y-1 pr-12">
                <div className="flex items-center gap-2 text-sm text-blue-300">
                  <Clock size={14} />
                  <span className="font-medium">
                    {pomodoro.pause_periods && pomodoro.pause_periods.length > 0
                      ? 'Work Periods:'
                      : formatTimeRange(
                          pomodoro.started_at,
                          pomodoro.completed_at,
                          pomodoro.duration_minutes,
                          pomodoro.actual_duration_minutes,
                          pomodoro.completion_type
                        )}
                  </span>
                </div>
                {pomodoro.pause_periods && pomodoro.pause_periods.length > 0 && pomodoro.started_at && pomodoro.completed_at && (
                  <div className="ml-5 space-y-0.5">
                    {calculateWorkPeriods(pomodoro.started_at, pomodoro.completed_at, pomodoro.pause_periods).map((period, idx) => (
                      <div key={idx} className="text-xs text-blue-200">
                        • {period}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Task Name(s) */}
              <div className="space-y-1">
                {pomodoro.linkedTasks.length === 0 && (
                  <p className="text-gray-500 italic">No linked tasks</p>
                )}
                {pomodoro.linkedTasks.length === 1 && (
                  <p className={`font-semibold ${getCategoryColor(pomodoro.linkedTasks[0].category)}`}>
                    {pomodoro.linkedTasks[0].title}
                  </p>
                )}
                {pomodoro.linkedTasks.length > 1 && (
                  <div className="space-y-1">
                    <span className="text-xs text-gray-400">🔗 Linked to {pomodoro.linkedTasks.length} tasks:</span>
                    <div className="flex flex-wrap items-center gap-1 text-sm">
                      {pomodoro.linkedTasks.map((task, idx) => (
                        <span key={task.id}>
                          <span className={`font-semibold ${getCategoryColor(task.category)}`}>{task.title}</span>
                          {idx < pomodoro.linkedTasks.length - 1 && (
                            <span className="text-gray-500">, </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Duration and Focus Rating */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-gray-300">
                  <span className="font-medium">
                    {formatTime(pomodoro.actual_duration_minutes || pomodoro.duration_minutes)}
                  </span>
                  {pomodoro.overtime_minutes && pomodoro.overtime_minutes > 0 && (
                    <span className="text-orange-400 text-xs">
                      (+{pomodoro.overtime_minutes}m overtime)
                    </span>
                  )}
                </div>
                {renderStars(pomodoro.focus_rating)}
              </div>

              {/* Accomplishment Note */}
              {pomodoro.accomplishment_note && (
                <div className="pt-2 border-t border-slate-700/50">
                  <p className="text-sm text-gray-400 italic">
                    "{pomodoro.accomplishment_note}"
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Make Up Confirmation Dialog */}
      {showMakeUpConfirm && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-2xl">
          <div className="w-full max-w-sm bg-slate-800 rounded-xl border border-purple-500/40 shadow-2xl p-6 space-y-4 mx-4">
            <h4 className="text-lg font-semibold text-white">Make Up This Day</h4>
            <p className="text-sm text-gray-300">
              Use 1 rest credit to mark {specificDate && format(new Date(specificDate + 'T00:00:00'), 'MMM d, yyyy')} as completed?
            </p>
            <p className="text-xs text-gray-500">Rest credits available: {restCredits}</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowMakeUpConfirm(false)}
                className="flex-1 px-4 py-2 bg-slate-700 text-gray-300 rounded-lg text-sm font-semibold hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMakeUpConfirm(false);
                  onMakeUp?.();
                  onClose();
                }}
                className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-400 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingPomodoroId && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-2xl">
          <div className="w-full max-w-sm bg-slate-800 rounded-xl border border-red-500/40 shadow-2xl p-6 space-y-4 mx-4">
            <h4 className="text-lg font-semibold text-white">Delete Pomodoro</h4>
            <p className="text-sm text-gray-300">
              Are you sure you want to delete this pomodoro? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingPomodoroId(null)}
                className="flex-1 px-4 py-2 bg-slate-700 text-gray-300 rounded-lg text-sm font-semibold hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeletePomodoro(deletingPomodoroId)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-400 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Pomodoro Modal */}
      <EditPomodoroModal
        isOpen={!!editingPomodoro}
        onClose={() => setEditingPomodoro(null)}
        userId={userId}
        pomodoro={editingPomodoro}
        onSave={fetchTodayPomodoros}
      />
    </div>
  );
};

export default TodayPomodorosModal;
