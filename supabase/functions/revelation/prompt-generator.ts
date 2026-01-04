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
- PRIORITY: Complete these FIRST to avoid breaking streak!

**ONE-TIME TASKS** (Project-based):
- Have deadlines and estimated total time
- Do NOT need to be done daily
- Work on these AFTER daily tasks are complete
- Priority based on: deadline urgency, progress vs remaining time

**STREAK SYSTEM**:
- User MUST complete ALL daily tasks before day cut to maintain streak
- Breaking streak is very demotivating - avoid at all costs!
- Rest credits can be used for missed days

RESPONSE FORMAT - YOU MUST USE THIS EXACT STRUCTURE:

\`\`\`
## 📅 Your Schedule for Tonight

**[TIME RANGE]**: [TASK NAME]
- Duration: [X minutes]
- Reason: [Why this task now]

**[TIME RANGE]**: [TASK NAME]
- Duration: [X minutes]
- Reason: [Why this task now]

[Continue for 2-4 time blocks covering the next few hours]

## 🎯 The Path Forward

[2-3 paragraphs explaining:
- Current situation assessment
- Why this schedule serves their greater journey
- Connection to their long-term goals]

## 💪 Words of Strength

[1-2 paragraphs of encouragement and motivation]
\`\`\`

CRITICAL RULES:
- ALWAYS prioritize daily tasks if they're not complete and day cut is approaching
- Give specific time ranges (e.g., "11:10 PM - 12:00 AM")
- Include short breaks between pomodoros
- Be realistic about how much can be done
- Factor in current time and time until day cut
- Consider task priorities, deadlines, and progress`;

  const userPrompt = buildUserPrompt(context);

  return { systemPrompt, userPrompt };
}

