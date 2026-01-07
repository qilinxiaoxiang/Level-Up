import { useState, useEffect } from 'react';
import { Dices, Loader2, Zap, History } from 'lucide-react';
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
  revelation?: string;
  systemPrompt?: string;
  userPrompt?: string;
  suggestionType?: string;
  error?: string;
}

interface NextTaskSuggestionProps {
  onViewHistory: () => void;
}

export default function NextTaskSuggestion({ onViewHistory }: NextTaskSuggestionProps) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();

  useEffect(() => {
    fetchLatestSuggestion();
  }, []);

  const fetchLatestSuggestion = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error: fetchError } = await supabase
        .from('revelations')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('suggestion_type', 'next_task')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No rows found - this is fine
          setSuggestion(null);
        } else {
          console.error('Error fetching latest suggestion:', fetchError);
        }
        return;
      }

      setSuggestion(data.revelation_text);
    } catch (err) {
      console.error('Failed to fetch latest suggestion:', err);
    } finally {
      setLoading(false);
    }
  };

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

      if (!response.revelation) {
        throw new Error('No suggestion received');
      }

      // Save to revelations table with suggestion_type
      console.log('Saving task suggestion to database...');
      const { error: saveError } = await supabase.from('revelations').insert({
        user_id: session.user.id,
        user_message: null,
        provider: 'deepseek',
        revelation_text: response.revelation,
        suggestion_type: 'next_task',
        context_snapshot: {
          systemPrompt: response.systemPrompt,
          userPrompt: response.userPrompt,
          timestamp: new Date().toISOString(),
          timeOfDay: context.temporal.timeOfDay,
          streak: context.performance.streak.current,
        },
      });

      if (saveError) {
        console.error('Error saving task suggestion:', saveError);
        // Don't fail the request if saving fails
      }

      setSuggestion(response.revelation);
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

    // Parse format: Duration: xxx\nTask: yyy\nMeaning: zzz
    const lines = suggestion.split('\n').filter(l => l.trim());
    let duration = '';
    let task = '';
    let meaning = '';
    let currentField = '';

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('Duration:') || trimmed.startsWith('**Duration:**')) {
        duration = trimmed.replace(/\*\*Duration:\*\*|Duration:/, '').trim();
        currentField = 'duration';
      } else if (trimmed.startsWith('Task:') || trimmed.startsWith('**Task:**')) {
        task = trimmed.replace(/\*\*Task:\*\*|Task:/, '').trim();
        currentField = 'task';
      } else if (trimmed.startsWith('Meaning:') || trimmed.startsWith('**Meaning:**')) {
        meaning = trimmed.replace(/\*\*Meaning:\*\*|Meaning:/, '').trim();
        currentField = 'meaning';
      } else if (trimmed && currentField === 'task') {
        task += ' ' + trimmed;
      } else if (trimmed && currentField === 'meaning') {
        meaning += ' ' + trimmed;
      }
    }

    return { duration, task, meaning };
  };

  const parsed = parseSuggestion();

  return (
    <div className="bg-gradient-to-br from-slate-800/50 via-amber-900/10 to-slate-800/50 border border-amber-500/30 rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 p-5 pb-4 border-b border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Zap className="text-amber-400" size={28} />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400">
              Next Move
            </h3>
            <p className="text-xs text-amber-400/60">Your next crystallized moment</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={rollTask}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 disabled:from-gray-600 disabled:to-gray-600 text-white text-sm font-bold rounded-lg transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span className="hidden sm:inline">Rolling...</span>
              </>
            ) : (
              <>
                <Dices size={18} />
                <span className="hidden sm:inline">Roll</span>
                <span className="sm:hidden">Roll</span>
              </>
            )}
          </button>
          <button
            onClick={onViewHistory}
            className="p-2 bg-slate-700/50 hover:bg-slate-600/50 text-gray-300 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
          >
            <History size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {!suggestion && !error && !loading && (
          <div className="text-center py-8">
            <div className="inline-block p-4 bg-amber-500/10 rounded-full mb-4">
              <Dices size={32} className="text-amber-400" />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto">
              Roll the dice to illuminate your next meaningful action — a task that transforms ambition into reality
            </p>
          </div>
        )}

        {parsed && (
          <div className="space-y-4">
            {/* Task with Duration */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-xl blur-xl" />
              <div className="relative bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/40 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <p className="text-xs text-amber-400/80 font-semibold tracking-wider uppercase">The Action</p>
                      {parsed.duration && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/20 border border-amber-500/40 rounded-full">
                          <Zap size={12} className="text-amber-400" />
                          <span className="text-amber-300 font-bold text-xs">{parsed.duration}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-white font-medium text-base leading-relaxed">{parsed.task}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Meaning */}
            {parsed.meaning && (
              <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
                <p className="text-xs text-gray-500 font-semibold mb-3 tracking-wider uppercase">The Meaning</p>
                <p className="text-gray-300 text-sm leading-relaxed italic">{parsed.meaning}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
