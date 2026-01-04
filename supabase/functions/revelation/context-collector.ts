import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

export interface RevelationContext {
  goals: {
    threeYear: any[];
    oneYear: any[];
    oneMonth: any[];
  };
  tasks: {
    daily: {
      active: any[];
      paused: any[];
      todayProgress: any[];
    };
    onetime: {
      active: any[];
      paused: any[];
      withDeadlines: any[];
      recentlyCompleted: any[];
    };
  };
  temporal: {
    currentTime: string;
    currentLocalTime: string;
    dayCutTime: string;
    dayCutTimezone: string;
    localTimezoneOffset: string;
    dayCutLocalTime: string;
    timeUntilDayEnd: string;
    dayOfWeek: string;
    timeOfDay: string;
  };
  performance: {
    last7Days: {
      pomodorosByDay: any[];
      pomodorosByTask: any[];
      totalCount: number;
      avgPerDay: number;
      avgFocusRating: number;
    };
    streak: {
      current: number;
      longest: number;
    };
  };
  profile: {
    todayPomodoros: number;
  };
  userMessage?: string;
}

export async function collectRevelationContext(
  supabase: SupabaseClient,
  userId: string,
  userMessage?: string
): Promise<RevelationContext> {
  // Fetch user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!profile) {
    throw new Error('User profile not found');
  }

  // Fetch goals
  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('target_date', { ascending: true });

  const threeYearGoals = goals?.filter((g) => g.goal_type === '3year') || [];
  const oneYearGoals = goals?.filter((g) => g.goal_type === '1year') || [];
  const oneMonthGoals = goals?.filter((g) => g.goal_type === '1month') || [];

  // Fetch tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('created_at', { ascending: false });

  const dailyTasks = tasks?.filter((t) => t.task_type === 'daily') || [];
  const onetimeTasks = tasks?.filter((t) => t.task_type === 'onetime') || [];

  const { data: relationships } = await supabase
    .from('task_relationships')
    .select('onetime_task_id, daily_task_id')
    .eq('user_id', userId);

  const dailyTitleById = new Map(dailyTasks.map((task) => [task.id, task.title]));
  const onetimeToDailyMap = new Map<string, string[]>();
  (relationships || []).forEach((rel) => {
    const existing = onetimeToDailyMap.get(rel.onetime_task_id) || [];
    existing.push(rel.daily_task_id);
    onetimeToDailyMap.set(rel.onetime_task_id, existing);
  });

  const activeDailyTasks = dailyTasks.filter((t) => t.is_active && !t.is_completed);
  const pausedDailyTasks = dailyTasks.filter((t) => !t.is_active && !t.is_completed);

  const activeOnetimeTasks = onetimeTasks.filter((t) => t.is_active && !t.is_completed).map((t) => ({
    ...t,
    linkedDailyTitles: (onetimeToDailyMap.get(t.id) || [])
      .map((dailyId) => dailyTitleById.get(dailyId))
      .filter(Boolean),
  }));
  const pausedOnetimeTasks = onetimeTasks.filter((t) => !t.is_active && !t.is_completed);

  // Get onetime tasks with approaching deadlines (within 7 days)
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const tasksWithDeadlines = onetimeTasks.filter((t) => {
    if (!t.deadline || t.is_completed) return false;
    const deadline = new Date(t.deadline);
    return deadline >= now && deadline <= sevenDaysFromNow;
  });

  // Get recently completed onetime tasks (last 7 days)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentlyCompleted = onetimeTasks.filter((t) => {
    if (!t.completed_at) return false;
    const completedAt = new Date(t.completed_at);
    return completedAt >= sevenDaysAgo;
  });

  // Fetch pomodoros from last 7 days
  const { data: recentPomodoros } = await supabase
    .from('pomodoros')
    .select('*')
    .eq('user_id', userId)
    .not('completed_at', 'is', null)
    .gte('completed_at', sevenDaysAgo.toISOString())
    .order('completed_at', { ascending: false });

  // Calculate today's progress for daily tasks
  const startOfToday = getStartOfDayUTC(profile.daily_reset_time, profile.timezone_name);
  const { data: todayPomodoros } = await supabase
    .from('pomodoros')
    .select('task_id, duration_minutes')
    .eq('user_id', userId)
    .not('completed_at', 'is', null)
    .gte('completed_at', startOfToday);

  const todayProgressMap = new Map<string, number>();
  todayPomodoros?.forEach((p) => {
    if (p.task_id) {
      const current = todayProgressMap.get(p.task_id) || 0;
      todayProgressMap.set(p.task_id, current + (p.duration_minutes || 0));
    }
  });

  const todayProgress = activeDailyTasks.map((task) => ({
    taskId: task.id,
    taskTitle: task.title,
    targetMinutes: task.target_duration_minutes || 0,
    completedMinutes: todayProgressMap.get(task.id) || 0,
    isDone: (todayProgressMap.get(task.id) || 0) >= (task.target_duration_minutes || 0),
  }));

  // Aggregate pomodoro stats
  const pomodorosByDay = aggregatePomodorosByDay(recentPomodoros || []);
  const pomodorosByTask = aggregatePomodorosByTask(recentPomodoros || [], tasks || []);
  const totalCount = recentPomodoros?.length || 0;
  const avgPerDay = totalCount / 7;
  const avgFocusRating = calculateAvgFocusRating(recentPomodoros || []);

  // Get temporal context
  const temporal = getTemporalContext(profile.daily_reset_time, profile.timezone_name);

  return {
    goals: {
      threeYear: threeYearGoals,
      oneYear: oneYearGoals,
      oneMonth: oneMonthGoals,
    },
    tasks: {
      daily: {
        active: activeDailyTasks,
        paused: pausedDailyTasks,
        todayProgress,
      },
      onetime: {
        active: activeOnetimeTasks,
        paused: pausedOnetimeTasks,
        withDeadlines: tasksWithDeadlines,
        recentlyCompleted,
      },
    },
    temporal,
    performance: {
      last7Days: {
        pomodorosByDay,
        pomodorosByTask,
        totalCount,
        avgPerDay,
        avgFocusRating,
      },
      streak: {
        current: profile.current_streak || 0,
        longest: profile.longest_streak || 0,
      },
    },
    profile: {
      todayPomodoros: todayPomodoros?.length || 0,
    },
    userMessage,
  };
}

