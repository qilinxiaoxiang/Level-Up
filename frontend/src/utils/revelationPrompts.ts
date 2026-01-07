export interface RevelationContext {
  profile: {
    todayPomodoros: number;
  };
  temporal: {
    currentLocalTime: string;
    dayOfWeek: string;
    localTimezoneOffset: string;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    dayCutTime: string;
    dayCutTimezone: string;
    dayCutLocalTime: string;
    timeUntilDayEnd: string;
  };
  goals: {
    threeYear: string | null;
    oneYear: string | null;
    oneMonth: string | null;
  };
  tasks: {
    daily: {
      todayProgress: Array<{
        taskTitle: string;
        targetMinutes: number;
        completedMinutes: number;
        isDone: boolean;
      }>;
    };
    onetime: {
      active: Array<{
        title: string;
        description: string | null;
        priority: string | null;
        deadline: string | null;
        estimated_minutes: number | null;
        completed_minutes: number | null;
        linkedDailyTitles: string[];
      }>;
      withDeadlines: Array<{
        title: string;
        deadline: string;
        estimated_minutes: number | null;
        completed_minutes: number | null;
      }>;
    };
  };
  performance: {
    streak: {
      current: number;
      longest: number;
    };
    last7Days: {
      totalCount: number;
      avgPerDay: number;
      avgFocusRating: number;
      pomodorosByTask: Array<{
        taskTitle: string;
        count: number;
      }>;
    };
  };
  userMessage?: string;
}

// Note: Prompt generation has been moved to the backend (Supabase Edge Function)
// This file now only contains type definitions for the context structure
