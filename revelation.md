# Revelation Feature - AI-Powered Daily Planning

## Overview

**Revelation** is an AI-powered feature that transforms productivity from a burden into a meaningful quest. It analyzes your goals, tasks, recent performance, and current context to provide clear, confident direction for your journey.

## Core Philosophy: The Four Pillars of Revelation

Revelation is designed around four fundamental principles that transform how users experience their productivity:

### 1. **Provide Certainty**
- **No ambiguity**: Clear, confident recommendations instead of vague suggestions
- **Decisive guidance**: "Your next quest is..." not "You could consider..."
- **Removes doubt**: Users know exactly what to do next
- **Builds confidence**: Certainty breeds momentum and action

### 2. **Provide Emotional Value**
- **Recognizes effort**: Celebrates progress, acknowledges struggles
- **Personal connection**: Speaks to the user's unique journey
- **Encouragement**: Warm, supportive tone that motivates
- **Validation**: Makes users feel seen and understood

### 3. **Reduce Decision Cost**
- **Eliminates choice paralysis**: One clear path, not ten options
- **Cognitive relief**: The mental load of "what should I do?" is lifted
- **Pre-made decisions**: Revelation decides, user executes
- **Energy conservation**: Mental energy saved for actual work

### 4. **Provide Sense of Meaning - Re-enchant Life**
- **Narrative framing**: Tasks become quests, work becomes adventure
- **Purpose connection**: Links daily actions to long-term dreams
- **Epic perspective**: Makes mundane feel meaningful
- **Story of growth**: User is the hero of their own legend

## Feature Name Rationale

- **Name**: "Revelation" (chosen because "Oracle" is taken)
- **Concept**: A moment of divine clarity that reveals your destined path
- **Tone**: Mystical guide, wise mentor, strategic ally
- **Promise**: "You shall know what you must do"

## Core Functionality

### 1. Input Data Collection

The LLM will receive a comprehensive snapshot of the user's productivity landscape:

#### A. Goals Context
```typescript
{
  threeYearGoals: Goal[],    // Long-term vision (3 years)
  oneYearGoals: Goal[],      // Mid-term objectives (1 year)
  oneMonthGoals: Goal[]      // Short-term targets (1 month)
}
```

#### B. Tasks Context
```typescript
{
  dailyTasks: {
    active: Task[],          // Currently active daily tasks
    paused: Task[],          // Paused daily tasks
    todayProgress: {         // Today's completion status per task
      taskId: string,
      targetMinutes: number,
      completedMinutes: number,
      isDone: boolean
    }[]
  },
  onetimeTasks: {
    active: Task[],          // Active one-time tasks
    paused: Task[],          // Paused one-time tasks
    withDeadlines: Task[],   // Tasks with approaching deadlines
    completed: Task[]        // Recently completed (last 7 days)
  }
}
```

#### C. Temporal Context
```typescript
{
  currentTime: string,       // ISO timestamp
  currentLocalTime: string,  // Human-readable local time
  dayCutTime: string,        // User's day reset time (e.g., "04:00")
  timeUntilDayEnd: string,   // Time remaining until day resets
  dayOfWeek: string,         // Monday, Tuesday, etc.
  timeOfDay: string          // "morning" | "afternoon" | "evening" | "night"
}
```

#### D. Recent Performance (Last 7 Days)
```typescript
{
  pomodorosCompleted: {
    byDay: { date: string, count: number, totalMinutes: number }[],
    byTask: { taskId: string, taskTitle: string, count: number }[],
    totalCount: number,
    avgPerDay: number,
    avgFocusRating: number   // If available
  },
  completionRate: {
    dailyTasksCompletionRate: number,  // % of days all daily tasks were done
    mostConsistent: Task[],            // Tasks consistently completed
    strugglingWith: Task[]             // Tasks often missed
  },
  streak: {
    current: number,
    longest: number
  }
}
```

#### E. User Profile Stats
```typescript
{
  level: number,
  stats: {
    strength: number,
    intelligence: number,
    discipline: number,
    focus: number
  },
  hp: {
    current: number,
    max: number
  },
  totalPomodoros: number
}
```

#### F. User Input (Optional, Conversational)
```typescript
{
  userMessage?: string       // Free-form text: mental state, preferences, constraints
                            // Examples:
                            // - "Feeling tired today, prefer lighter tasks"
                            // - "Have a meeting at 2pm, need to finish X before then"
                            // - "Want to focus on creative work this morning"
                            // - "Slept poorly, low energy"
}
```

### 2. LLM Prompt Design

