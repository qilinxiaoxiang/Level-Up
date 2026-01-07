import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { callLLM } from './llm-client.ts';
import { generateRevelationPrompt } from './prompt-generator.ts';
import { generateTaskSuggestionPrompt } from './task-suggestion-prompt.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body - now accepting context instead of prompts
    const { context, provider = 'deepseek', suggestionType = 'revelation' } = await req.json();

    if (!context) {
      throw new Error('Missing context');
    }

    // Generate prompts based on suggestion type
    console.log('Generating prompts from context...');
    const { systemPrompt, userPrompt } = suggestionType === 'next_task'
      ? generateTaskSuggestionPrompt(context)
      : generateRevelationPrompt(context);

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
