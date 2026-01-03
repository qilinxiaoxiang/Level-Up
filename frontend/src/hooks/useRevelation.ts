import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface RevelationResponse {
  success: boolean;
  revelation?: string;
  context?: {
    timestamp: string;
    timeOfDay: string;
  };
  error?: string;
}

export function useRevelation() {
  const [revelation, setRevelation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRevelation = async (userMessage?: string, provider: 'deepseek' | 'openai' = 'deepseek') => {
    setLoading(true);
    setError(null);

    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      // Call the Edge Function
      const { data, error: functionError } = await supabase.functions.invoke('revelation', {
        body: { userMessage, provider },
      });

      if (functionError) {
        throw functionError;
      }

      const response = data as RevelationResponse;

      if (!response.success) {
        throw new Error(response.error || 'Failed to get revelation');
      }

      setRevelation(response.revelation || null);
      return response.revelation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Revelation error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const clearRevelation = () => {
    setRevelation(null);
    setError(null);
  };

  return {
    revelation,
    loading,
    error,
    getRevelation,
    clearRevelation,
  };
}
