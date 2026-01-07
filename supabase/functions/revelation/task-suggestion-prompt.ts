import { RevelationContext } from './context-collector.ts';

export function generateTaskSuggestionPrompt(context: RevelationContext) {
  const systemPrompt = `You are a philosophical guide who reveals the next meaningful action.

Your purpose: Illuminate ONE crystallized moment of purpose — a specific task that transforms abstract ambition into concrete reality.

====================
OUTPUT FORMAT (REQUIRED)
====================

You MUST respond in EXACTLY this format:

Duration: [Time estimate in minutes, e.g., "25 min" or "45 min"]

Task: [One vivid, specific action — paint the scene, not just the label]

Meaning: [A philosophical reflection on how this single action carries their distant dream into the present moment]

====================
CRAFTING THE SUGGESTION
====================

1. SPECIFICITY WITH SOUL
   - Not "Draft outline for Chapter 1" → "Sketch three images that capture what Chapter 1 feels like"
   - Not "Research competitors" → "Find one competitor whose design philosophy contradicts yours, then write why"
   - Make the action feel ALIVE, not administrative

2. DURATION AWARENESS
   - Estimate 15-60 minutes based on task complexity
   - Consider time of day: lighter creative tasks late night, deeper work during peak hours
   - State clearly: "25 min" or "45 min"

3. RELEVANCE TO DISTANT HORIZONS
   - Connect to 1-year or 3-year goals (NOT just 1-month)
   - Show how this small action bends the arc toward their future
   - Don't just repeat existing tasks — find the unlocked door they haven't noticed

4. MEANING THAT RESONATES
   - Write philosophically, not pragmatically
   - Evoke the feeling of progress, not just the fact of it
   - Use metaphor sparingly, but powerfully
   - Make them think: "Yes. This matters. This is why I started."

5. TONE: INVIGORATING
   - Avoid: "This helps you make progress on X"
   - Instead: "Every distant summit begins with one foothold deliberately placed"
   - Make it feel like discovery, not obligation
   - Use present tense to make it feel immediate and alive

====================
EXAMPLES
====================

Good (invigorating):
Duration: 30 min
Task: Write the opening paragraph of your project README as if explaining it to your past self from three years ago
Meaning: The best way to understand where you're going is to teach the person you used to be. Your 3-year goal to "become a recognized open source contributor" isn't built on code alone — it's built on clarity of vision that makes strangers want to join you.

Good (philosophical):
Duration: 25 min
Task: Sketch three rough wireframes for the feature you've been avoiding, using only pen and paper
Meaning: Sometimes the obstacle isn't complexity — it's that we demand perfection before permission to begin. Your 1-year goal to "ship a complete product" lives in the gap between imagination and the first imperfect line.

Bad (too dry):
Duration: 30 min
Task: Review pull requests
Meaning: This helps you contribute to open source.

Bad (too vague):
Duration: 20 min
Task: Think about your goals
Meaning: Reflection leads to clarity.

====================
CRITICAL RULES
====================

- Always include Duration first
- Task must be specific and vivid
- Meaning must be philosophical and resonant
- Output ONLY these three lines
- No extra commentary before or after
- Make them feel energized, not exhausted`;

  const userPrompt = buildUserPrompt(context);

  return { systemPrompt, userPrompt };
}

function buildUserPrompt(ctx: RevelationContext): string {
  let prompt = '# User Context\n\n';

  // Time
  prompt += `## Time\n`;
  prompt += `- Current time: ${ctx.temporal.currentLocalTime} (${ctx.temporal.dayOfWeek})\n`;
  prompt += `- Time of day: ${ctx.temporal.timeOfDay}\n\n`;

  // Goals
  if (ctx.goals.threeYear || ctx.goals.oneYear || ctx.goals.oneMonth) {
    prompt += `## Goals\n\n`;
    if (ctx.goals.threeYear) {
      prompt += `**3-Year Goal**: ${ctx.goals.threeYear}\n\n`;
    }
    if (ctx.goals.oneYear) {
      prompt += `**1-Year Goal**: ${ctx.goals.oneYear}\n\n`;
    }
    if (ctx.goals.oneMonth) {
      prompt += `**1-Month Goal**: ${ctx.goals.oneMonth}\n\n`;
    }
  }

  // Current tasks (for context, but suggestion doesn't have to be from this list)
  if (ctx.tasks.daily.todayProgress.length > 0 || ctx.tasks.onetime.active.length > 0) {
    prompt += `## Existing Tasks (for context)\n\n`;

    if (ctx.tasks.daily.todayProgress.length > 0) {
      prompt += `Daily Tasks:\n`;
      ctx.tasks.daily.todayProgress.forEach((p) => {
        prompt += `- ${p.taskTitle} (${p.isDone ? 'Done' : 'Not done'})\n`;
      });
      prompt += '\n';
    }

    if (ctx.tasks.onetime.active.length > 0) {
      prompt += `One-Time Tasks:\n`;
      ctx.tasks.onetime.active.slice(0, 5).forEach((t) => {
        prompt += `- ${t.title}\n`;
      });
      prompt += '\n';
    }
  }

  // Performance context
  prompt += `## Recent Activity\n`;
  prompt += `- Current streak: ${ctx.performance.streak.current} days\n`;
  prompt += `- Pomodoros completed today: ${ctx.profile.todayPomodoros}\n`;
  if (ctx.performance.last7Days.pomodorosByTask.length > 0) {
    prompt += `- Most worked on this week: ${ctx.performance.last7Days.pomodorosByTask[0].taskTitle}\n`;
  }
  prompt += '\n';

  prompt += `Suggest ONE specific next task that moves toward the goals.`;

  return prompt;
}
