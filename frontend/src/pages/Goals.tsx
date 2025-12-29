import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useGoals } from '../hooks/useGoals';
import { useTasks } from '../hooks/useTasks';
import GoalSetupForm from '../components/goals/GoalSetupForm';
import TaskForm from '../components/tasks/TaskForm';
import TaskCard from '../components/tasks/TaskCard';
import PomodoroModal, { type ActivePomodoro } from '../components/battle/PomodoroModal';
import BurnDownModal from '../components/tasks/BurnDownModal';
import ShopPanel from '../components/shop/ShopPanel';
import CheckInCalendar from '../components/calendar/CheckInCalendar';
import WeeklyHistogramModal from '../components/dashboard/WeeklyHistogramModal';
import { formatDistanceToNow } from 'date-fns';
import type { Task } from '../types';
import { useUserStore } from '../store/useUserStore';
import { useAuth } from '../hooks/useAuth';
import { getLocalDateString, getLocalWeekStart, getStartOfDayUTC, getEndOfDayUTC } from '../utils/dateUtils';
import { Clock } from 'lucide-react';

const GOAL_CONFIG = {
  '3year': { emoji: '🎯', label: '3-Year Goal', color: 'from-blue-600 to-cyan-600' },
  '1year': { emoji: '📅', label: '1-Year Goal', color: 'from-purple-600 to-pink-600' },
  '1month': { emoji: '🚀', label: '1-Month Goal', color: 'from-green-600 to-emerald-600' },
};

const TIMEZONE_OPTIONS = [
  { label: 'Pacific Time (PST/PDT - America/Los_Angeles)', value: 'America/Los_Angeles' },
  { label: 'Central Time (CST/CDT - America/Chicago)', value: 'America/Chicago' },
  { label: 'Eastern Time (EST/EDT - America/New_York)', value: 'America/New_York' },
  { label: 'UTC (Etc/UTC)', value: 'Etc/UTC' },
  { label: 'London (GMT/BST - Europe/London)', value: 'Europe/London' },
  { label: 'Berlin (CET/CEST - Europe/Berlin)', value: 'Europe/Berlin' },
  { label: 'Moscow (Europe/Moscow)', value: 'Europe/Moscow' },
  { label: 'India (Asia/Kolkata)', value: 'Asia/Kolkata' },
  { label: 'China (Asia/Shanghai)', value: 'Asia/Shanghai' },
  { label: 'Japan (Asia/Tokyo)', value: 'Asia/Tokyo' },
  { label: 'Sydney (AEST/AEDT - Australia/Sydney)', value: 'Australia/Sydney' },
];

