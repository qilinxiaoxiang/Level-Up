# Supabase Edge Functions

This directory contains Supabase Edge Functions for the Revelation application.

## Functions

### `revelation`
AI-powered daily planning assistant that provides personalized guidance based on user's goals, tasks, and performance.

**Features:**
- Analyzes user's goals (3-year, 1-year, 1-month)
- Reviews active and paused tasks
- Evaluates recent performance (last 7 days)
- Considers temporal context (time of day, day of week)
- Accepts optional user message for personalized guidance
- Supports both DeepSeek and OpenAI LLMs

## Setup & Deployment

### 1. Link to Your Supabase Project

```bash
cd /Users/xiangzheng/code/Level-Up
supabase link --project-ref mcizaldoxrxgbpbbeytp
```

### 2. Set Environment Variables

You need to set the API keys as secrets in Supabase:

```bash
# Set DeepSeek API key
supabase secrets set DEEPSEEK_API_KEY=your_deepseek_api_key_here

# (Optional) Set OpenAI API key if you want to use GPT models
supabase secrets set OPENAI_API_KEY=your_openai_api_key_here
```

**Note:** Supabase automatically provides `SUPABASE_URL` and `SUPABASE_ANON_KEY` to Edge Functions, so you don't need to set those manually.

### 3. Deploy the Function

```bash
# Deploy the revelation function
supabase functions deploy revelation

# Or deploy all functions
supabase functions deploy
```

### 4. Verify Deployment

```bash
# Check function logs
supabase functions logs revelation

# Test the function (requires authentication token)
supabase functions invoke revelation --body '{"systemPrompt":"You are Revelation.","userPrompt":"# Current Status\n\n## Time\n- Current local time: 9:00 AM\n"}'
```

## Local Development

### 1. Start Local Supabase

```bash
# Install Supabase CLI if not already installed
brew install supabase/tap/supabase

# Start local Supabase (optional, for full local dev)
supabase start
```

### 2. Run Function Locally

```bash
# Create local .env file
cp supabase/functions/.env.example supabase/functions/.env

# Edit .env and add your API keys
# Then serve the function locally
supabase functions serve revelation --env-file supabase/functions/.env
```

### 3. Test Locally

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/revelation' \
  --header 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"systemPrompt":"You are Revelation.","userPrompt":"# Current Status\n\n## Time\n- Current local time: 9:00 AM\n"}'
```

## Usage from Frontend

The frontend integration is already set up in `frontend/src/hooks/useRevelation.ts`.

Example usage:

```typescript
import { useRevelation } from '../hooks/useRevelation';

function MyComponent() {
  const { revelation, loading, error, getRevelation } = useRevelation();

  const handleClick = async () => {
    await getRevelation("I'm feeling tired today");
  };

  return (
    <div>
      <button onClick={handleClick} disabled={loading}>
        Get Revelation
      </button>
      {revelation && <p>{revelation}</p>}
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

## API Reference

### POST /revelation

**Request Body:**
```json
{
  "systemPrompt": "Required system prompt",
  "userPrompt": "Required user prompt",
  "provider": "deepseek" // or "openai"
}
```

**Response:**
```json
{
  "success": true,
  "revelation": "Your AI-generated revelation text...",
  "systemPrompt": "Echoed system prompt",
  "userPrompt": "Echoed user prompt",
  "suggestionType": "revelation"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

## Switching Between DeepSeek and OpenAI

To switch LLM providers, simply pass the `provider` parameter:

```typescript
// Use DeepSeek (default, cheaper)
await getRevelation("message", "deepseek");

// Use OpenAI (more expensive, potentially higher quality)
await getRevelation("message", "openai");
```

## Cost Considerations

- **DeepSeek**: ~$0.14 per 1M input tokens, ~$0.28 per 1M output tokens (~40x cheaper than GPT-4)
- **OpenAI GPT-4o-mini**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- **OpenAI GPT-4o**: ~$2.50 per 1M input tokens, ~$10 per 1M output tokens

For most users, DeepSeek is recommended as the default provider.

## Troubleshooting

### Function returns 401 Unauthorized
- Make sure you're passing a valid authentication token
- Check that the user is properly authenticated in the frontend

### Function returns "API key not set"
- Verify secrets are set: `supabase secrets list`
- Re-deploy the function after setting secrets

### Function times out
- Check function logs: `supabase functions logs revelation`
- LLM API might be slow; consider increasing timeout or using a faster model

### CORS errors
- CORS is configured in `_shared/cors.ts`
- Make sure the function is deployed properly
