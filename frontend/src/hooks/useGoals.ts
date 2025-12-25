import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/useUserStore';
import type { Goal, GoalType } from '../types';

interface UseGoalsReturn {
  goals: Goal[];
  loading: boolean;
  error: string | null;
  hasAllGoals: boolean;
  missingGoalTypes: GoalType[];
  fetchGoals: () => Promise<void>;
  createGoal: (goalType: GoalType, description: string) => Promise<void>;
  updateGoal: (goalId: string, description: string) => Promise<void>;
}

/**
 * Hook for managing user goals
 * - Fetches active goals
 * - Checks if user has all required goal types
 * - Creates and updates goals
 */
export function useGoals(): UseGoalsReturn {
  const { user } = useUserStore();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate target date based on goal type
  const calculateTargetDate = (goalType: GoalType): string => {
    const now = new Date();

    switch (goalType) {
      case '3year':
        now.setFullYear(now.getFullYear() + 3);
        break;
      case '1year':
        now.setFullYear(now.getFullYear() + 1);
        break;
      case '1month':
        now.setMonth(now.getMonth() + 1);
        break;
    }

    return now.toISOString();
  };

  // Fetch active goals
  const fetchGoals = async () => {
    if (!user) {
      setGoals([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setGoals(data || []);
    } catch (err) {
      console.error('Error fetching goals:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Create a new goal
  const createGoal = async (goalType: GoalType, description: string) => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      const targetDate = calculateTargetDate(goalType);

      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          goal_type: goalType,
          description,
          target_date: targetDate,
          is_active: true,
          is_completed: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setGoals((prev) => [...prev, data]);
    } catch (err) {
      console.error('Error creating goal:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing goal
  const updateGoal = async (goalId: string, description: string) => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('goals')
        .update({
          description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', goalId)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setGoals((prev) =>
        prev.map((goal) => (goal.id === goalId ? data : goal))
      );
    } catch (err) {
      console.error('Error updating goal:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Check which goal types are missing
  const allGoalTypes: GoalType[] = ['3year', '1year', '1month'];
  const existingGoalTypes = goals.map((goal) => goal.goal_type);
  const missingGoalTypes = allGoalTypes.filter(
    (type) => !existingGoalTypes.includes(type)
  );
  const hasAllGoals = missingGoalTypes.length === 0;

  // Fetch goals on mount and when user changes
  useEffect(() => {
    fetchGoals();
  }, [user]);

  return {
    goals,
    loading,
    error,
    hasAllGoals,
    missingGoalTypes,
    fetchGoals,
    createGoal,
    updateGoal,
  };
}
