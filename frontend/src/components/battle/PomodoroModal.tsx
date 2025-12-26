import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useUserStore } from '../../store/useUserStore';
import type { Task } from '../../types';
import LevelUpModal from '../common/LevelUpModal';
import { getLocalDateString } from '../../utils/dateUtils';

interface PomodoroModalProps {
  task: Task;
  activeSession: ActivePomodoro | null;
  onSessionStart: (session: ActivePomodoro) => void;
  onSessionEnd: () => void;
  onClose: () => void;
  onTaskUpdate: (
    taskId: string,
    updates: {
      completed_pomodoros: number | null;
      completed_minutes: number | null;
      is_completed: boolean | null;
      completed_at: string | null;
      is_active?: boolean | null;
    }
  ) => Promise<void>;
  onRewards: (rewards: { gold: number; xp: number }) => void;
  onDailyProgressUpdate?: (taskId: string, minutes: number) => void;
  onTimeSummaryUpdate?: (minutes: number, completedAt: Date) => void;
}

const DURATION_OPTIONS = [15, 25, 45, 60];

export interface ActivePomodoro {
  id: string;
  user_id: string;
  task_id: string;
  duration_minutes: number;
  started_at: string;
  ends_at: string;
  is_active: boolean;
}

interface RewardResult {
  leveled_up: boolean;
  new_level: number;
}

