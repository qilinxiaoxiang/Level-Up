interface LLMProvider {
  baseUrl: string;
  apiKey: string;
  model: string;
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const providers: Record<string, LLMProvider> = {
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    apiKey: Deno.env.get('DEEPSEEK_API_KEY') || '',
    model: 'deepseek-chat',
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: Deno.env.get('OPENAI_API_KEY') || '',
    model: 'gpt-4o-mini',
  },
};

export async function callLLM(
  messages: Message[],
  provider: 'deepseek' | 'openai' = 'deepseek'
): Promise<string> {
  const config = providers[provider];

  if (!config.apiKey) {
    throw new Error(`${provider.toUpperCase()}_API_KEY environment variable not set`);
  }

  console.log(`Calling ${provider} API with model ${config.model}`);

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`LLM API error (${response.status}):`, errorText);
    throw new Error(`LLM API request failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid response format from LLM API');
  }

  const revelation = data.choices[0].message.content;
  console.log(`Received revelation (${revelation.length} chars)`);

  return revelation;
}