export default function Goals() {
  const { user, updateProfile } = useUserStore();
  const { profile } = useAuth();
  const { goals, loading: goalsLoading, hasAllGoals, updateGoal } = useGoals();
  const {
    tasks,
    loading: tasksLoading,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskActive,
  } = useTasks();
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [goalDraft, setGoalDraft] = useState('');
  const [goalError, setGoalError] = useState<string | null>(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [activePomodoroTask, setActivePomodoroTask] = useState<Task | null>(null);
  const [activeSession, setActiveSession] = useState<ActivePomodoro | null>(null);
  const [pomodoroError, setPomodoroError] = useState<string | null>(null);
  const [lastReward, setLastReward] = useState<{ gold: number; xp: number } | null>(null);
  const [dailyProgress, setDailyProgress] = useState<Record<string, number>>({});
  const [showArchive, setShowArchive] = useState(false);
  const [showBurndownFor, setShowBurndownFor] = useState<Task | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [weekMinutes, setWeekMinutes] = useState(0);
  const [showDayCutEditor, setShowDayCutEditor] = useState(false);
  const [dayCutTime, setDayCutTime] = useState('00:00');
  const [dayCutError, setDayCutError] = useState<string | null>(null);
  const [timezoneName, setTimezoneName] = useState('Asia/Shanghai');
  const [showWeeklyHistogram, setShowWeeklyHistogram] = useState(false);

  useEffect(() => {
    if (!profile?.daily_reset_time) {
      setDayCutTime('00:00');
      return;
    }
    setDayCutTime(profile.daily_reset_time.slice(0, 5));
  }, [profile?.daily_reset_time]);

  useEffect(() => {
    if (!profile?.timezone_name) {
      setTimezoneName('Asia/Shanghai');
      return;
    }
    setTimezoneName(profile.timezone_name);
  }, [profile?.timezone_name]);

  const sortedGoals = useMemo(() => {
    return [...goals].sort((a, b) => {
      const order = { '3year': 0, '1year': 1, '1month': 2 };
      return order[a.goal_type] - order[b.goal_type];
    });
  }, [goals]);

  const dailyTasks = useMemo(
    () => tasks.filter((task) => task.task_type === 'daily' && !task.is_archived),
    [tasks]
  );
  const onetimeTasks = useMemo(
    () => tasks.filter((task) => task.task_type === 'onetime' && !task.is_archived),
    [tasks]
  );
  const archivedTasks = useMemo(
    () => tasks.filter((task) => task.task_type === 'onetime' && task.is_archived),
    [tasks]
  );

  useEffect(() => {
    const fetchActivePomodoro = async () => {
      if (!user) return;
      setPomodoroError(null);

      try {
        const { data, error } = await supabase
          .from('active_pomodoros')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setActiveSession(data as ActivePomodoro);
        }
      } catch (err) {
        setPomodoroError((err as Error).message || 'Failed to load active pomodoro.');
      }
    };

    fetchActivePomodoro();
  }, [user]);

  useEffect(() => {
    const fetchDailyProgress = async () => {
      if (!user || !profile) return;
      const today = getLocalDateString();
      const utcDate = new Date().toISOString().slice(0, 10);
      const dayStart = getStartOfDayUTC();
      const dayEnd = getEndOfDayUTC();

      // Query for both local and UTC dates to handle transition period
      const { data: dateData, error } = await supabase
        .from('daily_task_completions')
        .select('*')
        .eq('user_id', user.id)
        .in('date', [today, utcDate]);

      if (error) {
        console.error('❌ Error fetching daily progress:', error);
        return;
      }

      const { data: rangeData, error: rangeError } = await supabase
        .from('daily_task_completions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', dayStart)
        .lte('created_at', dayEnd);

      if (rangeError) {
        console.error('❌ Error fetching daily progress range:', rangeError);
        return;
      }

      const combined = new Map<string, any>();
      (dateData || []).forEach((row) => combined.set(row.id, row));
      (rangeData || []).forEach((row) => combined.set(row.id, row));
      const dateMatches = Array.from(combined.values());
      const removedIds = new Set<string>();
      const todayStart = new Date(dayStart).getTime();
      const todayEnd = new Date(dayEnd).getTime();
      const todayMap = new Map<string, typeof dateMatches[number]>();
      dateMatches
        .filter((row) => row.date === today)
        .forEach((row) => todayMap.set(row.task_id, row));

      const candidates = dateMatches.filter((row) => {
        if (row.date === today) return false;
        if (!row.target_minutes || row.target_minutes <= 0) return false;
        const createdAt = new Date(row.created_at).getTime();
        return createdAt >= todayStart && createdAt <= todayEnd;
      });

      for (const candidate of candidates) {
        const todayRecord = todayMap.get(candidate.task_id);
        if (todayRecord) {
          const nextMinutes =
            (todayRecord.minutes_completed || 0) + (candidate.minutes_completed || 0);
          await supabase
            .from('daily_task_completions')
            .update({
              minutes_completed: nextMinutes,
              is_completed: !!(todayRecord.target_minutes && nextMinutes >= todayRecord.target_minutes),
              date: today,
            })
            .eq('id', todayRecord.id);

          await supabase
            .from('daily_task_completions')
            .delete()
            .eq('id', candidate.id);

          todayRecord.minutes_completed = nextMinutes;
          removedIds.add(candidate.id);
        } else {
          await supabase
            .from('daily_task_completions')
            .update({ date: today })
            .eq('id', candidate.id);
          candidate.date = today;
          todayMap.set(candidate.task_id, candidate);
        }
      }

      // Group records by task_id to find duplicates
      const taskGroups: Record<string, any[]> = {};
      dateMatches.filter((row) => !removedIds.has(row.id)).forEach((row) => {
        if (row.task_id) {
          if (!taskGroups[row.task_id]) {
            taskGroups[row.task_id] = [];
          }
          taskGroups[row.task_id].push(row);
        }
      });

      // Consolidate duplicates (UTC + local date records)
      const consolidationPromises: Promise<any>[] = [];
      const map: Record<string, number> = {};

      Object.entries(taskGroups).forEach(([taskId, records]) => {
        if (records.length > 1) {
          const totalMinutes = records.reduce((sum, r) => sum + (r.minutes_completed || 0), 0);

          const primaryRecord = records.find(r => r.date === today) || records[0];
          const recordsToDelete = records.filter(r => r.id !== primaryRecord.id);

          // Update primary record
          consolidationPromises.push(
            Promise.resolve(
              supabase
                .from('daily_task_completions')
                .update({
                  minutes_completed: totalMinutes,
                  date: today,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', primaryRecord.id)
            )
          );

          // Delete duplicates
          if (recordsToDelete.length > 0) {
            consolidationPromises.push(
              Promise.resolve(
                supabase
                  .from('daily_task_completions')
                  .delete()
                  .in('id', recordsToDelete.map(r => r.id))
              )
            );
          }

          map[taskId] = totalMinutes;
        } else {
          map[taskId] = records[0].minutes_completed || 0;
        }
      });

      // Execute consolidation
      if (consolidationPromises.length > 0) {
        await Promise.all(consolidationPromises);
      }

      setDailyProgress(map);
    };

    fetchDailyProgress();
  }, [user, profile?.daily_reset_time, profile?.timezone_name, profile]);

  useEffect(() => {
    const fetchTimeSummary = async () => {
      if (!user || !profile) return;

      try {
        // Fetch today's pomodoros (using UTC timestamps for proper timezone handling)
        const { data: todayData } = await supabase
          .from('pomodoros')
          .select('duration_minutes')
          .eq('user_id', user.id)
          .gte('completed_at', getStartOfDayUTC())
          .lte('completed_at', getEndOfDayUTC());

        if (todayData) {
          const total = todayData.reduce((sum, p) => sum + (p.duration_minutes || 0), 0);
          setTodayMinutes(total);
        }

        // Fetch this week's pomodoros (week start in GMT+8)
        const weekStartDate = new Date(getLocalWeekStart());

        const { data: weekData } = await supabase
          .from('pomodoros')
          .select('duration_minutes')
          .eq('user_id', user.id)
          .gte('completed_at', getStartOfDayUTC(weekStartDate));

        if (weekData) {
          const total = weekData.reduce((sum, p) => sum + (p.duration_minutes || 0), 0);
          setWeekMinutes(total);
        }
      } catch (error) {
        console.error('Failed to fetch time summary:', error);
      }
    };

    fetchTimeSummary();
  }, [user, profile?.daily_reset_time, profile?.timezone_name, profile]);

  useEffect(() => {
    if (!activeSession) return;
    const sessionTask = tasks.find((task) => task.id === activeSession.task_id);
    if (sessionTask) {
      setActivePomodoroTask(sessionTask);
    }
  }, [activeSession, tasks]);

  const handleTimeSummaryUpdate = (minutes: number, completedAt: Date) => {
    const completedDate = getLocalDateString(completedAt);
    const todayDate = getLocalDateString();
    if (completedDate === todayDate) {
      setTodayMinutes((prev) => prev + minutes);
    }

    const weekStart = getLocalWeekStart();
    if (completedDate >= weekStart) {
      setWeekMinutes((prev) => prev + minutes);
    }
  };

  const startGoalEdit = (goalId: string, description: string) => {
    setEditingGoalId(goalId);
    setGoalDraft(description);
    setGoalError(null);
  };

  const cancelGoalEdit = () => {
    setEditingGoalId(null);
    setGoalDraft('');
    setGoalError(null);
  };

  const saveGoalEdit = async (goalId: string) => {
    if (!goalDraft.trim()) {
      setGoalError('Goal cannot be empty.');
      return;
    }

    try {
      await updateGoal(goalId, goalDraft.trim());
      cancelGoalEdit();
    } catch (error) {
      setGoalError((error as Error).message || 'Failed to update goal.');
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const formatTimezoneLabel = () => {
    const matched = TIMEZONE_OPTIONS.find((option) => option.value === timezoneName);
    return matched ? matched.label : timezoneName;
  };

  const saveDayCutTime = async () => {
    if (!/^\d{2}:\d{2}$/.test(dayCutTime)) {
      setDayCutError('Use HH:MM format.');
      return;
    }
    setDayCutError(null);

    try {
      await updateProfile({
        daily_reset_time: `${dayCutTime}:00`,
        timezone_name: timezoneName,
      });
      setShowDayCutEditor(false);
    } catch (error) {
      setDayCutError((error as Error).message || 'Failed to update day cut time.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header with Stats and XP */}
        <div className="space-y-4">
          {/* Title */}
          <div className="relative text-center flex flex-col items-center gap-3 sm:block">
            <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200">
              Level Up
            </h1>
            <button
              type="button"
              onClick={() => setShowDayCutEditor(true)}
              className="inline-flex items-center gap-2 text-xs text-gray-300 bg-slate-800/70 border border-slate-700/60 rounded-full px-3 py-1 hover:border-slate-500 transition sm:absolute sm:right-0 sm:top-0"
            >
              <Clock size={14} />
              Day cut · {formatTimezoneLabel()}
            </button>
            {goalsLoading && (
              <p className="mt-2 text-xs text-gray-500">Refreshing goals...</p>
            )}
          </div>

          {/* Stats Grid - Today, Week, Gold, Streak */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-blue-500/20">
              <p className="text-xs text-gray-400">Today</p>
              <p className="text-lg font-bold text-blue-400">{formatTime(todayMinutes)}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowWeeklyHistogram(true)}
              className="bg-slate-800/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-purple-500/20 hover:border-purple-500/50 transition-all text-left"
            >
              <p className="text-xs text-gray-400">Week</p>
              <p className="text-lg font-bold text-purple-400">{formatTime(weekMinutes)}</p>
            </button>
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-yellow-500/20">
              <p className="text-xs text-gray-400">Gold</p>
              <p className="text-lg font-bold text-yellow-300">{profile?.gold ?? 0}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowCalendar(true)}
              className="bg-slate-800/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-orange-500/20 hover:border-orange-500/40 transition-all text-left"
            >
              <p className="text-xs text-gray-400">Streak</p>
              <p className="text-lg font-bold text-orange-400">{profile?.current_streak ?? 0} 🔥</p>
            </button>
          </div>

          {/* XP Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Level {profile?.level ?? 1}</span>
              <span className="text-blue-300 font-medium">
                {profile?.current_xp ?? 0}/{(profile?.level ?? 1) * 100} XP
              </span>
            </div>
            <div className="w-full bg-slate-800/80 rounded-full h-2.5 border border-slate-700/50">
              <div
                className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-400 h-2.5 rounded-full transition-all shadow-lg shadow-blue-500/50"
                style={{
                  width: `${Math.min(((profile?.current_xp ?? 0) / ((profile?.level ?? 1) * 100)) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Compressed Goal Cards */}
        <section className="space-y-3">
          {goalsLoading && goals.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              <p className="mt-4 text-gray-400">Loading goals...</p>
            </div>
          ) : !hasAllGoals ? (
            <GoalSetupForm />
          ) : (
            <div className="space-y-3">
              {sortedGoals.map((goal) => {
                const config = GOAL_CONFIG[goal.goal_type];
                const daysRemaining = Math.ceil(
                  (new Date(goal.target_date).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                const isEditing = editingGoalId === goal.id;

                return (
                  <div
                    key={goal.id}
                    className="bg-slate-800/60 rounded-lg p-3 border border-purple-500/20 hover:border-purple-500/30 transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-2">
                          <div className="text-xl">{config.emoji}</div>
                          <div>
                            <h3
                              className={`text-xs font-semibold text-transparent bg-clip-text bg-gradient-to-r ${config.color}`}
                            >
                              {config.label}
                            </h3>
                            <span className="text-[10px] text-gray-500">
                              {formatDistanceToNow(new Date(goal.target_date), { addSuffix: true })}
                            </span>
                          </div>
                        </div>

                        <div
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${
                            daysRemaining > 30
                              ? 'bg-green-500/10 text-green-400'
                              : daysRemaining > 7
                              ? 'bg-yellow-500/10 text-yellow-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {daysRemaining > 0 ? `${daysRemaining}d` : 'Overdue'}
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={goalDraft}
                            onChange={(event) => setGoalDraft(event.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500 resize-none text-sm"
                          />
                          {goalError && (
                            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-2 text-red-400 text-xs">
                              {goalError}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => saveGoalEdit(goal.id)}
                              className="px-2 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelGoalEdit}
                              className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-gray-200 text-xs font-semibold transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="text-sm text-white/90 whitespace-pre-wrap leading-snug">
                            {goal.description}
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => startGoalEdit(goal.id, goal.description)}
                              className="px-2 py-1 rounded bg-slate-700/50 hover:bg-slate-600 text-gray-300 text-xs font-semibold transition-colors"
                            >
                              Edit
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Tasks Section - Focal Point */}
        <section className="space-y-6 bg-slate-800/40 rounded-2xl p-6 border-2 border-purple-500/30 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Tasks
              </h2>
              <p className="text-gray-300 mt-1">Build your daily and one-time quests here.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowArchive(true)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-semibold"
              >
                Archive
              </button>
              <button
                type="button"
                onClick={() => setIsTaskFormOpen(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-semibold"
              >
                New Task
              </button>
            </div>
          </div>

          {tasksLoading && (
            <p className="text-xs text-gray-500">Refreshing tasks...</p>
          )}
          {pomodoroError && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
              {pomodoroError}
            </div>
          )}

          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">Daily Tasks</h3>
                <span className="text-xs text-gray-400">{dailyTasks.length} total</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {dailyTasks.length > 0 ? (
                  dailyTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onUpdate={updateTask}
                      onDelete={deleteTask}
                      onToggleActive={toggleTaskActive}
                      onStartPomodoro={(selectedTask) => {
                        if (activeSession) {
                          const sessionTask = tasks.find(
                            (item) => item.id === activeSession.task_id
                          );
                          if (sessionTask) {
                            setActivePomodoroTask(sessionTask);
                            return;
                          }
                        }
                        setActivePomodoroTask(selectedTask);
                      }}
                      isRunning={activeSession?.task_id === task.id}
                      todayMinutes={dailyProgress[task.id]}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center text-gray-400 py-8 bg-slate-800/60 border border-purple-500/10 rounded-lg">
                    No daily tasks yet.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">One-Time Tasks</h3>
                <span className="text-xs text-gray-400">{onetimeTasks.length} total</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {onetimeTasks.length > 0 ? (
                  onetimeTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onUpdate={updateTask}
                      onDelete={deleteTask}
                      onToggleActive={toggleTaskActive}
                      onStartPomodoro={(selectedTask) => {
                        if (activeSession) {
                          const sessionTask = tasks.find(
                            (item) => item.id === activeSession.task_id
                          );
                          if (sessionTask) {
                            setActivePomodoroTask(sessionTask);
                            return;
                          }
                        }
                        setActivePomodoroTask(selectedTask);
                      }}
                      isRunning={activeSession?.task_id === task.id}
                      onArchive={(taskToArchive) => {
                        updateTask(taskToArchive.id, {
                          is_archived: true,
                          archived_at: new Date().toISOString(),
                          is_active: false,
                        });
                      }}
                      onBurnDown={(taskToShow) => setShowBurndownFor(taskToShow)}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center text-gray-400 py-8 bg-slate-800/60 border border-purple-500/10 rounded-lg">
                    No one-time tasks yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Shop Panel - Moved to Bottom */}
        <section>
          <ShopPanel />
        </section>
      </div>

      {isTaskFormOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4 overflow-y-auto py-8">
          <div className="relative w-full max-w-2xl my-auto">
            <button
              type="button"
              onClick={() => setIsTaskFormOpen(false)}
              className="sticky top-0 float-right mb-2 text-gray-300 hover:text-white bg-slate-800/80 rounded-full px-3 py-1 text-sm font-semibold z-10"
            >
              Close ✕
            </button>
            <div className="clear-both">
              <TaskForm
                onCreate={async (input, relatedDailyTaskIds) => {
                  if (!user) {
                    throw new Error('User not authenticated');
                  }
                  const createdTask = await createTask(input);

                  if (relatedDailyTaskIds.length > 0 && createdTask.task_type === 'onetime') {
                    const relationshipRows = relatedDailyTaskIds.map((dailyTaskId) => ({
                      user_id: user.id,
                      onetime_task_id: createdTask.id,
                      daily_task_id: dailyTaskId,
                    }));

                    const { error } = await supabase
                      .from('task_relationships')
                      .insert(relationshipRows);

                    if (error) {
                      throw error;
                    }
                  }

                  setIsTaskFormOpen(false);
                }}
                loading={tasksLoading}
              />
            </div>
          </div>
        </div>
      )}

      {activePomodoroTask && (
        <PomodoroModal
          task={activePomodoroTask}
          activeSession={activeSession}
          onSessionStart={(session) => setActiveSession(session)}
          onSessionEnd={() => setActiveSession(null)}
          onClose={() => setActivePomodoroTask(null)}
          onTaskUpdate={async (taskId, updates) => {
            await updateTask(taskId, updates);
          }}
          onRewards={(rewards) => setLastReward(rewards)}
          onDailyProgressUpdate={(taskId, minutes) => {
            setDailyProgress((prev) => ({
              ...prev,
              [taskId]: (prev[taskId] || 0) + minutes,
            }));
          }}
          onTimeSummaryUpdate={handleTimeSummaryUpdate}
        />
      )}

      {showArchive && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-3xl bg-slate-900 rounded-2xl border border-purple-500/30 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Archive</p>
                <h3 className="text-xl font-semibold text-white">Archived Tasks</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowArchive(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            {archivedTasks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {archivedTasks.map((task) => (
                  <div key={task.id} className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                    <p className="text-sm font-semibold text-white">{task.title}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {task.completed_minutes || 0} min logged
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        updateTask(task.id, {
                          is_archived: false,
                          archived_at: null,
                          is_active: true,
                        })
                      }
                      className="mt-3 text-xs font-semibold text-purple-300 hover:text-purple-200"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No archived tasks yet.</p>
            )}
          </div>
        </div>
      )}

      {showBurndownFor && (
        <div className="fixed inset-0 z-40">
          <BurnDownModal task={showBurndownFor} onClose={() => setShowBurndownFor(null)} />
        </div>
      )}

      {showCalendar && (
        <CheckInCalendar
          streak={profile?.current_streak ?? 0}
          restCredits={profile?.rest_credits ?? 0}
          onClose={() => setShowCalendar(false)}
        />
      )}

      {showDayCutEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm bg-slate-900 rounded-2xl border border-blue-500/30 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Day Cut Settings</p>
                <h3 className="text-lg font-semibold text-white">Daily reset timezone</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDayCutEditor(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-gray-400">Timezone</label>
              <select
                value={timezoneName}
                onChange={(event) => setTimezoneName(event.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
              >
                {TIMEZONE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <label className="block text-xs text-gray-400">Reset time</label>
              <input
                type="time"
                step={60}
                value={dayCutTime}
                onChange={(event) => setDayCutTime(event.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
              />
              <p className="text-xs text-gray-500 leading-tight">
                Daily reset time in the selected timezone.
              </p>
              {dayCutError && <p className="text-xs text-red-400">{dayCutError}</p>}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDayCutEditor(false)}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-gray-200 text-xs font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveDayCutTime}
                className="px-3 py-1.5 bg-blue-500/90 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showWeeklyHistogram && (
        <WeeklyHistogramModal onClose={() => setShowWeeklyHistogram(false)} />
      )}
    </div>
  );
}
