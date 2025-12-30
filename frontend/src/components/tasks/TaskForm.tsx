import { useEffect, useMemo, useState } from 'react';
import type { TaskCategory, TaskPriority, TaskType } from '../../types';
import type { TaskInput } from '../../hooks/useTasks';
import { supabase } from '../../lib/supabase';
import { useUserStore } from '../../store/useUserStore';
import { getLocalDateString } from '../../utils/dateUtils';

interface TaskFormProps {
  onCreate: (input: TaskInput, relatedDailyTaskIds: string[]) => Promise<void>;
  loading: boolean;
}

interface RelatedDailyTask {
  id: string;
  title: string;
  category: string | null;
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

export default function TaskForm({ onCreate, loading }: TaskFormProps) {
  const { user } = useUserStore();
  const todayString = useMemo(() => getLocalDateString(), []);
  const [taskType, setTaskType] = useState<TaskType>('daily');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory | ''>('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [targetDuration, setTargetDuration] = useState('60');
  const [deadline, setDeadline] = useState(todayString);
  const [estimatedMinutes, setEstimatedMinutes] = useState('120');
  const [error, setError] = useState<string | null>(null);
  const [availableDailyTasks, setAvailableDailyTasks] = useState<RelatedDailyTask[]>([]);
  const [selectedDailyTaskIds, setSelectedDailyTaskIds] = useState<string[]>([]);
  const [relationshipsLoading, setRelationshipsLoading] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setPriority('medium');
    setTargetDuration('60');
    setDeadline(todayString);
    setEstimatedMinutes('120');
    setError(null);
    setSelectedDailyTaskIds([]);
  };

  useEffect(() => {
    if (taskType !== 'onetime' || !user) {
      setAvailableDailyTasks([]);
      setSelectedDailyTaskIds([]);
      return;
    }

    const fetchDailyTasks = async () => {
      setRelationshipsLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('tasks')
          .select('id, title, category')
          .eq('user_id', user.id)
          .eq('task_type', 'daily')
          .eq('is_archived', false)
          .order('title');

        if (fetchError) throw fetchError;
        setAvailableDailyTasks((data as RelatedDailyTask[]) || []);
      } catch (err) {
        console.error('Failed to load daily tasks for linking:', err);
        setAvailableDailyTasks([]);
      } finally {
        setRelationshipsLoading(false);
      }
    };

    fetchDailyTasks();
  }, [taskType, user]);

  useEffect(() => {
    if (taskType === 'onetime' && !deadline) {
      setDeadline(todayString);
    }
  }, [taskType, deadline, todayString]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }
    if (taskType === 'onetime' && !deadline) {
      setError('Deadline is required for one-time tasks.');
      return;
    }

    setError(null);

    const payload: TaskInput = {
      title: title.trim(),
      description: description.trim() ? description.trim() : undefined,
      category: category || null,
      priority,
      task_type: taskType,
      target_duration_minutes: taskType === 'daily' ? Number(targetDuration) || null : null,
      deadline: taskType === 'onetime' && deadline ? new Date(deadline).toISOString() : null,
      estimated_minutes: taskType === 'onetime' ? Number(estimatedMinutes) || null : null,
    };

    try {
      const relatedDailyTaskIds = taskType === 'onetime' ? selectedDailyTaskIds : [];
      await onCreate(payload, relatedDailyTaskIds);
      resetForm();
    } catch (err) {
      setError((err as Error).message || 'Failed to create task.');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-800 rounded-lg p-6 border border-purple-500/20 shadow-lg space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-white">Create a Task</h3>
          <p className="text-sm text-gray-400">Turn goals into daily action.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg">
          {(['daily', 'onetime'] as TaskType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTaskType(type)}
              className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                taskType === type
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {type === 'daily' ? 'Daily' : 'One-Time'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g., Morning run or Finish system design prep"
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Category
          </label>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as TaskCategory | '')}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
          >
            <option value="">Choose category</option>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="w-full">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description
        </label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Add details or motivation notes..."
          rows={3}
          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500 resize-none"
        />
      </div>

      <div className="w-full">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Priority
        </label>
        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value as TaskPriority)}
          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
        >
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {taskType === 'daily' && (
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Target Duration (min)
          </label>
          <input
            type="number"
            min={5}
            value={targetDuration}
            onChange={(event) => setTargetDuration(event.target.value)}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
          />
        </div>
      )}

      {taskType === 'onetime' && (
        <div className="w-full" style={{ maxWidth: '100%', overflow: 'hidden' }}>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Deadline
          </label>
          <input
            type="date"
            required
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
            style={{ width: '100%', maxWidth: '100%', minWidth: '0', boxSizing: 'border-box' }}
          />
        </div>
      )}

      {taskType === 'onetime' && (
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Estimated Minutes
          </label>
          <input
            type="number"
            min={1}
            value={estimatedMinutes}
            onChange={(event) => setEstimatedMinutes(event.target.value)}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
          />
        </div>
      )}

      {taskType === 'onetime' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-300">
              Link daily tasks (optional)
            </label>
            {relationshipsLoading && (
              <span className="text-xs text-gray-500">Loading...</span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Linked daily tasks get the same minutes. Stats stay single-source from pomodoros.
          </p>
          <div className="max-h-40 overflow-y-auto">
            {availableDailyTasks.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-2">
                No daily tasks available.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableDailyTasks.map((dailyTask) => {
                  const isSelected = selectedDailyTaskIds.includes(dailyTask.id);
                  return (
                    <button
                      key={dailyTask.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => {
                        setSelectedDailyTaskIds((prev) =>
                          isSelected
                            ? prev.filter((id) => id !== dailyTask.id)
                            : [...prev, dailyTask.id]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40'
                          : 'bg-slate-800 text-gray-300 border-slate-700 hover:text-white hover:border-slate-500'
                      }`}
                    >
                      {dailyTask.title}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">Tasks are saved instantly.</p>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}
