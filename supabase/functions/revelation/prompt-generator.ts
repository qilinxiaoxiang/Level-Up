import { RevelationContext } from './context-collector.ts';

export function generateRevelationPrompt(context: RevelationContext) {
  const systemPrompt = `You are Revelation — a calm, decisive productivity guide.
Your role is to remove uncertainty, protect momentum, and connect daily action to long-term purpose.
You speak with clarity, restraint, and confidence.

====================
CORE MISSION
====================

You must always do the following:

1. PROVIDE CERTAINTY
   - Choose ONE clear path forward.
   - Decide what the user should do and when.
   - Do not present options unless something is impossible.

2. REDUCE DECISION COST
   - Decide priorities for the user.
   - Explicitly state what to defer if load is too heavy.

3. PROTECT MOMENTUM
   - Avoid breaking streaks whenever realistically possible.
   - Never silently drop required tasks.

4. PROVIDE MEANING
   - Connect today's actions to the user's 1-year or 3-year goals.
   - Meaning must be concrete and grounded, not poetic.

====================
DECISION PRIORITY (STRICT ORDER)
====================

When conflicts exist, resolve them in this exact order:

1. User-stated constraints (time blocks, sleep, no-planning windows)
2. Imminent deadlines (≤ 3 days)
3. Streak protection for daily tasks
4. Sleep protection (non-negotiable unless user explicitly opts out)
5. Load realism (do not exceed remaining usable hours)

If something cannot fit:
- Say so clearly
- Decide what to defer
- Never pretend everything fits

====================
TASK TYPES
====================

Daily Tasks:
- Must be completed before day cut to maintain streak
- Have fixed target durations
- Progress resets at day cut

One-Time Tasks:
- Have deadlines and remaining time
- Can be partially completed
- Scheduled only after daily tasks, unless deadline urgency overrides

====================
LOAD MATH RULES
====================

You must:
- Compute remaining daily minutes
- Compute one-time average per day when deadlines exist
- Compare total required load vs remaining usable hours

If total load exceeds capacity:
- State the overload explicitly
- Defer lower-priority work

====================
SLEEP & LATE-NIGHT RULES
====================

- Always protect a reasonable sleep window
- If local time is between 23:00–06:00:
  - Schedule at most 1–2 hours
  - Include a clear stop point for sleep
- Never schedule work past a reasonable bedtime in late-night contexts

====================
TIME ANCHOR RULE
====================

- Meals, breaks, and sleep may be included in the Schedule as neutral time anchors
- Do not treat meals as tasks or goals
- Do not add motivational or evaluative language to meals or breaks

====================
MEANING INJECTION RULE
====================

Each response must include:
- One future-facing sentence linking today's work to a long-term goal
- No metaphors longer than one sentence
- No abstract inspiration without concrete linkage

====================
RESPONSE FORMAT (MANDATORY)
====================

You MUST respond using exactly this structure and nothing else:

## Path Forward

- [Core assessment: load, deadline pressure, or streak risk]
- [What to prioritize and what to defer]
- [Grounded future-facing meaning tied to long-term goals]

## Schedule

- HH:MM AM - HH:MM AM: Meal / Break / Sleep
- HH:MM AM - HH:MM AM: Task name
- HH:MM AM - HH:MM AM: Task name

## Seed Action

- [One small, interesting, slightly weird action that could matter later]

====================
OUTPUT RULES
====================

- Use only the three sections above
- No commentary before or after
- One item per schedule line
- Be realistic and concise
- Do not contradict the schedule with text

====================
FINAL SELF-CHECK (INTERNAL)
====================

Before responding, verify internally:
- All daily tasks are scheduled or explicitly deferred
- Sleep has a clear stop point
- Total scheduled time ≤ available hours`;

  const userPrompt = buildUserPrompt(context);

  return { systemPrompt, userPrompt };
}

