import { useEffect, useState } from 'react';
import { Pencil, Trash2, BarChart3, Archive, Check } from 'lucide-react';
import type { Task, TaskCategory, TaskPriority, TaskType } from '../../types';
import type { TaskInput } from '../../hooks/useTasks';
import { CATEGORY_EMOJIS, PRIORITY_COLORS } from '../../types';

interface TaskCardProps {
  task: Task;
  onUpdate: (taskId: string, updates: Partial<TaskInput>) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onToggleActive: (taskId: string, isActive: boolean) => Promise<void>;
  onStartPomodoro: (task: Task) => void;
  isRunning: boolean;
  todayMinutes?: number;
  onArchive?: (task: Task) => void;
  onBurnDown?: (task: Task) => void;
}

const CATEGORY_OPTIONS: { value: TaskCategory; label: string }[] = [
  { value: 'study', label: 'Study' },
  { value: 'exercise', label: 'Exercise' },
  { value: 'work', label: 'Work' },
  { value: 'creative', label: 'Creative' },
  { value: 'admin', label: 'Admin' },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export default function TaskCard({
  task,
  onUpdate,
  onDelete,
  onToggleActive,
  onStartPomodoro,
  isRunning,
  todayMinutes,
  onArchive,
  onBurnDown,
}: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [category, setCategory] = useState<TaskCategory | ''>((task.category as TaskCategory) || '');
  const [priority, setPriority] = useState<TaskPriority>((task.priority as TaskPriority) || 'low');
  const [targetDuration, setTargetDuration] = useState(
    task.target_duration_minutes ? String(task.target_duration_minutes) : ''
  );
  const [deadline, setDeadline] = useState(
    task.deadline ? task.deadline.split('T')[0] : ''
  );
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    task.estimated_minutes
      ? String(task.estimated_minutes)
      : task.estimated_pomodoros
      ? String(task.estimated_pomodoros * 25)
      : ''
  );
  const [goldReward, setGoldReward] = useState(String(task.gold_reward));
  const [xpReward, setXpReward] = useState(String(task.xp_reward));
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const categoryEmoji = task.category ? CATEGORY_EMOJIS[task.category] : '✨';
  const targetMinutesRaw =
    task.task_type === 'daily'
      ? task.target_duration_minutes
      : task.estimated_minutes ?? (task.estimated_pomodoros ? task.estimated_pomodoros * 25 : null);
  const targetMinutes = targetMinutesRaw && targetMinutesRaw > 0 ? targetMinutesRaw : null;
  const dailyCompletedMinutes =
    task.task_type === 'daily' ? todayMinutes ?? 0 : task.completed_minutes || 0;
  const progressValue =
    targetMinutes && targetMinutes > 0
      ? dailyCompletedMinutes / targetMinutes
      : 0;
  const progressBase = Math.min(progressValue, 1);
  const progressOver = Math.max(progressValue - 1, 0);
  const overMinutes =
    targetMinutes && dailyCompletedMinutes
      ? Math.max(dailyCompletedMinutes - targetMinutes, 0)
      : 0;
  const overlayWidth = Math.min(Math.round(progressOver * 100), 100);
  const overlayLeft = Math.max(100 - overlayWidth, 0);
  const isDailyDone =
    task.task_type === 'daily' &&
    targetMinutes !== null &&
    dailyCompletedMinutes >= targetMinutes;

  useEffect(() => {
    if (!confirmDelete) return;
    const timer = window.setTimeout(() => setConfirmDelete(false), 3000);
    return () => window.clearTimeout(timer);
  }, [confirmDelete]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    setError(null);

    const updates: Partial<TaskInput> = {
      title: title.trim(),
      description: description.trim() ? description.trim() : undefined,
      category: category || null,
      priority,
      task_type: task.task_type as TaskType,
      target_duration_minutes:
        task.task_type === 'daily' ? Number(targetDuration) || null : null,
      deadline:
        task.task_type === 'onetime' && deadline
          ? new Date(deadline).toISOString()
          : null,
      estimated_minutes:
        task.task_type === 'onetime' ? Number(estimatedMinutes) || null : null,
      estimated_pomodoros: task.task_type === 'onetime' ? null : undefined,
      gold_reward: Number(goldReward) || 0,
      xp_reward: Number(xpReward) || 0,
    };

    try {
      await onUpdate(task.id, updates);
      setIsEditing(false);
    } catch (err) {
      setError((err as Error).message || 'Failed to update task.');
    }
  };

  const handleCancel = () => {
    setTitle(task.title);
    setDescription(task.description || '');
    setCategory((task.category as TaskCategory) || '');
    setPriority((task.priority as TaskPriority) || 'low');
    setTargetDuration(task.target_duration_minutes ? String(task.target_duration_minutes) : '');
    setDeadline(task.deadline ? task.deadline.split('T')[0] : '');
    setEstimatedMinutes(
      task.estimated_minutes
        ? String(task.estimated_minutes)
        : task.estimated_pomodoros
        ? String(task.estimated_pomodoros * 25)
        : ''
    );
    setGoldReward(String(task.gold_reward));
    setXpReward(String(task.xp_reward));
    setError(null);
    setIsEditing(false);
  };

  return (
    <div
      className={`rounded-lg border shadow-lg space-y-2 p-3 transition-all ${
        task.is_completed
          ? 'bg-slate-800 border-purple-500/20'
          : isDailyDone
          ? 'bg-slate-800 border-emerald-400/40'
          : 'bg-slate-800 border-purple-500/20'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-2">
          <div className="text-xl">{categoryEmoji}</div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              {task.task_type === 'daily' ? 'Daily Quest' : 'One-Time Quest'}
            </p>
            {isEditing ? (
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-1 w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
              />
            ) : (
              <h3
                className={`text-sm font-semibold mt-1 ${
                  task.is_completed || isDailyDone
                    ? 'text-gray-300 line-through'
                    : 'text-white'
                }`}
              >
                {task.title}
              </h3>
            )}
            <p className={`text-xs font-semibold mt-1 ${PRIORITY_COLORS[task.priority]}`}>
              {task.priority} priority
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!task.is_completed && !isRunning) {
              onToggleActive(task.id, !task.is_active);
            }
          }}
          className={`text-xs font-semibold px-3 py-1 rounded-full ${
            isRunning
              ? 'bg-emerald-500/10 text-emerald-400'
              : isDailyDone
              ? 'bg-emerald-500/15 text-emerald-300'
              : task.is_completed
              ? 'bg-emerald-500/10 text-emerald-400'
              : task.is_active
              ? 'bg-green-500/10 text-green-400'
              : 'bg-gray-500/10 text-gray-400'
          } ${task.is_completed || isRunning ? 'cursor-default' : ''}`}
        >
          {isRunning
            ? 'Running'
            : isDailyDone
            ? 'Done today'
            : task.is_completed
            ? 'Completed'
            : task.is_active
            ? 'Active'
            : 'Paused'}
        </button>
      </div>

      {isEditing && (
        <>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={2}
            placeholder="Description (optional)"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 text-sm"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Category</label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as TaskCategory | '')}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              >
                <option value="">Choose category</option>
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value as TaskPriority)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}

      {isEditing && task.task_type === 'daily' && (
        <div>
          <label className="block text-xs text-gray-400 mb-1">Target Minutes</label>
          <input
            type="number"
            min={5}
            value={targetDuration}
            onChange={(event) => setTargetDuration(event.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
          />
        </div>
      )}

      {isEditing && task.task_type === 'onetime' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Deadline</label>
            <input
              type="date"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Estimated Minutes</label>
            <input
              type="number"
              min={1}
              value={estimatedMinutes}
              onChange={(event) => setEstimatedMinutes(event.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] text-gray-400">
          <span>{task.task_type === 'daily' ? 'Today' : 'Progress'}</span>
          <span>
            {targetMinutes
              ? `${dailyCompletedMinutes}/${targetMinutes} min`
              : 'No target set'}
            {overMinutes > 0 && ` (+${overMinutes} min)`}
          </span>
        </div>
        <div className="relative w-full h-2 rounded-full bg-slate-900 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
            style={{ width: `${Math.round(progressBase * 100)}%` }}
          />
          {progressOver > 0 && (
            <>
              <div
                className="absolute top-0 h-full bg-[linear-gradient(135deg,rgba(56,189,248,0.15),rgba(16,185,129,0.85))]"
                style={{
                  width: `${overlayWidth}%`,
                  left: `${overlayLeft}%`,
                }}
              />
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-emerald-300"
                style={{ left: `${overlayLeft}%` }}
              />
            </>
          )}
        </div>
        {isDailyDone && (
          <div className="text-[11px] text-emerald-300 font-semibold">
            ✓ Done today
          </div>
        )}
      </div>

      {isEditing && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Gold Reward</label>
            <input
              type="number"
              min={0}
              value={goldReward}
              onChange={(event) => setGoldReward(event.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">XP Reward</label>
            <input
              type="number"
              min={0}
              value={xpReward}
              onChange={(event) => setXpReward(event.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
            />
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleSave}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-gray-200 text-xs font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="w-8 h-8 bg-slate-700 hover:bg-slate-600 text-gray-200 rounded-lg transition-colors flex items-center justify-center"
                title="Edit"
              >
                <Pencil size={16} />
              </button>
              {task.task_type === 'onetime' && onBurnDown && (
                <button
                  type="button"
                  onClick={() => onBurnDown(task)}
                  className="w-8 h-8 bg-slate-700 hover:bg-slate-600 text-gray-200 rounded-lg transition-colors flex items-center justify-center"
                  title="Burn-down"
                >
                  <BarChart3 size={16} />
                </button>
              )}
              {task.task_type === 'onetime' && onArchive && !task.is_archived && (
                <button
                  type="button"
                  onClick={() => onArchive(task)}
                  className="w-8 h-8 bg-slate-700 hover:bg-slate-600 text-gray-200 rounded-lg transition-colors flex items-center justify-center"
                  title="Archive"
                >
                  <Archive size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!confirmDelete) {
                    setConfirmDelete(true);
                    return;
                  }
                  onDelete(task.id);
                  setConfirmDelete(false);
                }}
                className="w-8 h-8 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center"
                title={confirmDelete ? 'Confirm Delete' : 'Delete'}
              >
                {confirmDelete ? <Check size={16} /> : <Trash2 size={16} />}
              </button>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => onStartPomodoro(task)}
          disabled={isRunning || task.is_completed || isDailyDone}
          className="px-3 py-1.5 bg-emerald-500/90 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Start Pomodoro
        </button>
      </div>
    </div>
  );
}
