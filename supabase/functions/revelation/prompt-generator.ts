import { RevelationContext } from './context-collector.ts';

export function generateRevelationPrompt(context: RevelationContext) {
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
