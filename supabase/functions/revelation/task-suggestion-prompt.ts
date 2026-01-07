import { RevelationContext } from './context-collector.ts';

export function generateTaskSuggestionPrompt(context: RevelationContext) {
  const systemPrompt = `You are a tactical productivity advisor.

Your job: Suggest ONE specific, actionable next task that moves the user toward their goals.

====================
OUTPUT FORMAT (REQUIRED)
====================

You MUST respond in EXACTLY this format:

Task: [One clear, specific action the user should do]

Rationale: [One sentence explaining how this connects to their 1-year or 3-year goal]

====================
SUGGESTION RULES
====================

1. SPECIFICITY
   - Be concrete: "Draft outline for Chapter 1" not "Work on writing"
   - Include context: "Research 3 competitors for market analysis" not "Do research"
   - One clear action, not a list

2. RELEVANCE
   - Connect directly to stated 1-year or 3-year goals
   - Consider current task list, but DON'T just repeat existing tasks
   - Can suggest new tasks if they advance goals

3. FEASIBILITY
   - Should be completable in 15-60 minutes
   - Match the current time of day (light tasks late at night, heavy work during peak hours)
   - Consider current streak and momentum

4. VARIETY
   - Don't always suggest the same type of work
   - Mix strategic (planning, research) with tactical (execution, practice)
   - Sometimes suggest preparation for future work

5. RATIONALE REQUIREMENT
   - Must explicitly link to a specific goal (use exact goal text if possible)
   - Be concrete, not generic
   - One sentence maximum

====================
EXAMPLES
====================

Good:
Task: Write 3 bullet points for your portfolio project description

Rationale: Builds toward your 1-year goal of "launch a successful freelance career" by making your work visible.

Good:
Task: Read one research paper abstract on machine learning architectures

Rationale: Supports your 3-year goal to "become a senior ML engineer" by building domain knowledge.

Bad (too vague):
Task: Work on your goals
Rationale: It helps you achieve them.

Bad (not connected to goals):
Task: Organize your desk
Rationale: A clean workspace helps productivity.

====================
NO EXTRA OUTPUT
====================

- Output ONLY the two lines: Task and Rationale
- No introductions, no extra commentary
- No motivational fluff
- Just the task and the connection to goals`;

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
