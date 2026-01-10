# Revelation Feature - Complete Specification

**AI-Powered Daily Planning with Continuity, Overwhelm Detection, and Future Intelligence**

---

## Table of Contents

1. [Overview & Philosophy](#overview--philosophy)
2. [Core Functionality - MVP](#core-functionality---mvp)
3. [Continuity System](#continuity-system)
4. [Overwhelm Detection & Triage](#overwhelm-detection--triage)
5. [Future Enhancements](#future-enhancements)
6. [Conclusion](#conclusion)

---
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

- **Name**: "Revelation" (chosen because "Revelation" is taken)
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
You are part of Revelation, an RPG-style productivity system where users are heroes building their legend.

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
        {loading ? 'Consulting the Revelation...' : '🔮 Get Revelation'}
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

The Revelation feature transforms the app from a tracking tool into a **mystical guide that re-enchants the very act of productivity**. By leveraging AI to analyze the user's unique context, goals, and patterns, it provides guidance that is certain, emotional, decisive, and meaningful.

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

---
---

# PART 2: CONTINUITY SYSTEM

# Revelation Continuity & Daily Summaries

## Overview

This document extends the Revelation feature with **temporal continuity** - tracking plans over time, summarizing daily progress, and providing the LLM with historical context to create more meaningful, connected guidance.

## Core Concept: The Legend Unfolds Day by Day

Instead of treating each Revelation as isolated, we create a **narrative thread** that connects:
- Yesterday's summary (what happened)
- Last plan given (what was intended)
- Today's new plan (what comes next)

This creates:
- **Continuity**: Each day builds on the last
- **Reflection**: Users see their progress story
- **Learning**: LLM adapts based on what actually happened vs what was planned
- **Accountability**: Plans are tracked and reviewed
- **Meaning**: The journey becomes a cohesive narrative, not disconnected moments

---

## Database Schema

### 1. New Table: `revelation_plans`

Stores each plan generated by Revelation.

```sql
CREATE TABLE revelation_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Day this plan is for (using user's day cut time)
  plan_date DATE NOT NULL,

  -- The full revelation response (JSON)
  revelation_text TEXT NOT NULL,              -- The epic proclamation
  next_quest JSONB NOT NULL,                  -- The recommended quest
  witnessing JSONB,                           -- Victories, struggles, growth
  todays_plan JSONB,                          -- Morning/afternoon/evening narrative
  wisdom TEXT,                                -- Wisdom for the journey

  -- User input at time of revelation
  user_context TEXT,                          -- Optional message user shared

  -- Tracking
  was_quest_started BOOLEAN DEFAULT false,    -- Did they start the quest?
  quest_completed_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  model_used TEXT,                            -- 'gemini-1.5-pro' or 'gpt-4o'
  tokens_used INTEGER,

  CONSTRAINT unique_user_plan_date UNIQUE(user_id, plan_date)
);

CREATE INDEX idx_revelation_plans_user_date ON revelation_plans(user_id, plan_date DESC);
CREATE INDEX idx_revelation_plans_created ON revelation_plans(user_id, created_at DESC);
```

### 2. New Table: `daily_summaries`

Stores end-of-day summaries (generated when user gets first Revelation of next day).

```sql
CREATE TABLE daily_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,

  -- The day being summarized
  summary_date DATE NOT NULL,

  -- When this summary was generated (usually next morning)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- The plan that existed for this day
  plan_id UUID REFERENCES revelation_plans(id),

  -- Actual performance data
  summary_data JSONB NOT NULL,
  -- Structure:
  -- {
  --   pomodoros_completed: number,
  --   tasks_completed: string[],  // task titles
  --   tasks_attempted: string[],
  --   daily_tasks_done: boolean,
  --   total_minutes: number,
  --   plan_adherence: 'followed' | 'partially' | 'diverged' | 'no_plan'
  -- }

  -- LLM-generated narrative summary
  narrative_summary TEXT,
  -- Epic narrative about the day: victories, struggles, lessons learned
  -- Generated by LLM when analyzing the day

  -- Character development insights
  growth_insights JSONB,
  -- {
  --   strengths_shown: string[],
  --   challenges_faced: string[],
  --   patterns_noticed: string
  -- }

  CONSTRAINT unique_user_summary_date UNIQUE(user_id, summary_date)
);

CREATE INDEX idx_daily_summaries_user_date ON daily_summaries(user_id, summary_date DESC);
```

### 3. Update Existing Table: `revelation_plans` tracking

Add trigger to track quest completion:

```sql
-- Function to track when a task from a plan is completed
CREATE OR REPLACE FUNCTION track_revelation_quest_completion()
RETURNS TRIGGER AS $$
DECLARE
  latest_plan UUID;
BEGIN
  -- If a task was just completed, check if it matches today's revelation quest
  IF NEW.is_completed = true AND (OLD.is_completed = false OR OLD.is_completed IS NULL) THEN

    -- Get today's revelation plan
    SELECT id INTO latest_plan
    FROM revelation_plans
    WHERE user_id = NEW.user_id
      AND plan_date = CURRENT_DATE
      AND (next_quest->>'taskId') = NEW.id::text
    LIMIT 1;

    -- If this task matches today's quest, mark it
    IF latest_plan IS NOT NULL THEN
      UPDATE revelation_plans
      SET
        was_quest_started = true,
        quest_completed_at = NEW.completed_at
      WHERE id = latest_plan;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_quest_completion
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION track_revelation_quest_completion();
```

---

## Data Flow: Day Transition

### Scenario: User seeks Revelation in the morning

#### Step 1: Check if new day

```typescript
// In Edge Function
const now = new Date();
const userLocalDate = getLocalDateString(user.timezone, user.dayCutTime);

// Get last plan
const lastPlan = await getLastRevelationPlan(userId);

const isNewDay = !lastPlan || lastPlan.plan_date !== userLocalDate;
```

#### Step 2: If new day, generate yesterday's summary

```typescript
if (isNewDay && lastPlan) {
  // Get yesterday's date
  const yesterdayDate = lastPlan.plan_date;

  // Check if summary already exists
  const existingSummary = await getDailySummary(userId, yesterdayDate);

  if (!existingSummary) {
    // Collect yesterday's data
    const yesterdayData = await collectYesterdayData(userId, yesterdayDate);

    // Generate summary via LLM
    const summary = await generateDailySummary({
      user_id: userId,
      date: yesterdayDate,
      plan: lastPlan,
      actualData: yesterdayData
    });

    // Store summary
    await saveDailySummary(summary);
  }
}
```

#### Step 3: Include in context for new plan

```typescript
const revelationContext = {
  ...standardContext,
  lastPlan: lastPlan || null,
  yesterdaySummary: yesterdaySummary || null,
  isNewDay: isNewDay
};
```

---

## LLM Prompts - Enhanced with Continuity

### Daily Summary Generation Prompt

**Triggered**: When user seeks first Revelation of a new day

```
You are Revelation, chronicling the hero's journey through time.

A new day has dawned. Before we chart the path forward, we must honor yesterday's chapter.

YESTERDAY'S PLAN (${yesterdayDate}):
Plan created at: ${lastPlan.created_at}

The Quest Given:
- ${lastPlan.next_quest.title}
- Reason: ${lastPlan.next_quest.epicReason}

${lastPlan.todays_plan ? `
The Day's Adventure Planned:
Morning: ${lastPlan.todays_plan.morning}
Afternoon: ${lastPlan.todays_plan.afternoon}
Evening: ${lastPlan.todays_plan.evening}
` : ''}

WHAT ACTUALLY HAPPENED:
- Pomodoros completed: ${actualData.pomodoros_completed}
- Total time invested: ${actualData.total_minutes} minutes
- Tasks completed: ${actualData.tasks_completed.join(', ') || 'none'}
- Tasks attempted: ${actualData.tasks_attempted.join(', ') || 'none'}
- Daily disciplines completed: ${actualData.daily_tasks_done ? 'Yes ✓' : 'No'}
- Recommended quest status: ${actualData.quest_status}

GENERATE A NARRATIVE SUMMARY:

Provide a JSON response:
{
  "narrative_summary": "A brief, epic narrative (2-3 sentences) about yesterday's journey. Celebrate victories, acknowledge struggles, find meaning in what happened.",

  "growth_insights": {
    "strengths_shown": ["string - qualities they demonstrated"],
    "challenges_faced": ["string - obstacles encountered"],
    "pattern_noticed": "string - any recurring pattern (optional)"
  },

  "plan_adherence": "followed" | "partially_followed" | "diverged" | "exceeded",

  "lessons_for_today": "string - one key insight to carry forward"
}

GUIDELINES:
- Be honest but compassionate about divergence from plan
- Celebrate even small victories
- Frame challenges as part of the hero's journey
- Find meaning in what happened, even if plan wasn't followed
- Make them feel witnessed and understood
```

### Main Revelation Prompt - Enhanced

**Added sections** to the existing prompt:

```
[After all the existing context sections, ADD:]

CONTINUITY - YOUR JOURNEY CONTINUES:

${lastPlan ? `
YESTERDAY'S PLAN (${lastPlan.plan_date}):
Created at: ${formatTime(lastPlan.created_at)}

The quest I gave you:
- ${lastPlan.next_quest.title}
- Why it mattered: ${lastPlan.next_quest.epicReason}

${yesterdaySummary ? `
YESTERDAY'S CHAPTER (${yesterdaySummary.summary_date}):

What unfolded:
${yesterdaySummary.narrative_summary}

Strengths you showed:
${yesterdaySummary.growth_insights.strengths_shown.map(s => `- ${s}`).join('\n')}

Challenges you faced:
${yesterdaySummary.growth_insights.challenges_faced.map(c => `- ${c}`).join('\n')}

Plan adherence: ${yesterdaySummary.plan_adherence}

Lesson to carry forward:
${yesterdaySummary.lessons_for_today}
` : 'Yesterday has passed into legend, but its data speaks...'}
` : 'This is your first Revelation. Your legend begins now.'}

[Then continue with existing prompt...]

CRITICAL ADDITIONS TO GUIDELINES:
11. If yesterday's plan exists, acknowledge it - reference continuity
12. If they followed the plan, celebrate their discipline
13. If they diverged, explore why with curiosity (not judgment)
14. Build today's plan as the NEXT CHAPTER in their ongoing story
15. Use yesterday's lessons to inform today's quest
16. Create narrative continuity: "Yesterday you [X], today you shall [Y]..."
```

---

## Edge Function Logic

### Main Flow

```typescript
export async function handler(req: Request) {
  // 1. Authenticate
  const user = await authenticateRequest(req);

  // 2. Parse user input
  const { userMessage } = await req.json();

  // 3. Get user's local date
  const userProfile = await getUserProfile(user.id);
  const localDate = getLocalDateString(userProfile.timezone_name, userProfile.daily_reset_time);

  // 4. Get last plan
  const lastPlan = await getLastRevelationPlan(user.id);
  const isNewDay = !lastPlan || lastPlan.plan_date !== localDate;

  // 5. Handle day transition
  let yesterdaySummary = null;
  if (isNewDay && lastPlan) {
    // Get or generate yesterday's summary
    yesterdaySummary = await getDailySummary(user.id, lastPlan.plan_date);

    if (!yesterdaySummary) {
      const yesterdayData = await collectYesterdayData(user.id, lastPlan.plan_date);
      yesterdaySummary = await generateDailySummary(user.id, lastPlan, yesterdayData);
      await saveDailySummary(yesterdaySummary);
    }
  }

  // 6. Collect all context
  const context = await collectRevelationContext(user.id);

  // 7. Build prompt with continuity
  const prompt = buildRevelationPrompt({
    ...context,
    lastPlan,
    yesterdaySummary,
    isNewDay,
    userMessage
  });

  // 8. Call LLM
  const revelation = await callLLM(prompt);

  // 9. Save new plan
  await saveRevelationPlan({
    user_id: user.id,
    plan_date: localDate,
    revelation_text: revelation.revelation,
    next_quest: revelation.thePath.nextQuest,
    witnessing: revelation.witnessing,
    todays_plan: revelation.todaysPlan,
    wisdom: revelation.wisdomForTheJourney,
    user_context: userMessage
  });

  // 10. Return revelation (include yesterday's summary if exists)
  return new Response(JSON.stringify({
    ...revelation,
    yesterdaySummary: yesterdaySummary
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### Helper Functions

```typescript
// Get yesterday's actual data
async function collectYesterdayData(userId: string, date: string) {
  // Get all pomodoros from that date
  const { data: pomodoros } = await supabase
    .from('pomodoros')
    .select('*, tasks(title)')
    .eq('user_id', userId)
    .gte('completed_at', `${date} 00:00:00`)
    .lt('completed_at', `${date} 23:59:59`);

  // Get daily task completions for that date
  const { data: dailyCompletions } = await supabase
    .from('daily_task_completions')
    .select('*, tasks(title)')
    .eq('user_id', userId)
    .eq('date', date);

  // Get one-time tasks completed that day
  const { data: completedTasks } = await supabase
    .from('tasks')
    .select('title, completed_at')
    .eq('user_id', userId)
    .gte('completed_at', `${date} 00:00:00`)
    .lt('completed_at', `${date} 23:59:59`)
    .eq('is_completed', true);

  // Calculate metrics
  const pomodorosCount = pomodoros?.length || 0;
  const totalMinutes = pomodoros?.reduce((sum, p) => sum + p.duration_minutes, 0) || 0;
  const tasksCompleted = completedTasks?.map(t => t.title) || [];
  const tasksAttempted = [...new Set(pomodoros?.map(p => p.tasks?.title).filter(Boolean))] || [];
  const dailyTasksDone = dailyCompletions?.every(dc => dc.is_completed) || false;

  return {
    pomodoros_completed: pomodorosCount,
    total_minutes: totalMinutes,
    tasks_completed: tasksCompleted,
    tasks_attempted: tasksAttempted,
    daily_tasks_done: dailyTasksDone,
    quest_status: 'unknown' // Will be determined by LLM
  };
}

// Generate summary using LLM
async function generateDailySummary(userId: string, lastPlan: any, actualData: any) {
  const prompt = buildDailySummaryPrompt(lastPlan, actualData);
  const response = await callLLM(prompt, { maxTokens: 500 }); // Shorter, focused response

  return {
    user_id: userId,
    summary_date: lastPlan.plan_date,
    plan_id: lastPlan.id,
    summary_data: actualData,
    narrative_summary: response.narrative_summary,
    growth_insights: response.growth_insights
  };
}
```

---

## UI Enhancements

### Yesterday's Summary Display

When user opens Revelation modal on a new day:

```tsx
{yesterdaySummary && (
  <div className="yesterdays-chapter">
    <h3>📜 Yesterday's Chapter</h3>
    <div className="summary-card">
      <div className="date">
        {formatDate(yesterdaySummary.summary_date)}
      </div>

      <div className="narrative">
        <p>{yesterdaySummary.narrative_summary}</p>
      </div>

      {yesterdaySummary.growth_insights.strengths_shown.length > 0 && (
        <div className="strengths">
          <h4>💪 Strengths You Showed</h4>
          <ul>
            {yesterdaySummary.growth_insights.strengths_shown.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {yesterdaySummary.growth_insights.challenges_faced.length > 0 && (
        <div className="challenges">
          <h4>⚔️ Challenges Faced</h4>
          <ul>
            {yesterdaySummary.growth_insights.challenges_faced.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="lesson">
        <span className="icon">✨</span>
        <p>{yesterdaySummary.lessons_for_today}</p>
      </div>
    </div>
  </div>
)}
```

### Continuity Indicator

Show plan history:

```tsx
<div className="plan-continuity">
  <button onClick={() => setShowHistory(!showHistory)}>
    📖 View Your Legend (Last 7 Days)
  </button>

  {showHistory && (
    <div className="plan-history">
      {plans.map(plan => (
        <div key={plan.id} className="history-entry">
          <div className="date">{formatDate(plan.plan_date)}</div>
          <div className="quest">{plan.next_quest.title}</div>
          <div className="status">
            {plan.was_quest_started ? (
              plan.quest_completed_at ? '✓ Completed' : '⚔️ Attempted'
            ) : '○ Not started'}
          </div>
        </div>
      ))}
    </div>
  )}
</div>
```

---

## Benefits of This Approach

### 1. Continuity Creates Meaning
- Each day connects to the last
- User sees their journey as a story, not isolated events
- "Yesterday I [X], today I [Y]" creates narrative flow

### 2. Reflection Builds Awareness
- Daily summaries force acknowledgment of what happened
- Patterns become visible over time
- Growth is documented and celebrated

### 3. Accountability Without Shame
- LLM sees if plan was followed
- Divergence is explored with curiosity, not judgment
- "Why did you choose differently?" instead of "You failed"

### 4. Learning Over Time
- LLM learns user's patterns
- Adjusts recommendations based on what actually works
- Becomes more personalized with each day

### 5. Emotional Impact
- Summaries celebrate victories (emotional value)
- Acknowledges struggles (witnessing)
- Shows growth over time (meaning)
- Makes every day part of a larger quest (re-enchantment)

## Example: A Day in the Life

### Day 1 (Monday Morning)
**User**: Seeks Revelation
**System**: No previous plan, generates first Revelation
**LLM**: "Your legend begins now. Your next quest: Master the ancient texts (Study ML paper for 90 min)..."
**Stored**: Plan for Monday

### Day 1 (Monday Evening)
**User**: Seeks Revelation again
**System**: Same day, returns existing plan or updates if needed
**Note**: Can allow multiple revelations per day, but plan_date stays same

### Day 2 (Tuesday Morning)
**User**: Seeks Revelation
**System**: Detects new day!
**Step 1**: Collect Monday's data (did they do the quest? what else happened?)
**Step 2**: Generate Monday's summary via LLM
**Summary**: "Yesterday, you faced the ancient texts with courage, completing 2 Pomodoros of focused study. Though you fell short of the 90-minute goal, you demonstrated discipline by beginning the quest. Your legend grows..."
**Step 3**: Send summary + Monday's plan to LLM for Tuesday's Revelation
**LLM**: "Yesterday you began your scholarly journey. Today, you shall continue the mastery. Your next quest: Complete the ancient text analysis (Study ML paper - 60 min, building on yesterday)..."
**Stored**: Plan for Tuesday, Summary for Monday

### Day 3 (Wednesday Morning)
**User**: Seeks Revelation
**System**: Tuesday summary + plan → Wednesday Revelation
**Continuity**: "For two days you have walked the path of knowledge. Today you consolidate your power..."

---

## Conclusion

This continuity system transforms Revelation from a daily snapshot into a **living chronicle of the hero's journey**. Each day builds on the last, creating:

- **Meaningful narrative** instead of disconnected advice
- **Reflection and growth** instead of just forward motion
- **Accountability** without shame
- **Learning** that improves over time
- **A legend** that unfolds, chapter by chapter

The user's life becomes a story worth living, and Revelation becomes the wise chronicler who witnesses, guides, and celebrates every step of the journey.

---
---

# PART 3: OVERWHELM DETECTION & TRIAGE

# Revelation: Overwhelm Detection & Triage

## The Critical Edge Case

### Scenario: Mathematical Impossibility

**Reality check:**
- Daily tasks require: 10 hours
- One-time tasks (before deadlines): 10 hours
- Total needed: 20 hours/day
- Available (with sleep, meals, breaks): ~12-14 hours/day
- **Deficit: 6-8 hours/day**

**This is not a productivity problem. This is a CRISIS.**

The user is:
- ❌ Not failing at time management
- ❌ Not lacking discipline
- ✅ **Overcommitted beyond physical possibility**
- ✅ **Needs intervention, not motivation**

---

## Why This Matters: The Four Pillars

### 1. **Provide Certainty**
**Wrong**: "Try harder! You can do it!"
**Right**: "This is mathematically impossible. You need to cut 8 hours/day."

### 2. **Provide Emotional Value**
**Wrong**: Imply they're failing
**Right**: "You're carrying an impossible load. That's not weakness, that's reality."

### 3. **Reduce Decision Cost**
**Wrong**: "Figure out what to drop"
**Right**: "Here are the 3 specific tasks to postpone, and why."

### 4. **Provide Meaning**
**Wrong**: Frame cutting tasks as failure
**Right**: "Saying no to protect your health is the hero's true wisdom. Some battles must be declined to win the war."

---

## Detection Algorithm

### Step 1: Calculate Total Time Required

```typescript
async function detectOverwhelm(userId: string) {
  const userProfile = await getUserProfile(userId);
  const dayCutTime = userProfile.daily_reset_time;
  const today = getLocalDateString(userProfile.timezone_name, dayCutTime);

  // 1. Daily tasks time requirement
  const dailyTasks = await getActiveDailyTasks(userId);
  const dailyTasksMinutes = dailyTasks.reduce(
    (sum, task) => sum + (task.target_duration_minutes || 0),
    0
  );

  // 2. One-time tasks with approaching deadlines
  const urgentTasks = await getUrgentOnetimeTasks(userId, {
    deadlineWithinDays: 7
  });

  // Calculate time needed per day for each urgent task
  const urgentTasksMinutesPerDay = urgentTasks.map(task => {
    const remainingMinutes = (task.estimated_minutes || 0) - (task.completed_minutes || 0);
    const daysUntilDeadline = calculateDaysUntil(task.deadline, today);
    const minutesPerDay = remainingMinutes / Math.max(daysUntilDeadline, 1);

    return {
      task,
      remainingMinutes,
      daysUntilDeadline,
      minutesPerDay
    };
  });

  const urgentTasksTotalPerDay = urgentTasksMinutesPerDay.reduce(
    (sum, item) => sum + item.minutesPerDay,
    0
  );

  // 3. Total required per day
  const totalMinutesPerDay = dailyTasksMinutes + urgentTasksTotalPerDay;
  const totalHoursPerDay = totalMinutesPerDay / 60;

  // 4. Available time calculation
  const sleepHours = 7; // Minimum healthy sleep
  const mealsBreaksHours = 3; // Eating, hygiene, breaks
  const availableHours = 24 - sleepHours - mealsBreaksHours; // ~14 hours

  // 5. Deficit calculation
  const deficitHours = totalHoursPerDay - availableHours;

  return {
    isOverwhelmed: deficitHours > 0,
    severity: calculateSeverity(deficitHours),
    dailyTasksHours: dailyTasksMinutes / 60,
    urgentTasksHours: urgentTasksTotalPerDay / 60,
    totalHoursNeeded: totalHoursPerDay,
    availableHours,
    deficitHours,
    urgentTasks: urgentTasksMinutesPerDay
  };
}

function calculateSeverity(deficitHours: number): string {
  if (deficitHours <= 0) return 'sustainable';
  if (deficitHours <= 2) return 'mild'; // Tight but manageable
  if (deficitHours <= 4) return 'moderate'; // Unsustainable
  if (deficitHours <= 8) return 'severe'; // Dangerous
  return 'critical'; // Physically impossible
}
```

### Step 2: Integrate with Calendar (if available)

```typescript
async function detectOverwhelmWithCalendar(userId: string, overwhelmData: any) {
  if (!user.calendar_sync_enabled) {
    return overwhelmData;
  }

  // Get today's calendar events
  const calendarEvents = await getTodayCalendarEvents(userId);
  const calendarHours = calendarEvents.reduce(
    (sum, event) => sum + (event.duration_minutes / 60),
    0
  );

  // Recalculate with calendar
  const availableHoursWithCalendar = overwhelmData.availableHours - calendarHours;
  const deficitHoursWithCalendar = overwhelmData.totalHoursNeeded - availableHoursWithCalendar;

  return {
    ...overwhelmData,
    calendarHours,
    availableHoursWithCalendar,
    deficitHoursWithCalendar,
    severity: calculateSeverity(deficitHoursWithCalendar)
  };
}
```

---

## Triage Algorithm

### Prioritization Logic

When overwhelm is detected, automatically triage tasks:

```typescript
async function triageTasks(userId: string, overwhelmData: any) {
  const allTasks = [...overwhelmData.dailyTasks, ...overwhelmData.urgentTasks];

  // Score each task for triage
  const scoredTasks = allTasks.map(task => {
    const score = calculateTriageScore(task, overwhelmData);
    return { task, score };
  });

  // Sort by triage score (higher = more important to keep)
  scoredTasks.sort((a, b) => b.score - a.score);

  // Calculate cumulative hours
  let cumulativeHours = 0;
  const toKeep = [];
  const toPostpone = [];
  const toNegotiate = [];

  for (const { task, score } of scoredTasks) {
    const taskHours = getTaskHoursPerDay(task);

    if (cumulativeHours + taskHours <= overwhelmData.availableHours) {
      toKeep.push({ task, score, reason: 'fits_in_available_time' });
      cumulativeHours += taskHours;
    } else if (task.deadline && isNegotiable(task)) {
      toNegotiate.push({ task, score, reason: 'deadline_negotiable' });
    } else {
      toPostpone.push({ task, score, reason: 'time_constraint' });
    }
  }

  return { toKeep, toPostpone, toNegotiate };
}

function calculateTriageScore(task: Task, context: any): number {
  let score = 0;

  // 1. Alignment with long-term goals (0-30 points)
  const goalAlignment = calculateGoalAlignment(task, context.goals);
  score += goalAlignment * 30;

  // 2. Deadline urgency (0-25 points)
  if (task.deadline) {
    const daysUntil = calculateDaysUntil(task.deadline);
    if (daysUntil <= 1) score += 25;
    else if (daysUntil <= 3) score += 20;
    else if (daysUntil <= 7) score += 15;
    else score += 5;
  }

  // 3. Dependencies (0-20 points)
  const dependencyScore = calculateDependencyScore(task);
  score += dependencyScore;

  // 4. Priority weight (0-15 points)
  if (task.priority === 'high') score += 15;
  else if (task.priority === 'medium') score += 8;
  else score += 3;

  // 5. Completion progress (0-10 points)
  // If already invested time, higher score to not waste progress
  const progressRatio = (task.completed_minutes || 0) / (task.estimated_minutes || 1);
  score += progressRatio * 10;

  return score;
}

function isNegotiable(task: Task): boolean {
  // Heuristics for negotiability
  if (task.category === 'work' && task.deadline) return true; // Work deadlines often negotiable
  if (task.priority === 'low') return true;
  if (task.is_self_imposed) return true;
  return false;
}
```

---

## Enhanced Revelation Prompt: Overwhelm Mode

When `isOverwhelmed === true`, the prompt changes dramatically:

```
CRITICAL ALERT: HERO OVERCOMMITMENT DETECTED

You are analyzing a hero who is carrying an IMPOSSIBLE load.

MATHEMATICAL REALITY:
- Daily tasks require: ${overwhelmData.dailyTasksHours} hours/day
- Urgent one-time tasks require: ${overwhelmData.urgentTasksHours} hours/day
- Calendar commitments: ${overwhelmData.calendarHours} hours/day
- TOTAL NEEDED: ${overwhelmData.totalHoursNeeded} hours/day

- Sleep needed (healthy): 7 hours
- Meals, hygiene, breaks: 3 hours
- MAXIMUM AVAILABLE: ${overwhelmData.availableHours} hours/day

- **DEFICIT: ${overwhelmData.deficitHours} hours/day**

This is not a productivity problem. This is a CRISIS of overcommitment.

SEVERITY: ${overwhelmData.severity}

TASKS REQUIRING TRIAGE:
[Daily Tasks]
${dailyTasks.map(t => `- ${t.title}: ${t.target_duration_minutes} min/day`).join('\n')}

[Urgent One-Time Tasks]
${urgentTasks.map(t => `
- ${t.title}
  Deadline: ${t.deadline}
  Days remaining: ${t.daysUntilDeadline}
  Remaining work: ${t.remainingMinutes} min
  Required per day: ${t.minutesPerDay} min
`).join('\n')}

AUTOMATED TRIAGE ANALYSIS:
[Keep (Fits in available time)]
${toKeep.map(t => `- ${t.task.title} (score: ${t.score})`).join('\n')}

[Postpone (Time constraint)]
${toPostpone.map(t => `- ${t.task.title} (score: ${t.score})`).join('\n')}

[Negotiate deadline]
${toNegotiate.map(t => `- ${t.task.title} (score: ${t.score})`).join('\n')}

YOUR SACRED DUTY:

1. ACKNOWLEDGE THE REALITY
   - This is mathematically impossible
   - This is not their failure
   - They are carrying too much

2. PROVIDE TRIAGE GUIDANCE
   - Which tasks to keep (with certainty)
   - Which tasks to postpone (with specific reasons)
   - Which deadlines to negotiate (with talking points)

3. REFRAME AS WISDOM, NOT FAILURE
   - Saying "no" is heroic when overwhelmed
   - Protecting health is the ultimate victory
   - Strategic retreat is warrior wisdom

4. GIVE SPECIFIC ACTIONS
   - "Email [person] today to extend deadline by 3 days"
   - "Pause [task] until next week"
   - "Reduce [daily task] from 60min to 30min"

OUTPUT FORMAT (SPECIAL OVERWHELM MODE):
{
  "revelation": "Epic, compassionate acknowledgment of impossible situation",

  "reality_check": {
    "total_hours_needed": number,
    "total_hours_available": number,
    "deficit_hours": number,
    "severity": "mild" | "moderate" | "severe" | "critical",
    "message": "You are overcommitted by X hours per day. This is not sustainable."
  },

  "triage_plan": {
    "keep_tasks": [
      {
        "task_id": "string",
        "title": "string",
        "reason": "Aligns with 1-year goal + imminent deadline"
      }
    ],
    "postpone_tasks": [
      {
        "task_id": "string",
        "title": "string",
        "postpone_until": "date",
        "reason": "Lower priority, flexible timeline"
      }
    ],
    "negotiate_deadlines": [
      {
        "task_id": "string",
        "title": "string",
        "current_deadline": "date",
        "request_extension_to": "date",
        "talking_points": ["string"],
        "who_to_contact": "string (if known)"
      }
    ],
    "reduce_scope": [
      {
        "task_id": "string",
        "title": "string",
        "current_commitment": "string (e.g., '60 min/day')",
        "reduced_commitment": "string (e.g., '30 min/day')",
        "rationale": "string"
      }
    ]
  },

  "immediate_actions": [
    {
      "action": "string (specific, actionable step)",
      "priority": "critical" | "high" | "medium",
      "time_estimate": "minutes"
    }
  ],

  "witnessing": {
    "acknowledgment": "You are not failing. You are facing an impossible situation with courage.",
    "reframe": "Saying no to protect your health is warrior wisdom, not weakness."
  },

  "emergency_quest": {
    "title": "Today's Survival Quest",
    "description": "Complete ONLY the critical tasks that advance your legend",
    "tasks": ["task_id"],
    "total_time": "X hours (sustainable)"
  },

  "wisdom": "A hero who knows their limits lives to fight another day. This is strategic wisdom."
}

CRITICAL TONE GUIDELINES:
- Be HONEST about the math (don't sugarcoat)
- Be COMPASSIONATE (this is hard)
- Be DIRECTIVE (make the hard decisions for them)
- Be EMPOWERING (they're not failing, they're being strategic)
- Frame triage as HEROIC WISDOM, not defeat
```

---

## UI Components: Overwhelm Mode

### Crisis Alert Banner

```tsx
{overwhelmData.isOverwhelmed && (
  <div className="overwhelm-alert">
    <div className="alert-header">
      <span className="icon">⚠️</span>
      <h2>Overcommitment Detected</h2>
    </div>

    <div className="reality-check">
      <div className="stat">
        <label>Time Needed:</label>
        <span className="value danger">{totalHours}h/day</span>
      </div>
      <div className="stat">
        <label>Time Available:</label>
        <span className="value">{availableHours}h/day</span>
      </div>
      <div className="stat deficit">
        <label>Deficit:</label>
        <span className="value critical">-{deficitHours}h/day</span>
      </div>
    </div>

    <div className="severity-badge" data-severity={severity}>
      {severity === 'critical' && '🚨 Critical'}
      {severity === 'severe' && '⚠️ Severe'}
      {severity === 'moderate' && '⚡ Moderate'}
    </div>

    <p className="message">
      This is mathematically impossible. You need triage, not time management.
    </p>
  </div>
)}
```

### Triage Plan Display

```tsx
<div className="triage-plan">
  <h3>🎯 Your Triage Plan</h3>

  {revelation.triage_plan.keep_tasks.length > 0 && (
    <div className="triage-section keep">
      <h4>✅ Keep (Continue These)</h4>
      {revelation.triage_plan.keep_tasks.map(item => (
        <div key={item.task_id} className="triage-item">
          <div className="task-title">{item.title}</div>
          <div className="reason">{item.reason}</div>
        </div>
      ))}
    </div>
  )}

  {revelation.triage_plan.postpone_tasks.length > 0 && (
    <div className="triage-section postpone">
      <h4>⏸️ Postpone (Pause These)</h4>
      {revelation.triage_plan.postpone_tasks.map(item => (
        <div key={item.task_id} className="triage-item">
          <div className="task-title">{item.title}</div>
          <div className="postpone-until">
            Resume: {formatDate(item.postpone_until)}
          </div>
          <div className="reason">{item.reason}</div>
          <button onClick={() => handlePostpone(item)}>
            Postpone Now
          </button>
        </div>
      ))}
    </div>
  )}

  {revelation.triage_plan.negotiate_deadlines.length > 0 && (
    <div className="triage-section negotiate">
      <h4>📧 Negotiate (Request Extensions)</h4>
      {revelation.triage_plan.negotiate_deadlines.map(item => (
        <div key={item.task_id} className="triage-item">
          <div className="task-title">{item.title}</div>
          <div className="deadline-info">
            <span>Current: {formatDate(item.current_deadline)}</span>
            <span className="arrow">→</span>
            <span>Request: {formatDate(item.request_extension_to)}</span>
          </div>

          {item.who_to_contact && (
            <div className="contact">Contact: {item.who_to_contact}</div>
          )}

          <div className="talking-points">
            <strong>Talking points:</strong>
            <ul>
              {item.talking_points.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>

          <button onClick={() => copyEmailTemplate(item)}>
            📋 Copy Email Template
          </button>
        </div>
      ))}
    </div>
  )}

  {revelation.triage_plan.reduce_scope.length > 0 && (
    <div className="triage-section reduce">
      <h4>📉 Reduce Scope</h4>
      {revelation.triage_plan.reduce_scope.map(item => (
        <div key={item.task_id} className="triage-item">
          <div className="task-title">{item.title}</div>
          <div className="scope-change">
            <span className="old">{item.current_commitment}</span>
            <span className="arrow">→</span>
            <span className="new">{item.reduced_commitment}</span>
          </div>
          <div className="rationale">{item.rationale}</div>
          <button onClick={() => handleReduceScope(item)}>
            Update Task
          </button>
        </div>
      ))}
    </div>
  )}
</div>
```

### Immediate Actions Checklist

```tsx
<div className="immediate-actions">
  <h3>⚡ Do These Today</h3>
  <p>Critical steps to restore sustainability:</p>

  {revelation.immediate_actions.map((action, i) => (
    <div key={i} className="action-item" data-priority={action.priority}>
      <input
        type="checkbox"
        id={`action-${i}`}
        onChange={() => handleActionComplete(action)}
      />
      <label htmlFor={`action-${i}`}>
        <div className="action-text">{action.action}</div>
        <div className="meta">
          <span className="priority">{action.priority}</span>
          <span className="time">~{action.time_estimate} min</span>
        </div>
      </label>
    </div>
  ))}
</div>
```

### Compassionate Witnessing

```tsx
<div className="witnessing-overwhelm">
  <div className="icon">💙</div>
  <div className="message">
    <p className="acknowledgment">
      {revelation.witnessing.acknowledgment}
    </p>
    <p className="reframe">
      {revelation.witnessing.reframe}
    </p>
  </div>
</div>
```

---

## Email Templates

### Auto-generated deadline negotiation email

```typescript
function generateNegotiationEmail(item: NegotiateItem): string {
  return `
Subject: Request for deadline extension - ${item.title}

Hi ${item.who_to_contact || '[Name]'},

I'm writing to request an extension on ${item.title}, currently due ${formatDate(item.current_deadline)}.

${item.talking_points.map(point => `• ${point}`).join('\n')}

Would it be possible to extend the deadline to ${formatDate(item.request_extension_to)}? This would allow me to deliver higher quality work while managing other commitments.

I appreciate your understanding and flexibility.

Best regards,
[Your name]
`.trim();
}
```

---

## Example Overwhelm Revelation

### User Context
- Daily tasks: 8 hours needed
- Urgent tasks: 6 hours needed
- Calendar: 4 hours of meetings
- Total: 18 hours needed
- Available: 14 hours (with sleep)
- Deficit: 4 hours/day
- Severity: **Moderate to Severe**

### Generated Revelation

```json
{
  "revelation": "Brave hero, I must speak truth: you carry a burden beyond mortal capacity. Your daily disciplines demand 8 hours, urgent quests require 6 more, and 4 hours of council meetings await. That is 18 hours - yet even without sleep, the day offers only 24. This is not a test of your strength. This is mathematics declaring: 'impossible.' You are not failing. You face an impossible situation. The path forward is not harder work - it is strategic wisdom.",

  "reality_check": {
    "total_hours_needed": 18,
    "total_hours_available": 14,
    "deficit_hours": 4,
    "severity": "moderate",
    "message": "You are overcommitted by 4 hours per day. This is not sustainable."
  },

  "triage_plan": {
    "keep_tasks": [
      {
        "task_id": "task-1",
        "title": "Complete research paper",
        "reason": "Due in 2 days, aligns with 1-year academic goal, 80% complete"
      },
      {
        "task_id": "task-2",
        "title": "Morning exercise (30min)",
        "reason": "Health is foundation - without it, nothing else matters"
      }
    ],

    "postpone_tasks": [
      {
        "task_id": "task-3",
        "title": "Website redesign",
        "postpone_until": "2025-01-15",
        "reason": "No hard deadline, lower priority than academic goals"
      }
    ],

    "negotiate_deadlines": [
      {
        "task_id": "task-4",
        "title": "Client presentation deck",
        "current_deadline": "2025-01-08",
        "request_extension_to": "2025-01-10",
        "talking_points": [
          "Need 2 extra days to incorporate recent feedback thoroughly",
          "Want to ensure highest quality delivery",
          "Currently managing end-of-semester academic commitments"
        ],
        "who_to_contact": "Sarah (client manager)"
      }
    ],

    "reduce_scope": [
      {
        "task_id": "task-5",
        "title": "Daily reading",
        "current_commitment": "60 min/day",
        "reduced_commitment": "30 min/day",
        "rationale": "Maintain habit but reduce time until crisis passes. Half the reading is better than abandoning it entirely."
      }
    ]
  },

  "immediate_actions": [
    {
      "action": "Email Sarah requesting presentation deadline extension to Jan 10",
      "priority": "critical",
      "time_estimate": "10"
    },
    {
      "action": "Mark 'Website redesign' as paused in task manager",
      "priority": "high",
      "time_estimate": "2"
    },
    {
      "action": "Update 'Daily reading' from 60min to 30min",
      "priority": "medium",
      "time_estimate": "1"
    }
  ],

  "witnessing": {
    "acknowledgment": "You are not failing. You are facing an impossible situation with courage. The fact that you're seeking guidance shows wisdom, not weakness.",
    "reframe": "A hero who knows when to decline a battle wins the war. Saying no to protect your capacity is strategic mastery, not defeat."
  },

  "emergency_quest": {
    "title": "Today's Survival Quest",
    "description": "Focus ONLY on what advances your legend without breaking you",
    "tasks": ["task-1", "task-2"],
    "total_time": "3.5 hours (sustainable)"
  },

  "wisdom": "The greatest warriors know their limits. You fight another day by not fighting every battle today. This is wisdom, not weakness."
}
```

---

## Benefits

### Prevents Burnout
- Catches overcommitment before it causes crisis
- Forces realistic planning
- Protects user health

### Provides Clarity in Chaos
- Mathematical proof of impossibility
- Removes self-blame ("I'm just bad at this")
- Clear triage decisions

### Actionable Solutions
- Specific tasks to postpone
- Email templates for negotiations
- Scope reduction suggestions

### Emotional Support
- Acknowledges difficulty
- Reframes as strategic wisdom
- Makes user feel witnessed, not judged

### Upholds Four Pillars

**Certainty**: "You MUST cut 4 hours. Here's exactly what."
**Emotional Value**: "This isn't failure. You're brave for facing it."
**Reduced Decision Cost**: "I've triaged. Follow this plan."
**Meaning**: "Strategic retreat is heroic wisdom."

## Conclusion

**Overwhelm detection transforms Revelation from an optimizer into a guardian.**

It doesn't just help you do more - it **protects you from doing the impossible**.

This is perhaps the most important feature of all, because:
- Without it, Revelation could inadvertently encourage burnout
- With it, Revelation becomes a wise ally that says "no" when you can't
- It reframes impossible situations as strategic challenges, not personal failures

**The hero's greatest wisdom is knowing when to decline a battle.**

Revelation must embody this wisdom, protecting the user from themselves when the math says "stop."

This is **re-enchantment with compassion** - making life meaningful by first making it **livable**.

---
---

# PART 4: FUTURE ENHANCEMENTS

# Revelation: Future Enhancements

## Vision: The Autonomous Revelation

Transform Revelation from a guided advisor into an **autonomous Revelation** that:
- Sees your entire life context (calendar, commitments, real-world constraints)
- Queries information it needs autonomously (MCP)
- Reasons about complex scheduling and priorities
- Integrates seamlessly with your existing digital ecosystem

---

## Part 1: Calendar Integration

### Overview

Connect Revelation to Google Calendar and Apple Calendar to provide **reality-based planning** that respects actual time constraints and commitments.

### Why This Matters

**Current limitation**: Revelation plans without knowing:
- "User has a 2-hour meeting at 2pm"
- "User's morning is blocked with dentist appointment"
- "User has back-to-back calls all afternoon"

**With calendar**: Revelation sees the full picture:
- Available time blocks
- Energy-appropriate scheduling (don't suggest deep work right before big presentation)
- Realistic task placement
- Buffer time around commitments

### The Four Pillars Enhanced

1. **Certainty**: "Your morning is clear until 10am. Begin your quest then."
2. **Emotional Value**: "I see you have a challenging presentation at 3pm. Let's prepare you mentally with lighter work beforehand."
3. **Reduced Decision Cost**: "I've found the perfect 90-minute window at 1pm for your deep work."
4. **Meaning**: "This meeting advances your 1-year goal of [X]. Your preparation matters."

---

## Calendar Integration Architecture

### 1. Calendar Connection Options

#### Option A: OAuth Integration (Recommended)

**Google Calendar:**
```typescript
// OAuth flow
const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?
  client_id=${GOOGLE_CLIENT_ID}&
  redirect_uri=${REDIRECT_URI}&
  response_type=code&
  scope=https://www.googleapis.com/auth/calendar.readonly&
  access_type=offline&
  prompt=consent
`;

// Store tokens in user_profiles
ALTER TABLE user_profiles ADD COLUMN google_calendar_token TEXT;
ALTER TABLE user_profiles ADD COLUMN google_calendar_refresh_token TEXT;
ALTER TABLE user_profiles ADD COLUMN calendar_sync_enabled BOOLEAN DEFAULT false;
```

**Apple Calendar (via CalDAV):**
```typescript
// CalDAV connection
const calDavConfig = {
  serverUrl: 'https://caldav.icloud.com',
  username: user.appleId,
  password: user.appSpecificPassword,
  caldavUrl: `/calendar/${user.principalId}/events/`
};

// Store in user_profiles
ALTER TABLE user_profiles ADD COLUMN caldav_url TEXT;
ALTER TABLE user_profiles ADD COLUMN caldav_username TEXT;
ALTER TABLE user_profiles ADD COLUMN caldav_token_encrypted TEXT;
```

#### Option B: Manual Import (Phase 1)

Allow users to paste `.ics` file or iCal URL for read-only sync:
```typescript
// Periodic sync from public calendar URL
const icsUrl = user.publicCalendarUrl;
const events = await parseICS(icsUrl);
```

### 2. Database Schema

#### New Table: `calendar_events`

```sql
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,

  -- Event details
  external_id TEXT NOT NULL,              -- ID from Google/Apple
  calendar_source TEXT NOT NULL,          -- 'google' | 'apple' | 'caldav'

  title TEXT NOT NULL,
  description TEXT,
  location TEXT,

  -- Timing
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN DEFAULT false,
  timezone TEXT,

  -- Metadata
  event_type TEXT,                        -- 'meeting' | 'appointment' | 'deadline' | 'personal'
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,                   -- RRULE format

  -- Context for LLM
  ai_category TEXT,                       -- 'work' | 'personal' | 'health' | 'social'
  energy_level TEXT,                      -- 'high' | 'medium' | 'low' (inferred or user-set)
  importance TEXT,                        -- 'critical' | 'important' | 'optional'

  -- Sync tracking
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE,

  CONSTRAINT unique_external_event UNIQUE(user_id, external_id, calendar_source)
);

CREATE INDEX idx_calendar_events_user_time ON calendar_events(user_id, start_time);
CREATE INDEX idx_calendar_events_sync ON calendar_events(user_id, synced_at DESC);
```

#### New Table: `calendar_sync_log`

```sql
CREATE TABLE calendar_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,

  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  calendar_source TEXT NOT NULL,
  events_synced INTEGER,
  events_added INTEGER,
  events_updated INTEGER,
  events_deleted INTEGER,

  success BOOLEAN DEFAULT true,
  error_message TEXT
);
```

### 3. Sync Logic

#### Background Sync (Supabase Edge Function)

```typescript
// Triggered via cron job every 15 minutes
export async function syncCalendars() {
  const usersWithCalendar = await getUsersWithCalendarEnabled();

  for (const user of usersWithCalendar) {
    try {
      // Google Calendar
      if (user.google_calendar_token) {
        const events = await fetchGoogleCalendarEvents(user);
        await syncEventsToDatabase(user.id, 'google', events);
      }

      // Apple Calendar (CalDAV)
      if (user.caldav_url) {
        const events = await fetchCalDAVEvents(user);
        await syncEventsToDatabase(user.id, 'apple', events);
      }

      await logSync(user.id, 'success');
    } catch (error) {
      await logSync(user.id, 'error', error.message);
    }
  }
}

async function syncEventsToDatabase(userId: string, source: string, events: Event[]) {
  for (const event of events) {
    await supabase
      .from('calendar_events')
      .upsert({
        user_id: userId,
        external_id: event.id,
        calendar_source: source,
        title: event.summary,
        description: event.description,
        start_time: event.start.dateTime,
        end_time: event.end.dateTime,
        // ... other fields
      }, {
        onConflict: 'user_id,external_id,calendar_source'
      });
  }
}
```

### 4. Calendar Data in Revelation

#### Enhanced Context Collection

```typescript
async function collectRevelationContext(userId: string) {
  // ... existing context collection ...

  // Add calendar context
  const calendarContext = await getCalendarContext(userId);

  return {
    ...existingContext,
    calendar: calendarContext
  };
}

async function getCalendarContext(userId: string) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekEnd = addDays(now, 7);

  // Today's events
  const { data: todayEvents } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', userId)
    .gte('start_time', todayStart.toISOString())
    .lte('start_time', todayEnd.toISOString())
    .order('start_time');

  // This week's events
  const { data: weekEvents } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', userId)
    .gte('start_time', now.toISOString())
    .lte('start_time', weekEnd.toISOString())
    .order('start_time');

  // Calculate free time blocks today
  const freeBlocks = calculateFreeTimeBlocks(todayEvents, todayStart, todayEnd);

  return {
    todayEvents: todayEvents || [],
    weekEvents: weekEvents || [],
    freeBlocks,
    hasCalendarConnected: todayEvents !== null
  };
}

function calculateFreeTimeBlocks(events: Event[], dayStart: Date, dayEnd: Date) {
  // Working hours (e.g., 8am - 10pm)
  const workStart = setHours(dayStart, 8);
  const workEnd = setHours(dayEnd, 22);

  const blocks = [];
  let currentTime = workStart;

  for (const event of events) {
    const eventStart = new Date(event.start_time);
    const eventEnd = new Date(event.end_time);

    // If there's a gap before this event
    if (currentTime < eventStart) {
      const durationMinutes = (eventStart - currentTime) / 1000 / 60;
      if (durationMinutes >= 25) { // At least one Pomodoro
        blocks.push({
          start: currentTime,
          end: eventStart,
          durationMinutes,
          timeOfDay: getTimeOfDay(currentTime)
        });
      }
    }

    currentTime = eventEnd;
  }

  // Final block until work end
  if (currentTime < workEnd) {
    const durationMinutes = (workEnd - currentTime) / 1000 / 60;
    if (durationMinutes >= 25) {
      blocks.push({
        start: currentTime,
        end: workEnd,
        durationMinutes,
        timeOfDay: getTimeOfDay(currentTime)
      });
    }
  }

  return blocks;
}
```

#### Enhanced Prompt with Calendar

```
[Added to revelation prompt:]

YOUR REAL-WORLD SCHEDULE TODAY:

${calendar.hasCalendarConnected ? `
Calendar Events:
${calendar.todayEvents.map(e => `
- ${formatTime(e.start_time)} - ${formatTime(e.end_time)}: ${e.title}
  ${e.description ? `  Description: ${e.description}` : ''}
  ${e.location ? `  Location: ${e.location}` : ''}
  Category: ${e.ai_category || 'unknown'}
`).join('\n')}

Available Time Blocks:
${calendar.freeBlocks.map(block => `
- ${formatTime(block.start)} - ${formatTime(block.end)}: ${block.durationMinutes} minutes free (${block.timeOfDay})
`).join('\n')}

THIS WEEK'S UPCOMING COMMITMENTS:
${calendar.weekEvents.slice(0, 5).map(e => `
- ${formatDate(e.start_time)} at ${formatTime(e.start_time)}: ${e.title}
`).join('\n')}
` : 'No calendar connected. Planning without schedule constraints.'}

CRITICAL SCHEDULING GUIDELINES:
1. Recommend quests that FIT in available time blocks
2. Don't suggest 90-minute deep work if user only has 45 minutes free
3. Place energy-intensive tasks in morning blocks when possible
4. Leave buffer time before important meetings
5. If user has many meetings, suggest lighter, flexible tasks
6. Connect calendar events to their goals when relevant
```

### 5. UI Components

#### Calendar Connection Settings

```tsx
<div className="calendar-integration">
  <h3>🗓️ Connect Your Calendar</h3>
  <p>Let Revelation see your schedule for smarter planning</p>

  <div className="calendar-options">
    <button onClick={connectGoogleCalendar}>
      <img src="google-icon.svg" />
      Connect Google Calendar
    </button>

    <button onClick={connectAppleCalendar}>
      <img src="apple-icon.svg" />
      Connect Apple Calendar
    </button>
  </div>

  {user.calendar_sync_enabled && (
    <div className="sync-status">
      ✓ Calendar connected
      <p>Last synced: {formatRelativeTime(user.last_calendar_sync)}</p>
      <button onClick={manualSync}>Sync Now</button>
    </div>
  )}
</div>
```

#### Calendar View in Revelation Modal

```tsx
{calendar.todayEvents.length > 0 && (
  <div className="todays-schedule">
    <h4>📅 Your Schedule Today</h4>
    <div className="timeline">
      {calendar.todayEvents.map(event => (
        <div key={event.id} className="event-card">
          <span className="time">{formatTime(event.start_time)}</span>
          <span className="title">{event.title}</span>
        </div>
      ))}
    </div>

    <div className="free-blocks">
      <h5>⏰ Available Time</h5>
      {calendar.freeBlocks.map((block, i) => (
        <div key={i} className="free-block">
          {formatTime(block.start)} - {formatTime(block.end)}
          ({block.durationMinutes} min)
        </div>
      ))}
    </div>
  </div>
)}
```

---

## Part 2: MCP (Model Context Protocol) Integration

### Overview

Enable the LLM/agent to **autonomously query** any information it needs, rather than pre-loading everything. This makes Revelation truly intelligent and adaptive.

### What is MCP?

[Model Context Protocol](https://modelcontextprotocol.io/) is a standard that allows LLMs to:
- Query external data sources on-demand
- Use tools and APIs as needed
- Explore data dynamically based on reasoning
- Scale context beyond token limits

### Why This Matters

**Current approach**: Pre-load ALL data → send to LLM
- Limited by context window
- Sends unnecessary data
- Can't explore deeper when needed
- Static, not adaptive

**With MCP**: LLM queries what it needs
- "Show me tasks related to goal X"
- "What were my Pomodoros on days when streak was high?"
- "Find patterns in when I complete creative tasks"
- Dynamic, intelligent exploration

### Architecture

#### 1. MCP Server (Supabase Edge Function)

```typescript
// MCP-compliant server that exposes Revelation data
export async function mcpServer(req: Request) {
  const { method, params } = await req.json();

  const tools = {
    // Task queries
    'get_tasks': async ({ filter, limit }) => {
      return await getTasks(filter, limit);
    },

    // Goal queries
    'get_goals': async ({ type, active_only }) => {
      return await getGoals(type, active_only);
    },

    // Pomodoro analysis
    'analyze_pomodoros': async ({ date_range, group_by }) => {
      return await analyzePomodoros(date_range, group_by);
    },

    // Pattern detection
    'find_patterns': async ({ metric, timeframe }) => {
      return await findPatterns(metric, timeframe);
    },

    // Calendar queries
    'get_calendar_events': async ({ date_range, category }) => {
      return await getCalendarEvents(date_range, category);
    },

    // Daily summaries
    'get_daily_summaries': async ({ date_range }) => {
      return await getDailySummaries(date_range);
    },

    // Task relationships
    'get_task_dependencies': async ({ task_id }) => {
      return await getTaskDependencies(task_id);
    }
  };

  if (method === 'tools/list') {
    return toolsListResponse(tools);
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params;
    const result = await tools[name](args);
    return { result };
  }
}
```

#### 2. Tool Definitions

```typescript
const TOOL_DEFINITIONS = [
  {
    name: 'get_tasks',
    description: 'Query tasks with flexible filtering',
    parameters: {
      type: 'object',
      properties: {
        filter: {
          type: 'object',
          properties: {
            task_type: { type: 'string', enum: ['daily', 'onetime'] },
            is_completed: { type: 'boolean' },
            is_active: { type: 'boolean' },
            category: { type: 'string' },
            priority: { type: 'string' },
            has_deadline: { type: 'boolean' }
          }
        },
        limit: { type: 'number', default: 20 }
      }
    }
  },

  {
    name: 'analyze_pomodoros',
    description: 'Analyze Pomodoro completion patterns',
    parameters: {
      type: 'object',
      properties: {
        date_range: {
          type: 'object',
          properties: {
            start: { type: 'string', format: 'date' },
            end: { type: 'string', format: 'date' }
          }
        },
        group_by: {
          type: 'string',
          enum: ['day', 'task', 'category', 'time_of_day']
        }
      }
    }
  },

  {
    name: 'find_patterns',
    description: 'Detect patterns in productivity data',
    parameters: {
      type: 'object',
      properties: {
        metric: {
          type: 'string',
          enum: ['completion_rate', 'focus_score', 'energy_levels', 'task_timing']
        },
        timeframe: {
          type: 'string',
          enum: ['week', 'month', 'quarter']
        }
      }
    }
  },

  {
    name: 'get_calendar_events',
    description: 'Query calendar events with filtering',
    parameters: {
      type: 'object',
      properties: {
        date_range: {
          type: 'object',
          properties: {
            start: { type: 'string' },
            end: { type: 'string' }
          }
        },
        category: { type: 'string' },
        min_duration_minutes: { type: 'number' }
      }
    }
  }
];
```

#### 3. Agent-Driven Revelation

Instead of pre-loading all data, let the agent explore:

```typescript
// Revelation with MCP
async function generateRevelationWithMCP(userId: string, userMessage: string) {
  // Initial lightweight context
  const baseContext = {
    user_id: userId,
    user_message: userMessage,
    current_time: new Date().toISOString()
  };

  // Agent with MCP tools
  const agent = new AnthropicAgent({
    model: 'claude-opus-4',
    tools: MCP_TOOLS,
    systemPrompt: REVELATION_SYSTEM_PROMPT_WITH_MCP
  });

  // Agent autonomously explores data
  const revelation = await agent.run({
    messages: [
      {
        role: 'user',
        content: buildRevelationPromptWithMCP(baseContext)
      }
    ]
  });

  // Agent may have made multiple tool calls to explore:
  // - get_tasks({ is_active: true })
  // - analyze_pomodoros({ date_range: last_7_days, group_by: 'task' })
  // - find_patterns({ metric: 'completion_rate', timeframe: 'week' })
  // - get_calendar_events({ date_range: today })

  return revelation.finalResponse;
}
```

#### 4. Enhanced System Prompt for MCP

```
You are Revelation, a mystical Revelation with AUTONOMOUS ACCESS to the hero's entire journey.

You have tools to explore their data as deeply as needed. Don't just work with what's given -
actively investigate to provide the most insightful guidance.

AVAILABLE TOOLS:
- get_tasks: Query tasks with any filter
- analyze_pomodoros: Deep dive into work patterns
- find_patterns: Detect trends over time
- get_calendar_events: See real-world schedule
- get_daily_summaries: Review past chapters
- get_task_dependencies: Understand task relationships

EXPLORATION STRATEGY:
1. Start broad: what are their active goals and tasks?
2. Dig deeper based on what you find:
   - If struggling with task X, analyze when/how they work on it
   - If goal Y seems stuck, find related tasks and progress
   - If pattern emerges, investigate further
3. Cross-reference: connect tasks to calendar, goals to summaries
4. Synthesize: weave all findings into epic narrative

EXAMPLES OF AUTONOMOUS EXPLORATION:

If user says "Feeling stuck lately":
→ find_patterns({ metric: 'completion_rate', timeframe: 'month' })
→ analyze_pomodoros({ date_range: last_14_days, group_by: 'time_of_day' })
→ get_daily_summaries({ date_range: last_7_days })
→ Discover: completion drops on days with many meetings
→ Recommend: deep work in early morning before calendar fills up

If user has goal "Write research paper":
→ get_tasks({ category: 'study', is_active: true })
→ get_task_dependencies({ related_to: 'research paper' })
→ analyze_pomodoros({ filter: { category: 'study' }, group_by: 'day' })
→ get_calendar_events({ next_7_days: true })
→ Find: 3 free mornings this week, user most productive 9-11am
→ Recommend: specific writing sessions in those windows

Use your tools wisely. Explore until you have TRUE INSIGHT, not surface-level advice.
```

### 5. Benefits of MCP Integration

**1. Unlimited Context**
- Not constrained by token limits
- Can explore entire history if needed
- Fetch exactly what's relevant

**2. Dynamic Intelligence**
- Adapts exploration based on what it finds
- Can "follow threads" of investigation
- Makes connections you didn't pre-program

**3. Personalized Deep Dives**
- Different users need different data
- Agent explores user-specific patterns
- Tailors analysis to individual

**4. Efficient**
- Only loads data actually needed
- No wasted tokens on irrelevant info
- Faster, cheaper, more focused

**5. Future-Proof**
- Easy to add new data sources
- LLM can use new tools immediately
- Scales as data grows

---

## Part 3: Combined Power - Calendar + MCP

### The Dream Scenario

User: "I'm feeling overwhelmed this week"

**Agent's autonomous exploration:**

```typescript
// 1. Check calendar
const events = await get_calendar_events({
  date_range: { start: 'today', end: '+7days' }
});
// Finds: 15 meetings scheduled, many back-to-back

// 2. Analyze recent performance
const patterns = await find_patterns({
  metric: 'completion_rate',
  timeframe: 'month'
});
// Finds: completion drops on days with 5+ meetings

// 3. Get current tasks
const tasks = await get_tasks({
  is_active: true,
  priority: 'high'
});
// Finds: 3 high-priority tasks, all requiring deep work

// 4. Check daily summaries
const summaries = await get_daily_summaries({
  date_range: 'last_7_days'
});
// Finds: "Struggling with fragmented time" noted 3 times

// 5. Calculate free blocks
const freeTime = await get_calendar_free_blocks({
  date_range: { start: 'today', end: '+7days' },
  min_duration_minutes: 60
});
// Finds: Only 2 blocks of 90+ minutes this week
```

**Agent's revelation:**

```
Brave hero, I have witnessed your challenge. Your calendar reveals a siege -
15 meetings in 7 days, fragmenting your time like shattered glass.

Your legend shows a pattern: when meetings exceed 5 per day, your completion
rate falls by 60%. This week threatens that threshold.

Yet hope remains. I have found two sacred windows:
- Tomorrow, 6:00-7:30am (before the storm)
- Friday, 1:00-3:00pm (the eye of the hurricane)

YOUR QUEST: Use tomorrow's dawn to slay the Dragon of Analysis (High Priority Task #1).
This is not mere work - this is claiming victory before chaos can take it from you.

THE PATH:
Morning: 6:00am - Deep work on Analysis
        8:30am - Meeting siege begins, but your dragon is slain
Afternoon: Navigate meetings with lightness, as you've won the day
Evening: Rest, knowing progress was made

Friday's window is yours for the Ancient Texts (Study Task #2).

This week, you don't conquer all - you conquer what matters, when time allows.
That is wisdom. That is the hero's true strength.
```

## Database Additions Summary

```sql
-- Calendar integration
CREATE TABLE calendar_events (...);
CREATE TABLE calendar_sync_log (...);

ALTER TABLE user_profiles ADD COLUMN google_calendar_token TEXT;
ALTER TABLE user_profiles ADD COLUMN google_calendar_refresh_token TEXT;
ALTER TABLE user_profiles ADD COLUMN caldav_url TEXT;
ALTER TABLE user_profiles ADD COLUMN calendar_sync_enabled BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN last_calendar_sync TIMESTAMP WITH TIME ZONE;

-- MCP tool usage tracking (optional)
CREATE TABLE mcp_tool_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  revelation_id UUID REFERENCES revelation_plans(id),
  tool_name TEXT NOT NULL,
  parameters JSONB,
  result_summary TEXT,
  called_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Conclusion

These future enhancements transform Revelation from a static advisor into an **autonomous, context-aware Revelation** that:

### Calendar Integration Provides:
✅ Reality-based planning (respects actual schedule)
✅ Smart time block allocation
✅ Energy-aware task placement
✅ Buffer time before important events
✅ Connection between calendar and goals

### MCP Integration Provides:
✅ Unlimited context exploration
✅ Dynamic, adaptive intelligence
✅ Personalized deep dives
✅ Pattern discovery across all data
✅ Future-proof extensibility

### Combined Power:
🔮 **"I see your entire life - past, present, and scheduled future"**
🎯 **"I explore your patterns until I find true insight"**
⚡ **"I give you THE quest that fits your reality"**
🌟 **"Your legend unfolds with perfect knowledge and timing"**

This is the ultimate re-enchantment: an Revelation that truly sees you, understands your journey, and guides you with both wisdom and knowledge of your real-world constraints.

The mundane becomes magnificent because the guidance is both **epic and practical**.
