import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { callLLM } from './llm-client.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body - now accepting prompts instead of context
    const { systemPrompt, userPrompt, provider = 'deepseek', suggestionType = 'revelation' } = await req.json();

    if (!systemPrompt || !userPrompt) {
      throw new Error('Missing systemPrompt or userPrompt');
    }

    // Call LLM
    console.log('Calling LLM with provider:', provider);
    const response = await callLLM(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      provider
    );

    // Return response with prompts for debugging (both types)
    return new Response(
      JSON.stringify({
        success: true,
        revelation: response,
        systemPrompt,
        userPrompt,
        suggestionType,
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
