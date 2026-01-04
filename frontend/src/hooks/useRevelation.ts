import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { generateRevelationPrompts, type RevelationContext } from '../utils/revelationPrompts';
import {
  getStartOfDayUTC,
  getEndOfDayUTC,
  parseDailyResetTimeToMinutes,
  setDayCutOffsetMinutes,
  setTimezoneName,
} from '../utils/dateUtils';
import { format, formatDistanceToNow } from 'date-fns';

interface RevelationResponse {
  success: boolean;
  revelation?: string;
  error?: string;
}

export function useRevelation() {
  const [revelation, setRevelation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const collectContext = async (userId: string, userMessage?: string): Promise<RevelationContext> => {
    // Fetch user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!profile) {
      throw new Error('Profile not found');
    }

    // Calculate temporal information - Use SYSTEM time (user's actual timezone)
    const now = new Date();
    const dayCutTimezone = profile.timezone_name || 'Asia/Shanghai';
    const dayCutTime = profile.daily_reset_time || '00:00:00';

    setTimezoneName(dayCutTimezone);
    setDayCutOffsetMinutes(parseDailyResetTimeToMinutes(dayCutTime));

    // Get user's SYSTEM local time (their actual timezone)
    const currentLocalTime = format(now, 'MMM dd yyyy, h:mm a');
    const dayOfWeek = format(now, 'EEEE');
    const localTimezoneOffset =
      new Intl.DateTimeFormat('en-US', { timeZoneName: 'shortOffset' })
        .formatToParts(now)
        .find((part) => part.type === 'timeZoneName')
        ?.value || 'GMT';
    const currentHour = now.getHours();

    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    if (currentHour >= 5 && currentHour < 12) timeOfDay = 'morning';
    else if (currentHour >= 12 && currentHour < 17) timeOfDay = 'afternoon';
    else if (currentHour >= 17 && currentHour < 21) timeOfDay = 'evening';
    else timeOfDay = 'night';

    const endOfDayDate = new Date(getEndOfDayUTC(now));
    const endOfDay = endOfDayDate.getTime();
    const diffMs = Math.max(0, endOfDay - now.getTime());
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const timeUntilDayEnd = `${diffHours} hours ${diffMinutes} min`;
    const isTomorrow = format(now, 'yyyy-MM-dd') !== format(endOfDayDate, 'yyyy-MM-dd');
    const dayCutLocalTime = format(new Date(endOfDayDate.getTime() + 1), 'h:mm a') + (isTomorrow ? ' tomorrow' : '');

    // Fetch goals
    const { data: goalsData } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    const goals = {
      threeYear: goalsData?.find(g => g.goal_type === '3year')?.description || null,
      oneYear: goalsData?.find(g => g.goal_type === '1year')?.description || null,
      oneMonth: goalsData?.find(g => g.goal_type === '1month')?.description || null,
    };

    // Fetch tasks
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false);

    const dailyTasks = tasksData?.filter(t => t.task_type === 'daily') || [];
    const onetimeTasks = tasksData?.filter(t => t.task_type === 'onetime') || [];

    // Calculate today's daily task progress from pomodoros (no foreign keys)
    const dayStart = getStartOfDayUTC(now);
    const dayEnd = getEndOfDayUTC(now);
    const { data: todayPomodoros } = await supabase
      .from('pomodoros')
      .select('id, task_id, duration_minutes')
      .eq('user_id', userId)
      .gte('completed_at', dayStart)
      .lte('completed_at', dayEnd)
      .not('completed_at', 'is', null);

    const { data: relationships } = await supabase
      .from('task_relationships')
      .select('onetime_task_id, daily_task_id')
      .eq('user_id', userId);

    const dailyToOnetimeMap: Record<string, string[]> = {};
    const onetimeToDailyMap: Record<string, string[]> = {};
    (relationships || []).forEach((rel) => {
      if (!dailyToOnetimeMap[rel.daily_task_id]) {
        dailyToOnetimeMap[rel.daily_task_id] = [];
      }
      dailyToOnetimeMap[rel.daily_task_id].push(rel.onetime_task_id);
      if (!onetimeToDailyMap[rel.onetime_task_id]) {
        onetimeToDailyMap[rel.onetime_task_id] = [];
      }
      onetimeToDailyMap[rel.onetime_task_id].push(rel.daily_task_id);
    });

    const minutesByTask: Record<string, number> = {};
    (todayPomodoros || []).forEach((p) => {
      if (p.task_id) {
        minutesByTask[p.task_id] = (minutesByTask[p.task_id] || 0) + (p.duration_minutes || 0);
      }
    });

    const dailyTitleById = new Map(dailyTasks.map((task) => [task.id, task.title]));

    const todayProgress = dailyTasks.map(task => {
      const targetMinutes = task.target_duration_minutes || 60;
      const linkedOnetimeIds = dailyToOnetimeMap[task.id] || [];
      const linkedMinutes = linkedOnetimeIds.reduce((sum, id) => sum + (minutesByTask[id] || 0), 0);
      const completedMinutes = (minutesByTask[task.id] || 0) + linkedMinutes;
      return {
        taskTitle: task.title,
        targetMinutes,
        completedMinutes,
        isDone: completedMinutes >= targetMinutes,
      };
    });

    // Filter one-time tasks
    const activeOnetimeTasks = onetimeTasks.filter(t => t.is_active && !t.is_completed).map(t => {
      const linkedDailyTitles = (onetimeToDailyMap[t.id] || [])
        .map((dailyId) => dailyTitleById.get(dailyId))
        .filter((title): title is string => Boolean(title));
      return {
        title: t.title,
        description: t.description,
        priority: t.priority,
        deadline: t.deadline,
        estimated_minutes: t.estimated_minutes,
        completed_minutes: t.completed_minutes,
        linkedDailyTitles,
      };
    });

    const tasksWithDeadlines = activeOnetimeTasks
      .filter(t => t.deadline)
      .map(t => ({
        title: t.title,
        deadline: t.deadline!,
        estimated_minutes: t.estimated_minutes,
        completed_minutes: t.completed_minutes,
      }))
      .filter(t => {
        const daysUntil = Math.ceil((new Date(t.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntil <= 7 && daysUntil >= 0;
      });

    // Fetch performance data (last 7 days) - NO FOREIGN KEYS
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { data: pomodorosData } = await supabase
      .from('pomodoros')
      .select('*')
      .eq('user_id', userId)
      .gte('completed_at', weekAgo.toISOString())
      .not('completed_at', 'is', null);

    const totalCount = pomodorosData?.length || 0;
    const avgPerDay = totalCount / 7;
    const avgFocusRating = pomodorosData?.reduce((sum, p) => sum + (p.focus_rating || 0), 0) / (totalCount || 1);

    // Fetch task titles for pomodoros - manually join
    const taskIds = [...new Set(pomodorosData?.map(p => p.task_id).filter(Boolean) || [])];
    const { data: tasksForPomodoros } = taskIds.length
      ? await supabase
          .from('tasks')
          .select('id, title')
          .in('id', taskIds)
      : { data: [] };

    const taskTitleMap = new Map<string, string>(
      tasksForPomodoros?.map(t => [t.id, t.title] as [string, string]) || []
    );

    const pomodorosByTask = pomodorosData?.reduce((acc, p) => {
      const taskTitle = p.task_id ? (taskTitleMap.get(p.task_id) || 'Unknown') : 'Unknown';
      const existing = acc.find(item => item.taskTitle === taskTitle);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ taskTitle, count: 1 });
      }
      return acc;
    }, [] as Array<{ taskTitle: string; count: number }>);

    pomodorosByTask?.sort((a, b) => b.count - a.count);

    const todayPomodoroCount = todayPomodoros?.length || 0;

    return {
      profile: {
        todayPomodoros: todayPomodoroCount,
      },
      temporal: {
        currentLocalTime,
        dayOfWeek,
        localTimezoneOffset,
        timeOfDay,
        dayCutTime: dayCutTime.slice(0, 5),
        dayCutTimezone,
        dayCutLocalTime,
        timeUntilDayEnd,
      },
      goals,
      tasks: {
        daily: {
          todayProgress,
        },
        onetime: {
          active: activeOnetimeTasks,
          withDeadlines: tasksWithDeadlines,
        },
      },
      performance: {
        streak: {
          current: profile.current_streak || 0,
          longest: profile.longest_streak || 0,
        },
        last7Days: {
          totalCount,
          avgPerDay,
          avgFocusRating,
          pomodorosByTask: pomodorosByTask || [],
        },
      },
      userMessage,
    };
  };

  const getRevelation = async (userMessage?: string, provider: 'deepseek' | 'openai' = 'deepseek') => {
    setLoading(true);
    setError(null);

    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      // Collect context from frontend
      console.log('Collecting context...');
      const context = await collectContext(session.user.id, userMessage);

      // Generate prompts
      console.log('Generating prompts...');
      const { systemPrompt, userPrompt } = generateRevelationPrompts(context);

      // Call the Edge Function (only for LLM API call)
      console.log('Calling LLM via Edge Function...');
      const { data, error: functionError } = await supabase.functions.invoke('revelation', {
        body: { systemPrompt, userPrompt, provider },
      });

      if (functionError) {
        throw functionError;
      }

      const response = data as RevelationResponse;

      if (!response.success) {
        throw new Error(response.error || 'Failed to get revelation');
      }

      const revelationText = response.revelation;
      if (!revelationText) {
        throw new Error('No revelation received');
      }

      // Save to database with full prompts
      console.log('Saving revelation to database...');
      const { error: saveError } = await supabase.from('revelations').insert({
        user_id: session.user.id,
        user_message: userMessage || null,
        provider,
        revelation_text: revelationText,
        context_snapshot: {
          systemPrompt,
          userPrompt,
          timestamp: new Date().toISOString(),
          timeOfDay: context.temporal.timeOfDay,
          streak: context.performance.streak.current,
          tasksCompleted: context.tasks.daily.todayProgress.filter((t) => t.isDone).length,
          totalDailyTasks: context.tasks.daily.todayProgress.length,
        },
      });

      if (saveError) {
        console.error('Error saving revelation:', saveError);
        // Don't fail the request if saving fails
      }

      setRevelation(revelationText);
      return revelationText;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Revelation error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const clearRevelation = () => {
    setRevelation(null);
    setError(null);
  };

  return {
    revelation,
    loading,
    error,
    getRevelation,
    clearRevelation,
  };
}
