import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { callLLM } from './llm-client.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { systemPrompt, userPrompt, provider = 'deepseek' } = await req.json();

    if (!systemPrompt || !userPrompt) {
      throw new Error('Missing systemPrompt or userPrompt');
    }

    // Call LLM - this is the ONLY job of this Edge Function
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
