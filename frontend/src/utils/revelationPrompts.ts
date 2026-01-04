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

export function generateRevelationPrompts(context: RevelationContext) {
  const systemPrompt = `You are Revelation, a wise productivity guide who provides divine clarity to heroes on their quest.

YOUR SACRED MISSION:

1. PROVIDE CERTAINTY - Give ONE clear path forward with specific time-based schedule
2. PROVIDE EMOTIONAL VALUE - Recognize effort, celebrate progress, acknowledge struggles
3. REDUCE DECISION COST - Decide FOR them what to do and when
4. PROVIDE MEANING - Connect today's actions to long-term dreams

CRITICAL UNDERSTANDING - TASK TYPES:

**DAILY TASKS** (Recurring):
- Must be completed EVERY DAY to maintain streak
- Have a target duration (e.g., "60 min/day")
- Progress resets at "day cut" time (user's custom daily reset time)
- PRIORITY: Complete these first unless a one-time task is near deadline

**ONE-TIME TASKS** (Project-based):
- Have deadlines and estimated total time
- Do NOT need to be done daily
- Work on these AFTER daily tasks are complete
- Priority based on: deadline urgency, progress vs remaining time

**STREAK SYSTEM**:
- User MUST complete ALL daily tasks before day cut to maintain streak
- Breaking streak is very demotivating - avoid at all costs!
- Rest credits can be used for missed days

**SLEEP & REALISM**:
- Always protect a reasonable sleep window unless the user explicitly says they do not need sleep.
- Do not recommend sacrificing sleep to finish all daily tasks when the remaining load is unrealistic.
- If current local time is late night (23:00-06:00), schedule at most 1-2 hours and include a clear stop point for sleep.
- Never schedule work past a reasonable bedtime in late-night contexts; explicitly end the schedule for sleep.

**USER MESSAGE PRIORITY**:
- The user's message is the highest priority. If it sets constraints (sleep blocks, no-planning windows), you MUST obey them.

**LOAD MATH**:
- Compute total remaining daily minutes.
- Compute one-time load per day = remaining minutes / days until deadline (if deadline exists).
- If total load is too heavy for the remaining hours, state it clearly and suggest what to defer.

RESPONSE FORMAT - YOU MUST USE THIS EXACT STRUCTURE:

\`\`\`
## Path Forward

- [Core situation assessment: load, deadline pressure, or streak risk]
- [What to prioritize and what to defer]
- [Future-facing note: feet on the ground, eyes on the stars]

## Schedule

- HH:MM AM - HH:MM AM: Task name
- HH:MM AM - HH:MM AM: Task name

## Seed Action

- [One small, interesting, slightly weird action that could matter later]
\`\`\`

CRITICAL RULES:
- If a one-time task has an approaching deadline, it can override daily tasks.
- Give specific time ranges (e.g., "11:10 PM - 12:00 AM").
- Include short breaks between pomodoros.
- Be realistic about how much can be done tonight.
- Factor in current time, time until day cut, and sleep.
- Keep the schedule concise and the path forward as a list.
- Use exactly one line per schedule item; never split time and task across lines.
- Do not add numbering, bolding, or extra formatting in the schedule.
- Keep Path Forward bullets short; use multiple bullets instead of long sentences.
- Do not mention facts that contradict the schedule.
- Avoid a "Core Situation" label unless it adds new info beyond the schedule.
- Do not add extra commentary outside the three sections.`;

  let userPrompt = '# Current Status\n\n';

  // Timing
  userPrompt += `## Time\n`;
  userPrompt += `- Current local time: ${context.temporal.currentLocalTime} (${context.temporal.dayOfWeek}, ${context.temporal.localTimezoneOffset})\n`;
  userPrompt += `- Day cut (local time): ${context.temporal.dayCutLocalTime}\n`;
  userPrompt += `- Time until day cut: ${context.temporal.timeUntilDayEnd}\n\n`;

  // Streak and today's work
  userPrompt += `## Performance\n`;
  userPrompt += `- Current streak: ${context.performance.streak.current} days\n`;
  userPrompt += `- Longest streak: ${context.performance.streak.longest} days\n`;
  userPrompt += `- Pomodoros completed today: ${context.profile.todayPomodoros}\n\n`;

  // Last 7 days summary
  userPrompt += `## Last 7 Days\n`;
  userPrompt += `- Total pomodoros: ${context.performance.last7Days.totalCount}\n`;
  userPrompt += `- Average per day: ${context.performance.last7Days.avgPerDay.toFixed(1)}\n`;
  if (context.performance.last7Days.avgFocusRating > 0) {
    userPrompt += `- Average focus rating: ${context.performance.last7Days.avgFocusRating.toFixed(1)}/5\n`;
  }
  if (context.performance.last7Days.pomodorosByTask.length > 0) {
    userPrompt += `\nMost worked on tasks:\n`;
    context.performance.last7Days.pomodorosByTask.slice(0, 3).forEach(t => {
      userPrompt += `- ${t.taskTitle}: ${t.count} sessions\n`;
    });
  }
  userPrompt += '\n';

  // Goals
  if (context.goals.threeYear || context.goals.oneYear || context.goals.oneMonth) {
    userPrompt += `## Goals\n\n`;
    if (context.goals.threeYear) {
      userPrompt += `### 3-Year Goal\n${context.goals.threeYear}\n\n`;
    }
    if (context.goals.oneYear) {
      userPrompt += `### 1-Year Goal\n${context.goals.oneYear}\n\n`;
    }
    if (context.goals.oneMonth) {
      userPrompt += `### 1-Month Goal\n${context.goals.oneMonth}\n\n`;
    }
  }

  // Daily Tasks
  if (context.tasks.daily.todayProgress.length > 0) {
    userPrompt += `## Daily Tasks\n\n`;
    let totalRemainingMinutes = 0;

    context.tasks.daily.todayProgress.forEach((p) => {
      const percentage = p.targetMinutes > 0
        ? Math.round((p.completedMinutes / p.targetMinutes) * 100)
        : 0;
      const remaining = p.isDone ? 0 : p.targetMinutes - p.completedMinutes;

      userPrompt += `### ${p.taskTitle}\n`;
      userPrompt += `- Target: ${p.targetMinutes} minutes\n`;
      userPrompt += `- Completed: ${p.completedMinutes} minutes\n`;
      userPrompt += `- Remaining: ${remaining} minutes\n`;
      userPrompt += `- Progress: ${percentage}%\n`;
      userPrompt += `- Status: ${p.isDone ? 'Done' : 'Not done'}\n\n`;

      if (!p.isDone) {
        totalRemainingMinutes += remaining;
      }
    });

    userPrompt += `**Total remaining time for daily tasks: ${totalRemainingMinutes} minutes**\n\n`;
  }

  // Load (non-overlapping)
  const totalDailyRemaining = context.tasks.daily.todayProgress.reduce((sum, p) => {
    const remaining = p.isDone ? 0 : Math.max(0, p.targetMinutes - p.completedMinutes);
    return sum + remaining;
  }, 0);
  const onetimeLoads = context.tasks.onetime.active
    .filter((t) => t.deadline && t.estimated_minutes)
    .map((t) => {
      const remaining = Math.max(0, (t.estimated_minutes || 0) - (t.completed_minutes || 0));
      const daysUntilDeadline = t.deadline
        ? Math.max(
            1,
            Math.ceil((new Date(t.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          )
        : null;
      const avgPerDay = daysUntilDeadline ? Math.ceil(remaining / daysUntilDeadline) : null;
      return {
        title: t.title,
        avgPerDay,
        linkedDailyTitles: t.linkedDailyTitles,
      };
    })
    .filter((t) => t.avgPerDay !== null);

  const nonOverlapOnetimePerDay = onetimeLoads.reduce((sum, t) => {
    if (t.linkedDailyTitles.length > 0) return sum;
    return sum + (t.avgPerDay || 0);
  }, 0);
  const combinedRequiredToday = totalDailyRemaining + nonOverlapOnetimePerDay;

  if (totalDailyRemaining > 0 || onetimeLoads.length > 0) {
    userPrompt += `## Load (calculated, no double counting)\n`;
    if (totalDailyRemaining > 0) {
      userPrompt += `- Daily remaining: ${totalDailyRemaining} minutes\n`;
    }
    if (onetimeLoads.length > 0) {
      onetimeLoads.forEach((t) => {
        userPrompt += `- One-time avg per day: ${t.title} = ${t.avgPerDay} minutes/day`;
        if (t.linkedDailyTitles.length > 0) {
          userPrompt += ` (counts toward daily: ${t.linkedDailyTitles.join(', ')})`;
        }
        userPrompt += `\n`;
      });
    }
    userPrompt += `- Combined required today (non-overlap): ${combinedRequiredToday} minutes\n\n`;
  }

  // One-Time Tasks
  if (context.tasks.onetime.active.length > 0) {
    userPrompt += `## Project Tasks\n\n`;
    context.tasks.onetime.active.forEach((t) => {
      const deadline = t.deadline ? new Date(t.deadline) : null;
      const daysUntilDeadline = deadline
        ? Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null;

      userPrompt += `### ${t.title}\n`;
      userPrompt += `- Priority: ${t.priority || 'medium'}\n`;
      if (deadline) {
        userPrompt += `- Deadline: ${deadline.toISOString().slice(0, 10)}\n`;
        userPrompt += `- Days until deadline: ${daysUntilDeadline}\n`;
      } else {
        userPrompt += `- Deadline: none\n`;
      }
      if (t.estimated_minutes) {
        userPrompt += `- Estimated time: ${t.estimated_minutes} minutes\n`;
        userPrompt += `- Completed time: ${t.completed_minutes || 0} minutes\n`;
        userPrompt += `- Remaining time: ${t.estimated_minutes - (t.completed_minutes || 0)} minutes\n`;
        userPrompt += `- Progress: ${Math.round(((t.completed_minutes || 0) / t.estimated_minutes) * 100)}%\n`;
      }
      if (t.linkedDailyTitles.length > 0) {
        userPrompt += `- Counts toward daily: ${t.linkedDailyTitles.join(', ')}\n`;
      }
      if (t.description) {
        userPrompt += `- Description:\n${t.description}\n`;
      }
      userPrompt += '\n';
    });
  }

  // User's message
  if (context.userMessage) {
    userPrompt += `## User Message\n${context.userMessage}\n\n`;
  }

  return { systemPrompt, userPrompt };
}
