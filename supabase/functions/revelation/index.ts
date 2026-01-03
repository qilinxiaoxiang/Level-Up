import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
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
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
