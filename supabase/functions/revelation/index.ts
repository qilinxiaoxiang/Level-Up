import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { callLLM } from './llm-client.ts';
import { collectRevelationContext } from './context-collector.ts';
import { generateRevelationPrompt } from './prompt-generator.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase client with user's auth token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body for optional user message
    const { userMessage, provider = 'deepseek' } = await req.json().catch(() => ({}));

    // Collect all context data
    console.log('Collecting revelation context for user:', user.id);
    const context = await collectRevelationContext(supabase, user.id, userMessage);

    // Generate the LLM prompt
    console.log('Generating revelation prompt');
    const { systemPrompt, userPrompt } = generateRevelationPrompt(context);

    // Call LLM
    console.log('Calling LLM with provider:', provider);
    const revelation = await callLLM(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      provider
    );

    // Save revelation to database
    const { error: saveError } = await supabase.from('revelations').insert({
      user_id: user.id,
      user_message: userMessage || null,
      provider,
      revelation_text: revelation,
      context_snapshot: {
        timestamp: context.temporal.currentTime,
        timeOfDay: context.temporal.timeOfDay,
        streak: context.performance.streak.current,
        tasksCompleted: context.tasks.daily.todayProgress.filter((t) => t.isDone).length,
        totalDailyTasks: context.tasks.daily.todayProgress.length,
      },
    });

    if (saveError) {
      console.error('Error saving revelation:', saveError);
      // Don't fail the request if saving fails
    }

    // Return the revelation
    return new Response(
      JSON.stringify({
        success: true,
        revelation,
        context: {
          timestamp: context.temporal.currentTime,
          timeOfDay: context.temporal.timeOfDay,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Revelation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';

    console.error('Error details:', { errorMessage, errorStack });

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: errorStack,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