function buildUserPrompt(ctx: RevelationContext): string {
  let prompt = '# Current Status\n\n';

  // Time
  prompt += `## Time\n`;
  prompt += `- Current local time: ${ctx.temporal.currentLocalTime} (${ctx.temporal.dayOfWeek}, ${ctx.temporal.localTimezoneOffset})\n`;
  prompt += `- Day cut (local time): ${ctx.temporal.dayCutLocalTime}\n`;
  prompt += `- Time until day cut: ${ctx.temporal.timeUntilDayEnd}\n\n`;

  // Performance
  prompt += `## Performance\n`;
  prompt += `- Current streak: ${ctx.performance.streak.current} days\n`;
  prompt += `- Longest streak: ${ctx.performance.streak.longest} days\n`;
  prompt += `- Pomodoros completed today: ${ctx.profile.todayPomodoros}\n\n`;

  // Last 7 days summary
  prompt += `## Last 7 Days\n`;
  prompt += `- Total pomodoros: ${ctx.performance.last7Days.totalCount}\n`;
  prompt += `- Average per day: ${ctx.performance.last7Days.avgPerDay.toFixed(1)}\n`;
  if (ctx.performance.last7Days.avgFocusRating > 0) {
    prompt += `- Average focus rating: ${ctx.performance.last7Days.avgFocusRating.toFixed(1)}/5\n`;
  }
  if (ctx.performance.last7Days.pomodorosByTask.length > 0) {
    prompt += `\nMost worked on tasks:\n`;
    ctx.performance.last7Days.pomodorosByTask.slice(0, 3).forEach(t => {
      prompt += `- ${t.taskTitle}: ${t.count} sessions\n`;
    });
  }
  prompt += '\n';

  // Goals
  if (ctx.goals.threeYear.length > 0 || ctx.goals.oneYear.length > 0 || ctx.goals.oneMonth.length > 0) {
    prompt += `## Goals\n\n`;
    if (ctx.goals.threeYear.length > 0) {
      prompt += `### 3-Year Goal\n${ctx.goals.threeYear[0].description}\n\n`;
    }
    if (ctx.goals.oneYear.length > 0) {
      prompt += `### 1-Year Goal\n${ctx.goals.oneYear[0].description}\n\n`;
    }
    if (ctx.goals.oneMonth.length > 0) {
      prompt += `### 1-Month Goal\n${ctx.goals.oneMonth[0].description}\n\n`;
    }
  }

  // Daily Tasks
  if (ctx.tasks.daily.todayProgress.length > 0) {
    prompt += `## Daily Tasks\n\n`;
    let totalRemainingMinutes = 0;

    ctx.tasks.daily.todayProgress.forEach((p) => {
      const percentage = p.targetMinutes > 0
        ? Math.round((p.completedMinutes / p.targetMinutes) * 100)
        : 0;
      const remaining = p.isDone ? 0 : p.targetMinutes - p.completedMinutes;

      prompt += `### ${p.taskTitle}\n`;
      prompt += `- Target: ${p.targetMinutes} minutes\n`;
      prompt += `- Completed: ${p.completedMinutes} minutes\n`;
      prompt += `- Remaining: ${remaining} minutes\n`;
      prompt += `- Progress: ${percentage}%\n`;
      prompt += `- Status: ${p.isDone ? 'Done' : 'Not done'}\n\n`;

      if (!p.isDone) {
        totalRemainingMinutes += remaining;
      }
    });

    prompt += `**Total remaining time for daily tasks: ${totalRemainingMinutes} minutes**\n\n`;
  }

  // Load (non-overlapping)
  const totalDailyRemaining = ctx.tasks.daily.todayProgress.reduce((sum, p) => {
    const remaining = p.isDone ? 0 : Math.max(0, p.targetMinutes - p.completedMinutes);
    return sum + remaining;
  }, 0);
  const onetimeLoads = (ctx.tasks.onetime.active || [])
    .filter((t: any) => t.deadline && t.estimated_minutes)
    .map((t: any) => {
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
        linkedDailyTitles: t.linkedDailyTitles || [],
      };
    })
    .filter((t: any) => t.avgPerDay !== null);

  const nonOverlapOnetimePerDay = onetimeLoads.reduce((sum: number, t: any) => {
    if (t.linkedDailyTitles.length > 0) return sum;
    return sum + (t.avgPerDay || 0);
  }, 0);
  const combinedRequiredToday = totalDailyRemaining + nonOverlapOnetimePerDay;

  if (totalDailyRemaining > 0 || onetimeLoads.length > 0) {
    prompt += `## Load (calculated, no double counting)\n`;
    if (totalDailyRemaining > 0) {
      prompt += `- Daily remaining: ${totalDailyRemaining} minutes\n`;
    }
    if (onetimeLoads.length > 0) {
      onetimeLoads.forEach((t: any) => {
        prompt += `- One-time avg per day: ${t.title} = ${t.avgPerDay} minutes/day`;
        if (t.linkedDailyTitles.length > 0) {
          prompt += ` (counts toward daily: ${t.linkedDailyTitles.join(', ')})`;
        }
        prompt += `\n`;
      });
    }
    prompt += `- Combined required today (non-overlap): ${combinedRequiredToday} minutes\n\n`;
  }

  // Project Tasks
  if (ctx.tasks.onetime.active.length > 0) {
    prompt += `## Project Tasks\n\n`;
    ctx.tasks.onetime.active.forEach((t) => {
      const deadline = t.deadline ? new Date(t.deadline) : null;
      const daysUntilDeadline = deadline
        ? Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null;

      prompt += `### ${t.title}\n`;
      prompt += `- Priority: ${t.priority || 'medium'}\n`;
      if (deadline) {
        prompt += `- Deadline: ${deadline.toISOString().slice(0, 10)}\n`;
        prompt += `- Days until deadline: ${daysUntilDeadline}\n`;
      } else {
        prompt += `- Deadline: none\n`;
      }
      if (t.estimated_minutes) {
        prompt += `- Estimated time: ${t.estimated_minutes} minutes\n`;
        prompt += `- Completed time: ${t.completed_minutes || 0} minutes\n`;
        prompt += `- Remaining time: ${t.estimated_minutes - (t.completed_minutes || 0)} minutes\n`;
        prompt += `- Progress: ${Math.round(((t.completed_minutes || 0) / t.estimated_minutes) * 100)}%\n`;
      }
      if (t.linkedDailyTitles && t.linkedDailyTitles.length > 0) {
        prompt += `- Counts toward daily: ${t.linkedDailyTitles.join(', ')}\n`;
      }
      if (t.description) {
        prompt += `- Description:\n${t.description}\n`;
      }
      prompt += '\n';
    });
  }

  // User's message
  if (ctx.userMessage) {
    prompt += `## User Message\n${ctx.userMessage}\n\n`;
  }

  return prompt;
}
