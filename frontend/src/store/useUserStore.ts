import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types';
import type { User } from '@supabase/supabase-js';

interface UserState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  authChecked: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setAuthChecked: (checked: boolean) => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  profile: null,
  loading: false,
  error: null,
  authChecked: false,

  setUser: (user) => set({ user }),

  setProfile: (profile) => set({ profile }),

  setAuthChecked: (authChecked) => set({ authChecked }),

  fetchProfile: async () => {
    const { user } = get();
    if (!user) {
      set({ profile: null });
      return;
    }

    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      set({ profile: data, loading: false });
    } catch (error) {
      console.error('Error fetching profile:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  updateProfile: async (updates) => {
    const { user, profile } = get();
    if (!user || !profile) return;

    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      set({ profile: data, loading: false });
    } catch (error) {
      console.error('Error updating profile:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({ user: null, profile: null });
    } catch (error) {
      console.error('Error signing out:', error);
      set({ error: (error as Error).message });
    }
  },
}));