export default function PomodoroModal({
  task,
  activeSession,
  onSessionStart,
  onSessionEnd,
  onClose,
  onTaskUpdate,
  onRewards,
  onDailyProgressUpdate,
  onTimeSummaryUpdate,
}: PomodoroModalProps) {
  const { user, fetchProfile } = useUserStore();
  const [duration, setDuration] = useState(25);
  const [customInput, setCustomInput] = useState('25');
  const [secondsLeft, setSecondsLeft] = useState(duration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localSession, setLocalSession] = useState<ActivePomodoro | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [focusRating, setFocusRating] = useState(3);
  const [note, setNote] = useState('');
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }, [secondsLeft]);

  useEffect(() => {
    if (!activeSession) return;

    const sessionDuration = activeSession.duration_minutes;
    const sessionStart = new Date(activeSession.started_at);
    const sessionEnd = new Date(activeSession.ends_at);
    const remainingSeconds = Math.max(
      Math.round((sessionEnd.getTime() - Date.now()) / 1000),
      0
    );

    setDuration(sessionDuration);
    setCustomInput(String(sessionDuration));
    setStartTime(sessionStart);
    setSecondsLeft(remainingSeconds);
    setIsRunning(remainingSeconds > 0);
    setLocalSession(activeSession);
  }, [activeSession]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          // Timer finished naturally - auto-complete
          setIsRunning(false);
          setIsComplete(true);
          setShowReport(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning]);


  const handleStart = async () => {
    setError(null);
    if (!user) return;

    try {
      const startedAt = new Date();
      const endsAt = new Date(startedAt.getTime() + duration * 60 * 1000);

      const { data, error } = await supabase
        .from('active_pomodoros')
        .insert({
          user_id: user.id,
          task_id: task.id,
          duration_minutes: duration,
          started_at: startedAt.toISOString(),
          ends_at: endsAt.toISOString(),
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        const { data: existing } = await supabase
          .from('active_pomodoros')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();

        if (existing) {
          onSessionStart(existing as ActivePomodoro);
          setLocalSession(existing as ActivePomodoro);
          return;
        }
        throw error;
      }

      const session = data as ActivePomodoro;
      onSessionStart(session);
      setLocalSession(session);
      setSecondsLeft(duration * 60);
      setStartTime(startedAt);
      setIsRunning(true);
    } catch (err) {
      setError((err as Error).message || 'Failed to start pomodoro.');
    }
  };

  const handleComplete = async () => {
    if (!user || !startTime || isSaving) return;

    try {
      setIsSaving(true);
      const completedAt = new Date();
      const durationMinutes = localSession?.duration_minutes ?? activeSession?.duration_minutes ?? duration;
      const updatedPomodoros = (task.completed_pomodoros || 0) + 1;
      const updatedMinutes = (task.completed_minutes || 0) + durationMinutes;
      const targetPomodoros =
        task.task_type === 'daily'
          ? task.target_duration_minutes
            ? task.target_duration_minutes
            : null
          : task.estimated_minutes ?? (task.estimated_pomodoros ? task.estimated_pomodoros * 25 : null);
      const isCompleted = targetPomodoros ? updatedMinutes >= targetPomodoros : false;
      const rewards = { gold: task.gold_reward || 0, xp: task.xp_reward || 0 };

      // Insert pomodoro record (single source of truth for time tracking)
      const { error: insertError } = await supabase.from('pomodoros').insert({
        user_id: user.id,
        task_id: task.id,
        duration_minutes: durationMinutes,
        started_at: startTime.toISOString(),
        completed_at: completedAt.toISOString(),
        enemy_type: task.category || null,
        enemy_name: task.category || null,
        focus_rating: focusRating,
        accomplishment_note: note.trim() ? note.trim() : null,
        gold_earned: 0,
        xp_earned: 0,
      });

      if (insertError) throw insertError;

      // Fetch related tasks to update them as well
      // Only update related tasks if current task is a one-time task
      // This ensures the link is unidirectional: one-time -> daily, not daily -> one-time
      const { data: relatedTasks } = await supabase
        .from('task_relationships')
        .select('onetime_task_id, daily_task_id')
        .or(`onetime_task_id.eq.${task.id},daily_task_id.eq.${task.id}`);

      const relatedTaskIds: string[] = [];
      if (relatedTasks && relatedTasks.length > 0 && task.task_type === 'onetime') {
        relatedTasks.forEach((rel) => {
          if (rel.onetime_task_id === task.id) {
            relatedTaskIds.push(rel.daily_task_id);
          }
        });
      }

      const isDaily = task.task_type === 'daily';

      await onTaskUpdate(task.id, {
        completed_pomodoros: updatedPomodoros,
        completed_minutes: updatedMinutes,
        is_completed: isDaily ? false : isCompleted,
        completed_at: isDaily ? null : isCompleted ? completedAt.toISOString() : null,
        is_active: isDaily ? task.is_active : isCompleted ? false : task.is_active,
      });

      // Update related tasks with the same time duration
      if (relatedTaskIds.length > 0) {
        const { data: relatedTasksData } = await supabase
          .from('tasks')
          .select('*')
          .in('id', relatedTaskIds);

        if (relatedTasksData) {
          for (const relatedTask of relatedTasksData) {
            const relatedUpdatedMinutes = (relatedTask.completed_minutes || 0) + durationMinutes;
            const relatedUpdatedPomodoros = (relatedTask.completed_pomodoros || 0) + 1;

            if (relatedTask.task_type === 'daily') {
              // Update daily task completion
              const today = getLocalDateString();
              const utcDate = new Date().toISOString().slice(0, 10);

              const { data: allRecords } = await supabase
                .from('daily_task_completions')
                .select('*')
                .eq('task_id', relatedTask.id)
                .in('date', [today, utcDate]);

              if (allRecords && allRecords.length > 0) {
                const totalExistingMinutes = allRecords.reduce((sum, rec) => sum + (rec.minutes_completed || 0), 0);
                const nextMinutes = totalExistingMinutes + durationMinutes;

                const primaryRecord = allRecords.find(r => r.date === today) || allRecords[0];
                const recordsToDelete = allRecords.filter(r => r.id !== primaryRecord.id);

                await supabase
                  .from('daily_task_completions')
                  .update({
                    minutes_completed: nextMinutes,
                    is_completed: !!(relatedTask.target_duration_minutes && nextMinutes >= relatedTask.target_duration_minutes),
                    updated_at: new Date().toISOString(),
                    date: today,
                  })
                  .eq('id', primaryRecord.id);

                if (recordsToDelete.length > 0) {
                  await supabase
                    .from('daily_task_completions')
                    .delete()
                    .in('id', recordsToDelete.map((record) => record.id));
                }
              } else {
                await supabase.from('daily_task_completions').insert({
                  task_id: relatedTask.id,
                  user_id: user.id,
                  date: today,
                  minutes_completed: durationMinutes,
                  target_minutes: relatedTask.target_duration_minutes || durationMinutes,
                  is_completed: !!(relatedTask.target_duration_minutes && durationMinutes >= relatedTask.target_duration_minutes),
                });
              }
              onDailyProgressUpdate?.(relatedTask.id, durationMinutes);
            } else if (relatedTask.task_type === 'onetime') {
              // Update one-time task progress
              const relatedTargetMinutes = relatedTask.estimated_minutes ?? (relatedTask.estimated_pomodoros ? relatedTask.estimated_pomodoros * 25 : null);
              const relatedIsCompleted = relatedTargetMinutes ? relatedUpdatedMinutes >= relatedTargetMinutes : false;

              await supabase
                .from('tasks')
                .update({
                  completed_pomodoros: relatedUpdatedPomodoros,
                  completed_minutes: relatedUpdatedMinutes,
                  is_completed: relatedIsCompleted,
                  completed_at: relatedIsCompleted ? completedAt.toISOString() : null,
                  is_active: relatedIsCompleted ? false : relatedTask.is_active,
                })
                .eq('id', relatedTask.id);
            }
          }
        }
      }

      if (isDaily) {
        const today = getLocalDateString();
        const utcDate = new Date().toISOString().slice(0, 10);

        // Query for both local and UTC dates to handle transition period
        const { data: allRecords, error: existingError } = await supabase
          .from('daily_task_completions')
          .select('*')
          .eq('task_id', task.id)
          .in('date', [today, utcDate]);

        if (existingError && existingError.code !== 'PGRST116') {
          throw existingError;
        }

        // Consolidate records if there are multiple (transition from UTC to local)
        if (allRecords && allRecords.length > 0) {
          // Calculate total minutes from all records
          const totalExistingMinutes = allRecords.reduce((sum, rec) => sum + (rec.minutes_completed || 0), 0);
          const nextMinutes = totalExistingMinutes + durationMinutes;
          const nextCompleted = !!(
            task.target_duration_minutes && nextMinutes >= task.target_duration_minutes
          );

          // Use the record with local date if it exists, otherwise use the first one
          const primaryRecord = allRecords.find(r => r.date === today) || allRecords[0];
          const recordsToDelete = allRecords.filter(r => r.id !== primaryRecord.id);

          // Update primary record with consolidated minutes
          await supabase
            .from('daily_task_completions')
            .update({
              minutes_completed: nextMinutes,
              is_completed: nextCompleted,
              updated_at: new Date().toISOString(),
              date: today, // Ensure it uses local date
            })
            .eq('id', primaryRecord.id);

          // Delete duplicate records
          if (recordsToDelete.length > 0) {
            await supabase
              .from('daily_task_completions')
              .delete()
              .in('id', recordsToDelete.map(r => r.id));
          }

          const existing = primaryRecord;

          if (!existing.is_completed && nextCompleted) {
            const { data: rewardResult, error: rewardError } = await supabase.rpc('add_rewards', {
              user_uuid: user.id,
              gold_amount: rewards.gold,
              xp_amount: rewards.xp,
            });

            if (rewardError) throw rewardError;

            await supabase
              .from('pomodoros')
              .update({ gold_earned: rewards.gold, xp_earned: rewards.xp })
              .eq('task_id', task.id)
              .eq('completed_at', completedAt.toISOString());

            const reward = rewardResult as unknown as RewardResult;
            if (reward?.leveled_up) {
              setLevelUpLevel(reward.new_level);
            }

            onRewards(rewards);
          }
        } else {
          const reachedTarget =
            task.target_duration_minutes
              ? durationMinutes >= task.target_duration_minutes
              : false;

          await supabase.from('daily_task_completions').insert({
            task_id: task.id,
            user_id: user.id,
            date: today,
            minutes_completed: durationMinutes,
            target_minutes: task.target_duration_minutes || durationMinutes,
            is_completed: reachedTarget,
          });

          if (reachedTarget) {
            const { data: rewardResult, error: rewardError } = await supabase.rpc('add_rewards', {
              user_uuid: user.id,
              gold_amount: rewards.gold,
              xp_amount: rewards.xp,
            });

            if (rewardError) throw rewardError;

            await supabase
              .from('pomodoros')
              .update({ gold_earned: rewards.gold, xp_earned: rewards.xp })
              .eq('task_id', task.id)
              .eq('completed_at', completedAt.toISOString());

            const reward = rewardResult as unknown as RewardResult;
            if (reward?.leveled_up) {
              setLevelUpLevel(reward.new_level);
            }

            onRewards(rewards);
          }
        }

        if (task.target_duration_minutes) {
          const today = getLocalDateString();
          const { data: dailyTasks } = await supabase
            .from('tasks')
            .select('id')
            .eq('user_id', user.id)
            .eq('task_type', 'daily')
            .eq('is_active', true)
            .eq('is_archived', false);

          const dailyTaskIds = (dailyTasks || []).map((row) => row.id);
          if (dailyTaskIds.length > 0) {
            const { data: completedToday } = await supabase
              .from('daily_task_completions')
              .select('task_id')
              .in('task_id', dailyTaskIds)
              .eq('date', today)
              .eq('is_completed', true);

            if (completedToday && completedToday.length === dailyTaskIds.length) {
              const { data: profile } = await supabase
                .from('user_profiles')
                .select('current_streak, longest_streak, last_streak_date')
                .eq('id', user.id)
                .single();

              if (profile?.last_streak_date !== today) {
                const nextStreak = (profile?.current_streak || 0) + 1;
                await supabase
                  .from('user_profiles')
                  .update({
                    current_streak: nextStreak,
                    longest_streak: Math.max(profile?.longest_streak || 0, nextStreak),
                    last_streak_date: today,
                  })
                  .eq('id', user.id);
              }
            }
          }
        }

        onDailyProgressUpdate?.(task.id, durationMinutes);
      }

      const sessionId = localSession?.id ?? activeSession?.id;
      if (sessionId) {
        await supabase.from('active_pomodoros').delete().eq('id', sessionId);
        onSessionEnd();
        setLocalSession(null);
      }

      if (!isDaily && isCompleted && !task.is_completed) {
        const { data: rewardResult, error: rewardError } = await supabase.rpc('add_rewards', {
          user_uuid: user.id,
          gold_amount: rewards.gold,
          xp_amount: rewards.xp,
        });

        if (rewardError) throw rewardError;

        await supabase
          .from('pomodoros')
          .update({ gold_earned: rewards.gold, xp_earned: rewards.xp })
          .eq('task_id', task.id)
          .eq('completed_at', completedAt.toISOString());

        const reward = rewardResult as unknown as RewardResult;
        if (reward?.leveled_up) {
          setLevelUpLevel(reward.new_level);
        }

        onRewards(rewards);
      }
      onTimeSummaryUpdate?.(durationMinutes, completedAt);
      fetchProfile();
      setShowReport(false);
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to save pomodoro.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setIsRunning(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg bg-slate-900 rounded-2xl border border-purple-500/30 shadow-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Pomodoro</p>
            <h3 className="text-2xl font-bold text-white">{task.title}</h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-400">Focus timer</p>
          <div className="text-5xl font-bold text-white">{formattedTime}</div>
          {!isRunning && !isComplete && (
            <p className="text-xs text-gray-500">Select a duration and begin.</p>
          )}
        </div>

        {!isRunning && !isComplete && !activeSession && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {DURATION_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setDuration(option);
                    setCustomInput(String(option));
                    setSecondsLeft(option * 60);
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    duration === option
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-800 text-gray-300 hover:text-white'
                  }`}
                >
                  {option} min
                </button>
              ))}
            </div>
            <div className="flex items-center justify-center gap-2">
              <label className="text-xs text-gray-400">Custom minutes</label>
              <input
                type="number"
                min={5}
                value={customInput}
                onChange={(event) => {
                  const inputVal = event.target.value;
                  setCustomInput(inputVal);

                  if (inputVal === '') {
                    return;
                  }

                  const value = Number(inputVal);
                  if (!Number.isNaN(value) && value > 0) {
                    setDuration(value);
                    setSecondsLeft(value * 60);
                  }
                }}
                className="w-24 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-base"
              />
            </div>
          </div>
        )}

        {showReport && (
          <div className="space-y-4 bg-slate-800/70 border border-purple-500/20 rounded-lg p-4">
            <div>
              <p className="text-xs text-gray-400 mb-2">Focus rating</p>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setFocusRating(rating)}
                    className={`w-9 h-9 rounded-full text-sm font-semibold transition-colors ${
                      focusRating >= rating
                        ? 'bg-yellow-400 text-slate-900'
                        : 'bg-slate-900 text-gray-400'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">Accomplishment</label>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-base"
                placeholder="What did you get done?"
              />
            </div>
            <button
              type="button"
              onClick={handleComplete}
              disabled={isSaving}
              className="w-full px-4 py-2 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : 'Save Report'}
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-slate-800 text-gray-300 rounded-lg font-semibold hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
          {showReport ? null : !isRunning && !isComplete && !activeSession ? (
            <button
              type="button"
              onClick={handleStart}
              className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-400 transition-colors"
            >
              Start
            </button>
          ) : (
            <div className="flex-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRunning((prev) => !prev)}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-500 transition-colors"
              >
                {isRunning ? 'Pause' : 'Resume'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSecondsLeft(0);
                  setIsComplete(true);
                  setShowReport(true);
                }}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-500 transition-colors"
              >
                Complete
              </button>
            </div>
          )}
        </div>
      </div>
      {levelUpLevel && (
        <LevelUpModal level={levelUpLevel} onClose={() => setLevelUpLevel(null)} />
      )}
    </div>
  );
}