#### System Prompt
```
You are Revelation, a mystical guide who provides divine clarity to heroes on their productivity quest.
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
Provide your response in the following JSON structure:
{
  "revelation": "A powerful, narrative-driven proclamation about their current state and destiny (2-4 sentences). Make it EPIC. Connect their recent actions to their greater purpose.",

  "thePath": {
    "nextQuest": {
      "type": "existing_task" | "new_task_suggestion",
      "taskId"?: "string (if existing task)",
      "title": "string (frame as a quest)",
      "epicReason": "string (WHY this matters to their legend, not just logic)",
      "estimatedMinutes"?: number,
      "category"?: "study" | "exercise" | "work" | "creative" | "admin"
    },
    "certainty": "string (1 sentence affirming THIS is THE right choice now)"
  },

  "witnessing": {
    "recentVictories": "string (celebrate specific wins from their data)",
    "struggles": "string (acknowledge challenges with empathy)",
    "growth": "string (how they've evolved, progress toward their dreams)"
  },

  "todaysPlan"?: {
    "narrative": "string (tell the story of today's adventure)",
    "morning": "string (quest description)",
    "afternoon": "string (quest description)",
    "evening": "string (quest description)"
  },

  "urgentWarnings"?: [
    "string (ONLY critical alerts about deadlines/risks, framed narratively)"
  ],

  "wisdomForTheJourney": "string (one piece of meaningful advice for sustainable growth)"
}

CRITICAL GUIDELINES:
1. ALWAYS give exactly ONE "nextQuest" - never multiple options
2. Use narrative, epic language throughout - they are a HERO, not a worker
3. Connect every recommendation to their long-term goals (meaning)
4. Celebrate their wins emotionally, not just logically
5. If they're struggling, show empathy before giving guidance
6. Frame daily tasks as part of their character development
7. Use phrases like "Your legend grows...", "The path reveals...", "Your quest calls..."
8. Make them feel that their work MATTERS in a cosmic sense
9. Never be wishy-washy - speak with absolute conviction
10. Transform "do your homework" into "Master the ancient texts to unlock your scholarly potential"
```

#### User Prompt Template
```
Hero, I seek your guidance. Show me the path forward on my quest.

MY GRAND VISION (The Legend I'm Building):
[3-Year Dreams]
{goals.threeYear.map(g => `- ${g.description} (destiny by: ${g.target_date})`)}

[1-Year Milestones]
{goals.oneYear.map(g => `- ${g.description} (milestone: ${g.target_date})`)}

[This Month's Objectives]
{goals.oneMonth.map(g => `- ${g.description} (target: ${g.target_date})`)}

MY CURRENT QUESTS:
[Daily Disciplines (Building Character)]
{dailyTasks.active.map(t => `
- ${t.title} (${t.category}, ${t.priority} priority)
  Daily commitment: ${t.target_duration_minutes} min
  Today's progress: ${todayProgress[t.id].completedMinutes}/${t.target_duration_minutes} min
  ${todayProgress[t.id].isDone ? '✓ COMPLETED TODAY' : '⚔️ IN PROGRESS'}
`)}

[One-Time Quests (Epic Challenges)]
{onetimeTasks.active.map(t => `
- ${t.title} (${t.category}, ${t.priority} priority)
  Deadline: ${t.deadline || 'no deadline set'}
  Progress: ${t.completed_minutes || 0}/${t.estimated_minutes || '?'} min completed
`)}

MY RECENT JOURNEY (Last 7 Days):
- Battles fought (Pomodoros): ${performance.pomodorosCompleted.totalCount}
- Average daily battles: ${performance.pomodorosCompleted.avgPerDay}
- Current streak: ${performance.streak.current} days 🔥
- Quest completion rate: ${performance.completionRate.dailyTasksCompletionRate}%

Disciplines I've mastered consistently:
{performance.completionRate.mostConsistent.map(t => `- ${t.title}`)}

Challenges I've struggled with:
{performance.completionRate.strugglingWith.map(t => `- ${t.title}`)}

THIS MOMENT:
- Current time: ${context.currentLocalTime} (${context.timeOfDay})
- Day of the week: ${context.dayOfWeek}
- Time until day resets: ${context.timeUntilDayEnd}
- My day begins at: ${context.dayCutTime}

MY CHARACTER:
- Level ${profile.level} Hero
- HP: ${profile.hp.current}/${profile.hp.max}
- Strength: ${profile.stats.strength} | Intelligence: ${profile.stats.intelligence}
- Discipline: ${profile.stats.discipline} | Focus: ${profile.stats.focus}
- Total battles won: ${profile.totalPomodoros}

{userInput ? `MY CURRENT STATE:\n${userInput}\n` : ''}

Reveal to me:
- What does my recent journey say about my progress toward my destiny?
- What is THE next quest I must undertake right now?
- How does today's path unfold (if a full day plan is needed)?
- What wisdom do you have for my continued growth?
```

