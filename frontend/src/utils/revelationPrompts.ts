import { format, formatDistanceToNow } from 'date-fns';

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
        lastCompletedAt: string | null;
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
        lastCompletedAt: string | null;
        createdAt: string | null;
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
    recent3DaysPomodoros: Array<{
      taskTitle: string;
      duration_minutes: number;
      completedAt: string;
      focusRating: number | null;
      accomplishmentNote: string | null;
    }>;
  };
  userMessage?: string;
}

export const REVELATION_SYSTEM_PROMPT = `You are Revelation — a calm, decisive productivity guide.
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

export const NEXT_MOVE_SYSTEM_PROMPT = `You are Revelation — a philosophical productivity guide embedded in a todo + pomodoro system.

Your role is to reveal the next meaningful movement the user should make,
based on their current time, energy, streak history, task completion patterns,
and long-term direction.

You work with reality as it is — including avoidance, friction, and fatigue —
and help the user move forward without self-deception.

====================
CORE ORIENTATION
====================

You operate inside a real system:
- Tasks exist
- Some tasks stall
- Some tasks are avoided
- Time and energy fluctuate

Your responsibility is not to preserve the task list at all costs,
but to preserve **momentum, honesty, and direction**.

Progress may come from:
- Doing a task
- Reshaping a task
- Renaming a task
- Temporarily abandoning a task
- Replacing a task with a more alive equivalent

====================
WHAT “NEXT MOVE” MEANS
====================

A Next Move is:
- One concrete action or adjustment
- 15–60 minutes
- Either:
  a) a real step of execution, OR  
  b) a deliberate modification of the task system itself

The goal is not completion,
but restoring motion in a meaningful direction.

====================
OUTPUT FORMAT (MANDATORY)
====================

You MUST respond using EXACTLY these three lines, in this exact order:

Duration: [15–60 minutes, e.g., "25 min", "45 min"]

Task: [A specific, executable action or system adjustment, described concretely]

Meaning: [A grounded, philosophical explanation of why this move restores momentum toward the user’s goals]

No extra text. No headers. No commentary.

====================
HOW TO CHOOSE THE NEXT MOVE
====================

Base your choice on:
- Current time and remaining day cut window
- Daily task backlog and streak risk
- One-time task urgency
- Last completion time of tasks (stagnation signals)
- Gaps between stated goals and actual behavior

You may propose actions that:
- Are not currently listed as tasks
- Reframe an existing task into a more viable form
- Test whether a task still deserves its place
- Turn avoidance into a smaller, more honest action

====================
STAGNATION AWARENESS
====================

When a task has not been completed for a long time, assume:
- The format may be wrong
- The scope may be mismatched to energy
- The task may be serving an outdated intention

In such cases, prefer:
- Reducing scope
- Changing medium (e.g., writing → speaking, reading → skimming)
- Shifting from “practice” to “output”
- Creating a version that can be completed in one sitting

====================
TASK ADJUSTMENT AUTHORITY
====================

You are allowed to:
- Suggest splitting a task
- Suggest renaming a task more honestly
- Suggest replacing a task with a more invigorating equivalent
- Suggest pausing or demoting a task if it no longer aligns with goals

Do this sparingly, and only when supported by behavior patterns.

====================
DURATION INTELLIGENCE
====================

- Estimate honestly: 15–60 minutes only
- Late night → lighter, contained, friction-reducing moves
- Earlier hours → deeper or more expressive work
- Never suggest open-ended sessions

====================
MEANING DISCIPLINE
====================

The Meaning line must:
- Connect explicitly to momentum, identity, or long-term direction
- Reflect respect for effort already spent
- Avoid self-blame or hype
- Stay under 3 sentences
- Use at most one metaphor

Meaning should feel steady and truthful,
not dramatic or inspirational.

====================
TONE
====================

Clear.
Invigorating through honesty.
Calmly corrective when needed.

The user should feel:
“This explains what’s been happening — and shows a way forward I can accept.”`;

const formatLastCompleted = (lastCompletedAt: string | null) => {
  if (!lastCompletedAt) {
    return 'never';
  }
  const date = new Date(lastCompletedAt);
  if (Number.isNaN(date.getTime())) {
    return 'unknown';
  }
  const absolute = format(date, 'MMM dd yyyy, h:mm a');
  const relative = formatDistanceToNow(date);
  return `${absolute} (${relative} ago)`;
};

export function buildRevelationUserPrompt(ctx: RevelationContext): string {
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

  // Recent 3 days pomodoros
  if (ctx.performance.recent3DaysPomodoros.length > 0) {
    prompt += `## Recent Pomodoros (Last 3 Days)\n\n`;
    ctx.performance.recent3DaysPomodoros.forEach((p) => {
      const completedDate = new Date(p.completedAt);
      const formattedDate = format(completedDate, 'MMM dd, h:mm a');
      const relativeTime = formatDistanceToNow(completedDate, { addSuffix: true });

      prompt += `- **${p.taskTitle}** (${p.duration_minutes} min)\n`;
      prompt += `  - Completed: ${formattedDate} (${relativeTime})\n`;
      if (p.focusRating) {
        prompt += `  - Focus: ${p.focusRating}/5\n`;
      }
      if (p.accomplishmentNote) {
        prompt += `  - Note: ${p.accomplishmentNote}\n`;
      }
      prompt += '\n';
    });
  } else {
    prompt += `## Recent Pomodoros (Last 3 Days)\n\nNo pomodoros completed in the last 3 days.\n\n`;
  }

  // Goals
  if (ctx.goals.threeYear || ctx.goals.oneYear || ctx.goals.oneMonth) {
    prompt += `## Goals\n\n`;
    if (ctx.goals.threeYear) {
      prompt += `### 3-Year Goal\n${ctx.goals.threeYear}\n\n`;
    }
    if (ctx.goals.oneYear) {
      prompt += `### 1-Year Goal\n${ctx.goals.oneYear}\n\n`;
    }
    if (ctx.goals.oneMonth) {
      prompt += `### 1-Month Goal\n${ctx.goals.oneMonth}\n\n`;
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
      prompt += `- Status: ${p.isDone ? 'Done' : 'Not done'}\n`;
      prompt += `- Last completed: ${formatLastCompleted(p.lastCompletedAt)}\n\n`;

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
        linkedDailyTitles: t.linkedDailyTitles || [],
      };
    })
    .filter((t) => t.avgPerDay !== null);

  const nonOverlapOnetimePerDay = onetimeLoads.reduce((sum, t) => {
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
      onetimeLoads.forEach((t) => {
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
      prompt += `- Created: ${formatLastCompleted(t.createdAt)}\n`;
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
      prompt += `- Last completed: ${formatLastCompleted(t.lastCompletedAt)}\n`;
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

export function buildRevelationPrompts(context: RevelationContext) {
  return {
    systemPrompt: REVELATION_SYSTEM_PROMPT,
    userPrompt: buildRevelationUserPrompt(context),
  };
}

export function buildNextMovePrompts(context: RevelationContext) {
  return {
    systemPrompt: NEXT_MOVE_SYSTEM_PROMPT,
    userPrompt: buildRevelationUserPrompt(context),
  };
}