function getStartOfDayUTC(dayCutTime: string | null, timezone: string | null): string {
  const now = new Date();
  const tz = timezone || 'Asia/Shanghai';
  const cutTime = dayCutTime || '00:00';
  const [hours = 0, minutes = 0] = cutTime.split(':').map(Number);

  // Get current date in user's timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(now);
  const dateParts: Record<string, string> = {};
  parts.forEach((p) => {
    if (p.type !== 'literal') dateParts[p.type] = p.value;
  });

  // Create a proper date in the user's timezone
  // Parse the date parts
  const year = parseInt(dateParts.year || '2024');
  const month = parseInt(dateParts.month || '1') - 1; // JS months are 0-indexed
  const day = parseInt(dateParts.day || '1');

  // Create date in UTC, then adjust for timezone
  // This is a simplified approach - create a date string that works
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00.000Z`;

  // For now, return a simple ISO string based on current date
  const today = new Date();
  today.setHours(hours, minutes, 0, 0);
  return today.toISOString();
}

function getTemporalContext(dayCutTime: string | null, timezone: string | null) {
  const now = new Date();
  const tz = timezone || 'Asia/Shanghai';
  const cutTime = dayCutTime || '00:00';

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const timeStr = formatter.format(now);
  const dayOfWeek = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long' }).format(
    now
  );
  const localTimezoneOffset =
    new Intl.DateTimeFormat('en-US', { timeZoneName: 'shortOffset' })
      .formatToParts(now)
      .find((part) => part.type === 'timeZoneName')
      ?.value || 'GMT';

  // Determine time of day
  const hour = now.getHours();
  let timeOfDay: string;
  if (hour >= 5 && hour < 12) timeOfDay = 'morning';
  else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
  else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
  else timeOfDay = 'night';

  // Calculate time until day end
  const [cutHours, cutMinutes] = cutTime.split(':').map(Number);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(cutHours, cutMinutes, 0, 0);
  const msUntilDayEnd = Math.max(0, tomorrow.getTime() - now.getTime());
  const hoursUntilDayEnd = Math.floor(msUntilDayEnd / (1000 * 60 * 60));
  const minutesUntilDayEnd = Math.floor((msUntilDayEnd % (1000 * 60 * 60)) / (1000 * 60));

  return {
    currentTime: now.toISOString(),
    currentLocalTime: timeStr,
    dayCutTime: cutTime,
    dayCutTimezone: tz,
    localTimezoneOffset,
    dayCutLocalTime: new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).format(tomorrow),
    timeUntilDayEnd: `${hoursUntilDayEnd} hours ${minutesUntilDayEnd} min`,
    dayOfWeek,
    timeOfDay,
  };
}

function aggregatePomodorosByDay(pomodoros: any[]) {
  const byDay = new Map<string, { count: number; totalMinutes: number }>();

  pomodoros.forEach((p) => {
    if (!p.completed_at) return;
    const date = p.completed_at.slice(0, 10);
    const current = byDay.get(date) || { count: 0, totalMinutes: 0 };
    byDay.set(date, {
      count: current.count + 1,
      totalMinutes: current.totalMinutes + (p.duration_minutes || 0),
    });
  });

  return Array.from(byDay.entries()).map(([date, stats]) => ({
    date,
    ...stats,
  }));
}

function aggregatePomodorosByTask(pomodoros: any[], tasks: any[]) {
  const byTask = new Map<string, number>();

  pomodoros.forEach((p) => {
    if (!p.task_id) return;
    const current = byTask.get(p.task_id) || 0;
    byTask.set(p.task_id, current + 1);
  });

  const taskMap = new Map(tasks.map((t) => [t.id, t.title]));

  return Array.from(byTask.entries()).map(([taskId, count]) => ({
    taskId,
    taskTitle: taskMap.get(taskId) || 'Unknown Task',
    count,
  }));
}

function calculateAvgFocusRating(pomodoros: any[]): number {
  const withRatings = pomodoros.filter((p) => p.focus_rating != null);
  if (withRatings.length === 0) return 0;

  const sum = withRatings.reduce((acc, p) => acc + p.focus_rating, 0);
  return sum / withRatings.length;
}
