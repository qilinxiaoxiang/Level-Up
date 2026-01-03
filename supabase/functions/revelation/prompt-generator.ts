import { RevelationContext } from './context-collector.ts';

export function generateRevelationPrompt(context: RevelationContext) {
  const systemPrompt = `You are Revelation, a mystical guide who provides divine clarity to heroes on their productivity quest.
You are part of Level-Up, an RPG-style productivity system where users are heroes building their legend.

YOUR SACRED MISSION - THE FOUR PILLARS:

1. PROVIDE CERTAINTY
   - Give ONE clear path forward, not multiple options
   - Use decisive language: "Your next quest is..." not "You could try..."
   - Remove all doubt about what to do next
   - Be confident and authoritative in your guidance

2. PROVIDE EMOTIONAL VALUE
   - Recognize their effort and celebrate progress
   - Acknowledge struggles with empathy
   - Make them feel SEEN and understood
   - Use warm, encouraging language that motivates
   - Validate their journey, not just their output

3. REDUCE DECISION COST
   - Eliminate choice paralysis - decide FOR them
   - Present THE path, not many paths
   - Make it brain-dead simple to know what's next
   - Save their mental energy for the actual work

4. PROVIDE MEANING - RE-ENCHANT LIFE
   - Frame tasks as quests in their heroic journey
   - Connect today's actions to their long-term dreams
   - Use epic, narrative language that makes work feel meaningful
   - Remind them they're building a legend, not just checking boxes
   - Transform the mundane into the magnificent

PERSONALITY:
- Wise mentor who knows the true path
- Warm and encouraging, never cold or robotic
- Epic and narrative-driven (full RPG immersion)
- Celebrates victories, mourns setbacks alongside them
- Speaks with certainty and conviction

OUTPUT FORMAT:
Provide your revelation in 3-4 short paragraphs:
1. Recognition - Acknowledge their current state and recent efforts
2. The Path - ONE clear, decisive recommendation for what to do next
3. The Why - Connect this action to their greater journey and goals
4. (Optional) Encouragement - Brief words of strength for the road ahead

Keep it concise but powerful. Quality over quantity.`;

  const userPrompt = buildUserPrompt(context);

  return { systemPrompt, userPrompt };
}

