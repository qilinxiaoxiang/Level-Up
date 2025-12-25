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
import StreakDisplay from '../components/dashboard/StreakDisplay';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200 mb-2">
            Goals & Tasks
          </h1>
          <p className="text-gray-400">
            Keep your vision at the top, and your tasks right below it.
          </p>
          {goalsLoading && (
            <p className="mt-3 text-xs text-gray-500">Refreshing goals...</p>
          )}
        </div>

        <section className="space-y-6">
          {!hasAllGoals ? (
            <GoalSetupForm />
          ) : (
            <div className="space-y-6">
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
                    className="bg-slate-800 rounded-lg p-6 border border-purple-500/20 shadow-lg hover:border-purple-500/40 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="text-4xl">{config.emoji}</div>
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center space-x-2">
                            <h3
                              className={`text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r ${config.color}`}
                            >
                              {config.label}
                            </h3>
                            <span className="text-xs text-gray-500">
                              • {formatDistanceToNow(new Date(goal.target_date), { addSuffix: true })}
                            </span>
                          </div>

                          {isEditing ? (
                            <div className="space-y-3">
                              <textarea
                                value={goalDraft}
                                onChange={(event) => setGoalDraft(event.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500 resize-none"
                              />
                              {goalError && (
                                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                                  {goalError}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-lg font-semibold text-white whitespace-pre-wrap leading-relaxed">
                              {goal.description}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-3">
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            daysRemaining > 30
                              ? 'bg-green-500/10 text-green-400'
                              : daysRemaining > 7
                              ? 'bg-yellow-500/10 text-yellow-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {daysRemaining > 0 ? `${daysRemaining} days left` : 'Overdue'}
                        </div>

                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => saveGoalEdit(goal.id)}
                              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelGoalEdit}
                              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-gray-200 text-xs font-semibold transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startGoalEdit(goal.id, goal.description)}
                            className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-gray-200 text-xs font-semibold transition-colors"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800 rounded-lg p-4 border border-purple-500/20 shadow-lg">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Rewards</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-xs text-gray-500">Gold</p>
                <p className="text-2xl font-semibold text-yellow-300">{profile?.gold ?? 0}</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-xs text-gray-500">Level</p>
                <p className="text-lg font-semibold text-blue-300">
                  {profile ? `Lv ${profile.level} • ${profile.current_xp}/${profile.level * 100} XP` : 'Lv 1'}
                </p>
                {profile && <p className="text-[11px] text-gray-400">Total XP: {profile.total_xp}</p>}
              </div>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {lastReward
                ? `Last reward: +${lastReward.gold} gold, +${lastReward.xp} XP`
                : 'Complete a pomodoro to earn rewards.'}
            </div>
          </div>

          <StreakDisplay
            currentStreak={profile?.current_streak ?? 0}
            restCredits={profile?.rest_credits ?? 0}
            onOpenCalendar={() => setShowCalendar(true)}
          />
        </section>

        <section>
          <ShopPanel />
        </section>

        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white">Tasks</h2>
              <p className="text-gray-400">Build your daily and one-time quests here.</p>
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
      </div>

      {isTaskFormOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4">
          <div className="relative w-full max-w-2xl">
            <button
              type="button"
              onClick={() => setIsTaskFormOpen(false)}
              className="absolute -top-10 right-0 text-gray-300 hover:text-white"
            >
              Close ✕
            </button>
            <TaskForm
              onCreate={async (input) => {
                await createTask(input);
                setIsTaskFormOpen(false);
              }}
              loading={tasksLoading}
            />
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