### 3. Output Processing & UI

#### Response Structure
The LLM returns structured JSON with epic, narrative content that transforms productivity into a quest.

#### UI Components - Re-enchanted Design

**A. Revelation Panel/Modal**
- Trigger: "🔮 Seek Revelation" button on Dashboard (prominent, mystical styling)
- Opens as a full-screen modal with atmospheric effects
- Can be called multiple times per day
- Shows: "Last revelation granted: [timestamp]"
- Background: Mystical gradient, subtle particle effects

**B. The Revelation (Main Proclamation)**
```tsx
<div className="revelation-proclamation">
  <div className="mystical-icon">🔮</div>
  <h2 className="epic-title">The Path Reveals Itself</h2>
  <p className="revelation-text">{response.revelation}</p>
  {/* Epic, narrative text (2-4 sentences) about their destiny */}
</div>
```

**C. The Path (Single Next Quest - CERTAINTY)**
```tsx
<div className="the-path">
  <h3>Your Next Quest</h3>
  <div className="next-quest-card">
    <div className="quest-title">{response.thePath.nextQuest.title}</div>
    <div className="epic-reason">{response.thePath.nextQuest.epicReason}</div>
    <div className="certainty-statement">
      <span className="icon">⚡</span>
      {response.thePath.certainty}
    </div>
    <button
      className="begin-quest-button"
      onClick={() => handleStartQuest(response.thePath.nextQuest)}
    >
      ⚔️ Begin This Quest
    </button>
  </div>
</div>
```

**D. Witnessing (Emotional Recognition)**
```tsx
<div className="witnessing">
  <h3>Your Journey Witnessed</h3>

  <div className="victories">
    <span className="icon">🏆</span>
    <div className="content">
      <h4>Recent Victories</h4>
      <p>{response.witnessing.recentVictories}</p>
    </div>
  </div>

  {response.witnessing.struggles && (
    <div className="struggles">
      <span className="icon">💙</span>
      <div className="content">
        <h4>Challenges Acknowledged</h4>
        <p>{response.witnessing.struggles}</p>
      </div>
    </div>
  )}

  <div className="growth">
    <span className="icon">🌱</span>
    <div className="content">
      <h4>Your Growth</h4>
      <p>{response.witnessing.growth}</p>
    </div>
  </div>
</div>
```

**E. Today's Plan (if provided - as narrative)**
```tsx
{response.todaysPlan && (
  <div className="todays-adventure">
    <h3>Today's Adventure</h3>
    <p className="narrative">{response.todaysPlan.narrative}</p>
    <div className="time-chapters">
      <div className="chapter morning">
        <span className="time-icon">🌅</span>
        <h4>Morning</h4>
        <p>{response.todaysPlan.morning}</p>
      </div>
      <div className="chapter afternoon">
        <span className="time-icon">☀️</span>
        <h4>Afternoon</h4>
        <p>{response.todaysPlan.afternoon}</p>
      </div>
      <div className="chapter evening">
        <span className="time-icon">🌙</span>
        <h4>Evening</h4>
        <p>{response.todaysPlan.evening}</p>
      </div>
    </div>
  </div>
)}
```

**F. Wisdom & Warnings**
```tsx
{response.urgentWarnings && response.urgentWarnings.length > 0 && (
  <div className="urgent-warnings">
    <h4>⚠️ Urgent Matters</h4>
    {response.urgentWarnings.map((warning, i) => (
      <div key={i} className="warning-item">{warning}</div>
    ))}
  </div>
)}

<div className="wisdom">
  <div className="wisdom-icon">✨</div>
  <p className="wisdom-text">{response.wisdomForTheJourney}</p>
</div>
```

#### Interaction Features

1. **The Single Action** (Reducing Decision Cost)
   - ONE prominent "⚔️ Begin This Quest" button
   - If existing task: Launches Pomodoro immediately
   - If new suggestion: Creates task + launches Pomodoro in one flow
   - No secondary options, no choice paralysis
   - The path is clear, the user just acts