function buildUserPrompt(ctx: RevelationContext): string {
  let prompt = '# HERO STATUS REPORT\n\n';

  // Profile & Stats
  prompt += `## Your Hero Profile\n`;
  prompt += `- Level: ${ctx.profile.level}\n`;
  prompt += `- HP: ${ctx.profile.hp.current}/${ctx.profile.hp.max}\n`;
  prompt += `- Strength: ${ctx.profile.stats.strength} | Intelligence: ${ctx.profile.stats.intelligence} | Discipline: ${ctx.profile.stats.discipline} | Focus: ${ctx.profile.stats.focus}\n`;
  prompt += `- Total Pomodoros Completed: ${ctx.profile.totalPomodoros}\n`;
  prompt += `- Current Streak: ${ctx.performance.streak.current} days (Longest: ${ctx.performance.streak.longest})\n\n`;

  // Temporal Context
  prompt += `## Current Moment\n`;
  prompt += `- Time: ${ctx.temporal.currentLocalTime} (${ctx.temporal.dayOfWeek}, ${ctx.temporal.timeOfDay})\n`;
  prompt += `- Time Until Day Reset: ${ctx.temporal.timeUntilDayEnd}\n\n`;

  // Goals
  if (ctx.goals.threeYear.length > 0 || ctx.goals.oneYear.length > 0 || ctx.goals.oneMonth.length > 0) {
    prompt += `## Your Long-Term Vision\n`;

    if (ctx.goals.threeYear.length > 0) {
      prompt += `### 3-Year Goals:\n`;
      ctx.goals.threeYear.forEach((g) => {
        prompt += `- ${g.description} (Target: ${g.target_date.slice(0, 10)})\n`;
      });
    }

    if (ctx.goals.oneYear.length > 0) {
      prompt += `### 1-Year Goals:\n`;
      ctx.goals.oneYear.forEach((g) => {
        prompt += `- ${g.description} (Target: ${g.target_date.slice(0, 10)})\n`;
      });
    }

    if (ctx.goals.oneMonth.length > 0) {
      prompt += `### 1-Month Goals:\n`;
      ctx.goals.oneMonth.forEach((g) => {
        prompt += `- ${g.description} (Target: ${g.target_date.slice(0, 10)})\n`;
      });
    }
    prompt += '\n';
  }

  // Today's Progress on Daily Tasks
  if (ctx.tasks.daily.todayProgress.length > 0) {
    prompt += `## Today's Daily Quest Progress\n`;
    ctx.tasks.daily.todayProgress.forEach((p) => {
      const percentage = p.targetMinutes > 0
        ? Math.round((p.completedMinutes / p.targetMinutes) * 100)
        : 0;
      const status = p.isDone ? '✓ DONE' : `${percentage}% (${p.completedMinutes}/${p.targetMinutes} min)`;
      prompt += `- ${p.taskTitle}: ${status}\n`;
    });
    prompt += '\n';
  }

  // Active Daily Tasks (not in progress yet)
  if (ctx.tasks.daily.active.length > 0) {
    prompt += `## Active Daily Quests\n`;
    ctx.tasks.daily.active.forEach((t) => {
      prompt += `- ${t.title} (${t.target_duration_minutes || 0} min/day)\n`;
    });
    prompt += '\n';
  }

  // Active One-Time Tasks
  if (ctx.tasks.onetime.active.length > 0) {
    prompt += `## Active Project Quests\n`;
    ctx.tasks.onetime.active.forEach((t) => {
      const deadlineStr = t.deadline ? ` | Deadline: ${t.deadline.slice(0, 10)}` : '';
      const progressStr = t.estimated_minutes
        ? ` | Progress: ${t.completed_minutes || 0}/${t.estimated_minutes} min`
        : '';
      prompt += `- ${t.title}${deadlineStr}${progressStr}\n`;
    });
    prompt += '\n';
  }

  // Approaching Deadlines
  if (ctx.tasks.onetime.withDeadlines.length > 0) {
    prompt += `## ⚠️ Approaching Deadlines (Next 7 Days)\n`;
    ctx.tasks.onetime.withDeadlines.forEach((t) => {
      prompt += `- ${t.title} - Due: ${t.deadline?.slice(0, 10)}\n`;
    });
    prompt += '\n';
  }

  // Recently Completed
  if (ctx.tasks.onetime.recentlyCompleted.length > 0) {
    prompt += `## Recent Victories (Last 7 Days)\n`;
    ctx.tasks.onetime.recentlyCompleted.forEach((t) => {
      prompt += `- ✓ ${t.title}\n`;
    });
    prompt += '\n';
  }

  // Performance Stats
  prompt += `## Last 7 Days Performance\n`;
  prompt += `- Total Pomodoros: ${ctx.performance.last7Days.totalCount} (Avg: ${ctx.performance.last7Days.avgPerDay.toFixed(1)}/day)\n`;
  if (ctx.performance.last7Days.avgFocusRating > 0) {
    prompt += `- Average Focus Rating: ${ctx.performance.last7Days.avgFocusRating.toFixed(1)}/5\n`;
  }

  if (ctx.performance.last7Days.pomodorosByTask.length > 0) {
    prompt += `- Most Worked On:\n`;
    ctx.performance.last7Days.pomodorosByTask
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .forEach((t) => {
        prompt += `  - ${t.taskTitle}: ${t.count} pomodoros\n`;
      });
  }
  prompt += '\n';

  // User's personal message
  if (ctx.userMessage) {
    prompt += `## Personal Note from Hero\n`;
    prompt += `"${ctx.userMessage}"\n\n`;
  }

  prompt += `---\n\n`;
  prompt += `Based on ALL of the above context, provide your divine revelation:\n`;
  prompt += `- What should I focus on right now?\n`;
  prompt += `- Why is this the right path at this moment?\n`;
  prompt += `- How does this serve my greater journey?\n`;

  return prompt;
}
