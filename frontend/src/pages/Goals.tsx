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
import { formatDistanceToNow } from 'date-fns';
import type { Task } from '../types';
import { useUserStore } from '../store/useUserStore';
import { useAuth } from '../hooks/useAuth';

const GOAL_CONFIG = {
  '3year': { emoji: '🎯', label: '3-Year Goal', color: 'from-blue-600 to-cyan-600' },
  '1year': { emoji: '📅', label: '1-Year Goal', color: 'from-purple-600 to-pink-600' },
  '1month': { emoji: '🚀', label: '1-Month Goal', color: 'from-green-600 to-emerald-600' },
};

export default function Goals() {
  const { user } = useUserStore();
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
      if (!user) return;
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from('daily_task_completions')
        .select('task_id, minutes_completed')
        .eq('user_id', user.id)
        .eq('date', today);

      if (error) return;

      const map: Record<string, number> = {};
      data?.forEach((row) => {
        if (row.task_id) {
          map[row.task_id] = row.minutes_completed || 0;
        }
      });
      setDailyProgress(map);
    };

    fetchDailyProgress();
  }, [user]);

  useEffect(() => {
    const fetchTimeSummary = async () => {
      if (!user) return;

      const today = new Date().toISOString().slice(0, 10);

      // Get start of current week (Monday)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diff);
      const weekStart = monday.toISOString().slice(0, 10);

      try {
        // Fetch today's pomodoros
        const { data: todayData } = await supabase
          .from('pomodoros')
          .select('duration_minutes')
          .eq('user_id', user.id)
          .gte('completed_at', `${today}T00:00:00`)
          .lt('completed_at', `${today}T23:59:59`);

        if (todayData) {
          const total = todayData.reduce((sum, p) => sum + (p.duration_minutes || 0), 0);
          setTodayMinutes(total);
        }

        // Fetch this week's pomodoros
        const { data: weekData } = await supabase
          .from('pomodoros')
          .select('duration_minutes')
          .eq('user_id', user.id)
          .gte('completed_at', `${weekStart}T00:00:00`);

        if (weekData) {
          const total = weekData.reduce((sum, p) => sum + (p.duration_minutes || 0), 0);
          setWeekMinutes(total);
        }
      } catch (error) {
        console.error('Failed to fetch time summary:', error);
      }
    };

    fetchTimeSummary();
  }, [user]);

  useEffect(() => {
    if (!activeSession) return;
    const sessionTask = tasks.find((task) => task.id === activeSession.task_id);
    if (sessionTask) {
      setActivePomodoroTask(sessionTask);
    }
  }, [activeSession, tasks]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header with Stats and XP */}
        <div className="space-y-4">
          {/* Title */}
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200">
              Level Up
            </h1>
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
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-purple-500/20">
              <p className="text-xs text-gray-400">Week</p>
              <p className="text-lg font-bold text-purple-400">{formatTime(weekMinutes)}</p>
            </div>
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
          {!hasAllGoals ? (
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
                onCreate={async (input) => {
                  await createTask(input);
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
    </div>
  );
}