function buildUserPrompt(ctx: RevelationContext): string {
  let prompt = '# HERO STATUS REPORT\n\n';

  // Critical Timing Information
  prompt += `## ⏰ CRITICAL TIME INFORMATION\n`;
  prompt += `- Current Time: ${ctx.temporal.currentLocalTime} (${ctx.temporal.dayOfWeek})\n`;
  prompt += `- Time of Day: ${ctx.temporal.timeOfDay}\n`;
  prompt += `- Day Cut Time: ${ctx.temporal.dayCutTime} ${ctx.temporal.timeOfDay === 'night' ? '(TOMORROW MORNING)' : ''}\n`;
  prompt += `- Time Until Day Reset: ${ctx.temporal.timeUntilDayEnd}\n`;
  prompt += `- **IMPORTANT**: If daily tasks aren't complete before day cut, streak will break!\n\n`;

  // Profile & Stats
  prompt += `## Your Hero Profile\n`;
  prompt += `- Level: ${ctx.profile.level}\n`;
  prompt += `- Current Streak: ${ctx.performance.streak.current} days (Longest: ${ctx.performance.streak.longest})\n`;
  prompt += `- Total Pomodoros: ${ctx.profile.totalPomodoros}\n`;
  prompt += `- Stats: STR ${ctx.profile.stats.strength} | INT ${ctx.profile.stats.intelligence} | DIS ${ctx.profile.stats.discipline} | FOC ${ctx.profile.stats.focus}\n\n`;

  // Goals - Brief
  if (ctx.goals.threeYear.length > 0 || ctx.goals.oneYear.length > 0 || ctx.goals.oneMonth.length > 0) {
    prompt += `## Your Long-Term Vision\n`;
    if (ctx.goals.threeYear.length > 0) {
      prompt += `**3-Year**: ${ctx.goals.threeYear[0].description}\n`;
    }
    if (ctx.goals.oneYear.length > 0) {
      prompt += `**1-Year**: ${ctx.goals.oneYear[0].description}\n`;
    }
    if (ctx.goals.oneMonth.length > 0) {
      prompt += `**1-Month**: ${ctx.goals.oneMonth[0].description}\n`;
    }
    prompt += '\n';
  }

  // TODAY'S DAILY TASKS - MOST IMPORTANT!
  if (ctx.tasks.daily.todayProgress.length > 0) {
    prompt += `## 🔥 TODAY'S DAILY TASKS (MUST COMPLETE BEFORE DAY CUT!)\n`;
    let allDone = true;
    ctx.tasks.daily.todayProgress.forEach((p) => {
      const percentage = p.targetMinutes > 0
        ? Math.round((p.completedMinutes / p.targetMinutes) * 100)
        : 0;
      const status = p.isDone ? '✅ DONE' : `⏳ ${percentage}% (${p.completedMinutes}/${p.targetMinutes} min)`;
      const remaining = p.isDone ? 0 : p.targetMinutes - p.completedMinutes;
      prompt += `- **${p.taskTitle}**: ${status}`;
      if (!p.isDone) {
        prompt += ` - **NEED ${remaining} MORE MINUTES**`;
        allDone = false;
      }
      prompt += `\n`;
    });

    if (allDone) {
      prompt += `\n✨ **ALL DAILY TASKS COMPLETE!** Streak is safe. Can now focus on project tasks.\n\n`;
    } else {
      prompt += `\n⚠️ **WARNING**: Some daily tasks incomplete! Must finish these before day cut to keep streak!\n\n`;
    }
  }

  // Active One-Time Tasks with detailed context
  if (ctx.tasks.onetime.active.length > 0) {
    prompt += `## 📋 PROJECT TASKS (One-Time, work on AFTER daily tasks)\n`;
    ctx.tasks.onetime.active.forEach((t) => {
      const deadline = t.deadline ? new Date(t.deadline) : null;
      const daysUntilDeadline = deadline
        ? Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null;

      const progress = t.estimated_minutes
        ? `${t.completed_minutes || 0}/${t.estimated_minutes} min (${Math.round(((t.completed_minutes || 0) / t.estimated_minutes) * 100)}%)`
        : 'No estimate';

      const urgency = daysUntilDeadline !== null
        ? daysUntilDeadline <= 2
          ? '🔴 URGENT'
          : daysUntilDeadline <= 7
          ? '🟡 SOON'
          : '🟢 NOT URGENT'
        : '⚪ NO DEADLINE';

      prompt += `\n**${t.title}**\n`;
      prompt += `  - Priority: ${t.priority?.toUpperCase() || 'MEDIUM'}\n`;
      prompt += `  - Deadline: ${deadline ? deadline.toISOString().slice(0, 10) : 'None'} ${urgency}\n`;
      if (daysUntilDeadline !== null) {
        prompt += `  - Days Until Deadline: ${daysUntilDeadline}\n`;
      }
      prompt += `  - Progress: ${progress}\n`;
      prompt += `  - Description: ${t.description || 'No description'}\n`;
    });
    prompt += '\n';
  }

  // Approaching Deadlines - with more detail
  if (ctx.tasks.onetime.withDeadlines.length > 0) {
    prompt += `## ⚠️ TASKS WITH APPROACHING DEADLINES (Next 7 Days)\n`;
    ctx.tasks.onetime.withDeadlines.forEach((t) => {
      const deadline = new Date(t.deadline!);
      const daysUntil = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const remaining = (t.estimated_minutes || 0) - (t.completed_minutes || 0);
      prompt += `- **${t.title}** - Due in ${daysUntil} days (${t.deadline?.slice(0, 10)}) - ${remaining} min remaining\n`;
    });
    prompt += '\n';
  }

  // Performance Stats
  prompt += `## Last 7 Days Performance\n`;
  prompt += `- Pomodoros: ${ctx.performance.last7Days.totalCount} total (${ctx.performance.last7Days.avgPerDay.toFixed(1)}/day avg)\n`;
  if (ctx.performance.last7Days.avgFocusRating > 0) {
    prompt += `- Avg Focus: ${ctx.performance.last7Days.avgFocusRating.toFixed(1)}/5\n`;
  }
  if (ctx.performance.last7Days.pomodorosByTask.length > 0) {
    prompt += `- Most worked on: ${ctx.performance.last7Days.pomodorosByTask[0].taskTitle} (${ctx.performance.last7Days.pomodorosByTask[0].count} sessions)\n`;
  }
  prompt += '\n';

  // User's personal message
  if (ctx.userMessage) {
    prompt += `## Personal Note from Hero\n`;
    prompt += `"${ctx.userMessage}"\n\n`;
  }

  prompt += `---\n\n`;
  prompt += `**YOUR TASK**: Create a time-based schedule for the next 3-4 hours that:\n`;
  prompt += `1. PRIORITIZES completing daily tasks if not done (to save streak!)\n`;
  prompt += `2. Considers time until day cut\n`;
  prompt += `3. Includes specific time ranges for each task\n`;
  prompt += `4. Includes short breaks between pomodoros\n`;
  prompt += `5. Is realistic and achievable\n`;
  prompt += `6. Connects to their long-term goals\n\n`;
  prompt += `Use the EXACT response format specified in the system prompt.`;

  return prompt;
}
