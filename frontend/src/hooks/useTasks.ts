import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/useUserStore';
import type { Task, TaskCategory, TaskPriority, TaskType } from '../types';

export interface TaskInput {
  title: string;
  description?: string;
  category?: TaskCategory | null;
  priority: TaskPriority;
  task_type: TaskType;
  target_duration_minutes?: number | null;
  deadline?: string | null;
  estimated_pomodoros?: number | null;
  estimated_minutes?: number | null;
  gold_reward?: number;
  xp_reward?: number;
  completed_pomodoros?: number;
  completed_minutes?: number;
  is_completed?: boolean;
  completed_at?: string | null;
  is_active?: boolean;
  is_archived?: boolean;
  archived_at?: string | null;
}

interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  createTask: (input: TaskInput) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<TaskInput>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleTaskActive: (taskId: string, isActive: boolean) => Promise<void>;
}

export function useTasks(): UseTasksReturn {
  const { user } = useUserStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    if (!user) {
      setTasks([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (input: TaskInput) => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      const payload = {
        user_id: user.id,
        title: input.title,
        description: input.description || null,
        category: input.category || null,
        priority: input.priority,
        task_type: input.task_type,
        target_duration_minutes: input.target_duration_minutes ?? null,
        deadline: input.deadline ?? null,
        estimated_pomodoros: input.estimated_pomodoros ?? null,
        estimated_minutes: input.estimated_minutes ?? null,
        gold_reward: input.gold_reward ?? 10,
        xp_reward: input.xp_reward ?? 20,
        is_active: true,
        is_completed: false,
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      setTasks((prev) => [data, ...prev]);
    } catch (err) {
      console.error('Error creating task:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (taskId: string, updates: Partial<TaskInput>) => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.description !== undefined) payload.description = updates.description ?? null;
      if (updates.category !== undefined) payload.category = updates.category ?? null;
      if (updates.priority !== undefined) payload.priority = updates.priority;
      if (updates.task_type !== undefined) payload.task_type = updates.task_type;
      if (updates.target_duration_minutes !== undefined) {
        payload.target_duration_minutes = updates.target_duration_minutes ?? null;
      }
      if (updates.deadline !== undefined) payload.deadline = updates.deadline ?? null;
      if (updates.estimated_pomodoros !== undefined) {
        payload.estimated_pomodoros = updates.estimated_pomodoros ?? null;
      }
      if (updates.estimated_minutes !== undefined) {
        payload.estimated_minutes = updates.estimated_minutes ?? null;
      }
      if (updates.gold_reward !== undefined) payload.gold_reward = updates.gold_reward;
      if (updates.xp_reward !== undefined) payload.xp_reward = updates.xp_reward;
      if (updates.completed_pomodoros !== undefined) {
        payload.completed_pomodoros = updates.completed_pomodoros;
      }
      if (updates.completed_minutes !== undefined) {
        payload.completed_minutes = updates.completed_minutes;
      }
      if (updates.is_completed !== undefined) payload.is_completed = updates.is_completed;
      if (updates.completed_at !== undefined) payload.completed_at = updates.completed_at;
      if (updates.is_active !== undefined) payload.is_active = updates.is_active;
      if (updates.is_archived !== undefined) payload.is_archived = updates.is_archived;
      if (updates.archived_at !== undefined) payload.archived_at = updates.archived_at;

      const { data, error } = await supabase
        .from('tasks')
        .update(payload)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      setTasks((prev) => prev.map((task) => (task.id === taskId ? data : task)));
    } catch (err) {
      console.error('Error updating task:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;

      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskActive = async (taskId: string, isActive: boolean) => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      setTasks((prev) => prev.map((task) => (task.id === taskId ? data : task)));
    } catch (err) {
      console.error('Error toggling task:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskActive,
  };
}
