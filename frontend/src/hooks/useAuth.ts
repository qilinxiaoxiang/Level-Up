import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/useUserStore';

/**
 * Authentication hook that manages user session
 * - Auto-login on page load
 * - Listens for auth state changes
 * - Fetches user profile after login
 */
export function useAuth() {
  const { user, profile, loading, authChecked, setUser, setAuthChecked, fetchProfile, signOut } = useUserStore();

  useEffect(() => {
    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile();
      }
      setAuthChecked(true);
    });

    // Listen for auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile();
      } else {
        useUserStore.getState().setProfile(null);
      }
    });

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, [setUser, setAuthChecked, fetchProfile]);

  return {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    authChecked,
    signOut,
  };
}
