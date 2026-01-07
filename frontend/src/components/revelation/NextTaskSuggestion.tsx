import { useState } from 'react';
import { Dices, Loader2, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { type RevelationContext } from '../../utils/revelationPrompts';
import { useAuth } from '../../hooks/useAuth';
import {
  getStartOfDayUTC,
  getEndOfDayUTC,
  parseDailyResetTimeToMinutes,
  setDayCutOffsetMinutes,
  setTimezoneName,
} from '../../utils/dateUtils';
import { format } from 'date-fns';

interface TaskSuggestionResponse {
  success: boolean;
  suggestion?: string;
  error?: string;
}

export default function NextTaskSuggestion() {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();

  const collectContext = async (userId: string): Promise<RevelationContext> => {
    // Fetch user profile
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!profileData) {
      throw new Error('Profile not found');
    }

    // Calculate temporal information
    const now = new Date();
    const dayCutTimezone = profileData.timezone_name || 'Asia/Shanghai';
    const dayCutTime = profileData.daily_reset_time || '00:00:00';

    setTimezoneName(dayCutTimezone);
    setDayCutOffsetMinutes(parseDailyResetTimeToMinutes(dayCutTime));

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

    // Calculate today's daily task progress
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

    // Fetch performance data (last 7 days)
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
          withDeadlines: [],
        },
      },
      performance: {
        streak: {
          current: profileData.current_streak || 0,
          longest: profileData.longest_streak || 0,
        },
        last7Days: {
          totalCount,
          avgPerDay,
          avgFocusRating,
          pomodorosByTask: pomodorosByTask || [],
        },
      },
    };
  };

  const rollTask = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Collect context
      const context = await collectContext(session.user.id);

      // Call Edge Function with task_suggestion type
      const { data, error: functionError } = await supabase.functions.invoke('revelation', {
        body: {
          context,
          provider: 'deepseek',
          suggestionType: 'next_task'
        },
      });

      if (functionError) {
        throw functionError;
      }

      const response = data as TaskSuggestionResponse;

      if (!response.success) {
        throw new Error(response.error || 'Failed to get task suggestion');
      }

      if (!response.suggestion) {
        throw new Error('No suggestion received');
      }

      setSuggestion(response.suggestion);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Task suggestion error:', err);
    } finally {
      setLoading(false);
    }
  };

  const parseSuggestion = () => {
    if (!suggestion) return null;

    // Parse format: Task: xxx\nRationale: yyy
    const lines = suggestion.split('\n');
    let task = '';
    let rationale = '';

    for (const line of lines) {
      if (line.startsWith('Task:') || line.startsWith('**Task:**')) {
        task = line.replace(/\*\*Task:\*\*|Task:/, '').trim();
      } else if (line.startsWith('Rationale:') || line.startsWith('**Rationale:**')) {
        rationale = line.replace(/\*\*Rationale:\*\*|Rationale:/, '').trim();
      } else if (task && !rationale && line.trim()) {
        task += ' ' + line.trim();
      } else if (rationale && line.trim()) {
        rationale += ' ' + line.trim();
      }
    }

    return { task, rationale };
  };

  const parsed = parseSuggestion();

  return (
    <div className="bg-gradient-to-br from-slate-800/50 via-green-900/10 to-slate-800/50 border border-green-500/20 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <Zap className="text-green-400" size={24} />
          <div>
            <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
              Next Task
            </h3>
            <p className="text-xs text-gray-400">AI-suggested action</p>
          </div>
        </div>
        <button
          onClick={rollTask}
          disabled={loading}
          className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span className="hidden sm:inline">Rolling...</span>
            </>
          ) : (
            <>
              <Dices size={16} />
              <span className="hidden sm:inline">Roll Task</span>
              <span className="sm:hidden">Roll</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {!suggestion && !error && !loading && (
        <div className="text-center py-6 text-gray-400 text-sm">
          Roll the dice to get an AI-suggested task based on your goals
        </div>
      )}

      {parsed && (
        <div className="space-y-3">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <p className="text-xs text-green-400 font-semibold mb-1">SUGGESTED TASK</p>
            <p className="text-white font-medium">{parsed.task}</p>
          </div>
          {parsed.rationale && (
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
              <p className="text-xs text-gray-400 font-semibold mb-1">RATIONALE</p>
              <p className="text-gray-300 text-sm leading-relaxed">{parsed.rationale}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
