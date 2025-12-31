# Revelation: Future Enhancements

## Vision: The Autonomous Oracle

Transform Revelation from a guided advisor into an **autonomous oracle** that:
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
// MCP-compliant server that exposes Level-Up data
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
You are Revelation, a mystical oracle with AUTONOMOUS ACCESS to the hero's entire journey.

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

### Implementation Priority

**Phase 1: Calendar MVP (3-4 weeks)**
- Google Calendar OAuth integration
- Basic event sync
- Free time block calculation
- Enhanced prompt with calendar context

**Phase 2: Calendar Advanced (2 weeks)**
- Apple Calendar support
- Event categorization (AI-powered)
- Energy level inference
- Week-view planning

**Phase 3: MCP Foundation (3 weeks)**
- Build MCP server
- Implement core tools (tasks, goals, pomodoros)
- Test with Claude Opus 4
- Basic agent exploration

**Phase 4: MCP Advanced (3-4 weeks)**
- Pattern detection tools
- Cross-referencing tools
- Agentic revelation generation
- Performance optimization

**Phase 5: Integration (2 weeks)**
- Calendar + MCP combined
- Smart caching strategies
- UI polish
- User testing

---

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

These future enhancements transform Revelation from a static advisor into an **autonomous, context-aware oracle** that:

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

This is the ultimate re-enchantment: an oracle that truly sees you, understands your journey, and guides you with both wisdom and knowledge of your real-world constraints.

The mundane becomes magnificent because the guidance is both **epic and practical**.