2. **Optional Context Sharing** (Emotional Input)
   - Text area: "Share your current state, energy, or thoughts..."
   - Placeholder examples:
     - "Feeling overwhelmed today"
     - "Excited and energized this morning"
     - "Struggling with motivation"
   - This input influences the emotional tone and task selection
   - Makes the user feel heard and understood

3. **Revelation History** (Tracking the Journey)
   - "📜 Past Revelations" - view last 7 revelations
   - Each shows: timestamp, quest given, whether completed
   - Framed as "Your Legend" - narrative view of progress
   - Shows character growth over time

### 4. Technical Architecture

#### Backend: Supabase Edge Function

**File Structure:**
```
/supabase/functions/revelation/
├── index.ts              # Main edge function
├── promptBuilder.ts      # Builds LLM prompt from data
├── dataCollector.ts      # Fetches all required data
└── .env.local           # API keys (gitignored)
```

**Edge Function Flow:**
```typescript
// POST /functions/v1/revelation
export async function handler(req: Request) {
  // 1. Verify authentication
  const user = await authenticateRequest(req);

  // 2. Parse request body
  const { userMessage } = await req.json();

  // 3. Collect all data
  const data = await collectRevelationData(user.id);

  // 4. Build prompt
  const prompt = buildRevelationPrompt(data, userMessage);

  // 5. Call LLM (OpenAI or Gemini)
  const response = await callLLM(prompt);

  // 6. Parse and validate response
  const revelation = parseRevelationResponse(response);

  // 7. Store in database (optional)
  await storeRevelation(user.id, revelation);

  // 8. Return to frontend
  return new Response(JSON.stringify(revelation), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

**Security:**
- API key stored in Supabase secrets: `OPENAI_API_KEY` or `GEMINI_API_KEY`
- Edge function requires authentication
- Rate limiting: max 10 revelations per day per user

#### Frontend: React Integration

**Hook:**
```typescript
// useRevelation.ts
export function useRevelation() {
  const [loading, setLoading] = useState(false);
  const [revelation, setRevelation] = useState<Revelation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getRevelation = async (userMessage?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('revelation', {
        body: { userMessage }
      });
      if (error) throw error;
      setRevelation(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { revelation, loading, error, getRevelation };
}
```

**Component:**
```tsx
// RevelationPanel.tsx
export function RevelationPanel() {
  const { revelation, loading, getRevelation } = useRevelation();
  const [userMessage, setUserMessage] = useState('');

  return (
    <div className="revelation-panel">
      <textarea
        value={userMessage}
        onChange={(e) => setUserMessage(e.target.value)}
        placeholder="Optional: Share your current state, energy level, or preferences..."
      />
      <button onClick={() => getRevelation(userMessage)} disabled={loading}>
        {loading ? 'Consulting the Oracle...' : '🔮 Get Revelation'}
      </button>

      {revelation && (
        <RevelationDisplay revelation={revelation} />
      )}
    </div>
  );
}
```

### 5. Database Schema Additions

#### New Table: `revelations`
```sql
CREATE TABLE revelations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Input context
  user_message TEXT,
  context_snapshot JSONB,  -- Store the full context for debugging/analysis

  -- LLM response
  insight TEXT,
  recommended_next JSONB,
  daily_plan JSONB,
  warnings TEXT[],
  suggestions TEXT[],

  -- Tracking
  actions_taken JSONB,  -- Which suggestions were acted upon
  was_helpful BOOLEAN   -- User feedback
);

CREATE INDEX idx_revelations_user_created
  ON revelations(user_id, created_at DESC);
```

### 6. LLM Provider Options

#### Option A: OpenAI (GPT-4)
- **Pros**: Excellent reasoning, reliable JSON output, good at structured tasks
- **Cons**: More expensive (~$0.03 per revelation)
- **Model**: `gpt-4-turbo-preview` or `gpt-4o`

#### Option B: Google Gemini (Gemini 1.5 Pro)
- **Pros**: Cheaper (~$0.01 per revelation), fast, good quality
- **Cons**: Slightly less consistent JSON formatting
- **Model**: `gemini-1.5-pro`

#### Recommendation: Start with Gemini, offer OpenAI as premium option

### 7. Edge Cases & Considerations

#### A. Empty States
- **No tasks**: LLM suggests creating first tasks based on goals
- **No goals**: Prompt user to set goals first, or provide general productivity advice
- **No recent activity**: LLM encourages getting started, suggests easy wins

#### B. Overwhelming States
- **Too many tasks**: LLM suggests prioritization, possibly archiving
- **Low HP/energy**: LLM recommends lighter tasks or rest
- **Missed streak**: Encouragement + reset strategy

#### C. Error Handling
- **LLM timeout**: Retry once, then show cached previous revelation
- **Invalid JSON**: Parse what's possible, show partial results
- **Rate limit hit**: Clear message about daily limit

#### D. Cost Management
- **Token optimization**: Include only essential data in prompt
- **Caching**: Cache user context for 1 hour to allow quick re-queries
- **Limits**: 10 revelations per user per day

### 8. Future Enhancements

1. **Learning from feedback**: Track which suggestions users act on
2. **Personalized templates**: LLM learns user preferences over time
3. **Voice input**: Speak your current state instead of typing
4. **Scheduling**: Auto-revelation at customizable times (e.g., every morning)
5. **Goal progress analysis**: Monthly reviews and goal adjustment suggestions
6. **Team revelations**: If multi-user features added, team productivity insights

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Set up Supabase Edge Function for Revelation
- [ ] Configure API keys (OpenAI or Gemini)
- [ ] Create data collection functions
- [ ] Build basic prompt template
- [ ] Test LLM integration with sample data

### Phase 2: Core Feature (Week 2)
- [ ] Build frontend `useRevelation` hook
- [ ] Create `RevelationPanel` component
- [ ] Implement insight display UI
- [ ] Add recommended tasks display
- [ ] Integrate with Dashboard

### Phase 3: Enhanced UX (Week 3)
- [ ] Add daily plan view
- [ ] Implement quick action buttons
- [ ] Create revelation history view
- [ ] Add loading states and animations
- [ ] Implement error handling

### Phase 4: Polish & Optimization (Week 4)
- [ ] Add user feedback collection
- [ ] Optimize prompt for better responses
- [ ] Implement rate limiting
- [ ] Add analytics/tracking
- [ ] Write tests

---

## Success Metrics

1. **Adoption**: % of users who try Revelation feature
2. **Engagement**: Average revelations per user per week
3. **Usefulness**: % of users who act on recommendations
4. **Satisfaction**: User feedback ratings on revelations
5. **Productivity**: Correlation between using Revelation and streak/completion rates

---

## Open Questions

1. **LLM Provider**: OpenAI vs Gemini? Or offer both?
2. **Frequency Limits**: Is 10 per day enough? Too much?
3. **History Storage**: How long to keep old revelations?
4. **Cost Allocation**: Free tier limits? Premium feature?
5. **Prompt Refinement**: A/B test different prompt styles?
6. **Mobile**: Any special considerations for mobile UI?

---

## Conclusion

The Revelation feature transforms Level-Up from a tracking tool into a **mystical guide that re-enchants the very act of productivity**. By leveraging AI to analyze the user's unique context, goals, and patterns, it provides guidance that is certain, emotional, decisive, and meaningful.

### How The Four Pillars Come Alive

**1. Certainty in Action**
- User clicks "Seek Revelation" → receives ONE clear quest
- No "maybe try this" or "consider that" - just "THIS is your path"
- Eliminates "what should I do?" anxiety completely
- Builds momentum through decisive direction

**2. Emotional Value Delivered**
- The "Witnessing" section makes users feel SEEN
- Celebrates victories with genuine warmth
- Acknowledges struggles with empathy
- Validates the journey, not just the outcomes
- Users feel accompanied, not alone

**3. Decision Cost Eliminated**
- No list of 10 tasks to choose from
- No "pros and cons" to weigh
- Just ONE button: "Begin This Quest"
- Cognitive load transferred to the AI
- Mental energy preserved for actual work

**4. Meaning Re-enchanted**
- Every task is framed as part of their legend
- Daily work connects to 3-year dreams
- Mundane becomes epic through narrative
- Users aren't "doing homework" - they're "mastering ancient texts"
- Life becomes a story worth living

### The Technical Excellence

The feature is also built with excellence:
- **Secure**: API keys safely stored in Supabase Edge Functions
- **Scalable**: Edge Functions handle any load
- **Flexible**: Easy to adjust prompts and add new data sources
- **Beautiful**: Epic UI with mystical atmosphere
- **Cost-effective**: Optimized token usage, rate limiting

### The Promise

**Revelation doesn't just tell users what to do - it transforms how they feel about doing it.**

It answers the ancient questions:
- "What should I do?" → Certainty
- "Does anyone see my effort?" → Emotional value
- "I'm too overwhelmed to decide" → Decision relief
- "Why does this even matter?" → Meaning restored

This is productivity reimagined as a quest, work reframed as legend-building, and daily tasks elevated to acts of destiny.
