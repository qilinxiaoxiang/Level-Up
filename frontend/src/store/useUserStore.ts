import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types';
import type { User } from '@supabase/supabase-js';
import {
  getLocalDateString,
  getLocalDayDiff,
  parseDailyResetTimeToMinutes,
  setDayCutOffsetMinutes,
  setTimezoneName,
} from '../utils/dateUtils';

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

      if (data?.timezone_name) {
        setTimezoneName(data.timezone_name);
      } else {
        setTimezoneName('Asia/Shanghai');
      }

      if (data?.daily_reset_time) {
        setDayCutOffsetMinutes(parseDailyResetTimeToMinutes(data.daily_reset_time));
      } else {
        setDayCutOffsetMinutes(0);
      }

      const { data: checkIns } = await supabase
        .from('daily_check_ins')
        .select('date')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(365);

      const dates = (checkIns || []).map((row) => row.date);
      const dateSet = new Set(dates);
      const today = getLocalDateString();
      const addDaysToDateString = (dateString: string, deltaDays: number) => {
        const [year, month, day] = dateString.split('-').map(Number);
        const baseUtc = Date.UTC(year, month - 1, day + deltaDays);
        const next = new Date(baseUtc);
        const nextYear = next.getUTCFullYear();
        const nextMonth = String(next.getUTCMonth() + 1).padStart(2, '0');
        const nextDay = String(next.getUTCDate()).padStart(2, '0');
        return `${nextYear}-${nextMonth}-${nextDay}`;
      };

      const latestCheckInDate = dates[0] || null;
      let recalculatedStreak = 0;
      let cursor = latestCheckInDate;
      while (cursor && dateSet.has(cursor)) {
        recalculatedStreak++;
        cursor = addDaysToDateString(cursor, -1);
      }

      const shouldUpdateStreak =
        (data?.current_streak || 0) !== recalculatedStreak ||
        (data?.last_streak_date || null) !== latestCheckInDate;

      if (shouldUpdateStreak) {
        const { data: updated, error: updateError } = await supabase
          .from('user_profiles')
          .update({
            current_streak: recalculatedStreak,
            last_streak_date: latestCheckInDate,
          })
          .eq('id', user.id)
          .select()
          .single();

        if (updateError) throw updateError;
        set({ profile: updated, loading: false });
        return;
      }

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

      if (data?.timezone_name) {
        setTimezoneName(data.timezone_name);
      }

      if (data?.daily_reset_time) {
        setDayCutOffsetMinutes(parseDailyResetTimeToMinutes(data.daily_reset_time));
      }
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
