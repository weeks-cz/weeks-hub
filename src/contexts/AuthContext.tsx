'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/types/database';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextValue {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  supabaseUser: null,
  loading: true,
  signOut: async () => {},
  updateUser: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // ── Step 1: Auth state listener ─────────────────────────────────
  // CRITICAL: The callback must be SYNCHRONOUS (no Supabase queries).
  // The Supabase client holds an internal auth lock while processing
  // onAuthStateChange events. Any query inside the callback calls
  // getSession() to get the current token, which waits for that same
  // lock → deadlock. The callback never finishes, the lock is never
  // released, and ALL subsequent queries (including hooks) hang forever.
  useEffect(() => {
    let ignore = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (ignore) return;

        // Only update React state — NO Supabase queries here!
        setSupabaseUser(session?.user ?? null);

        if (!session?.user) {
          setUser(null);
          setLoading(false);
        }
        // When session.user exists, loading stays true until the
        // profile is fetched in the separate effect below.
      }
    );

    // Hard timeout: if onAuthStateChange never fires (network failure,
    // Supabase outage), force loading to resolve. AuthGuard will
    // redirect to login since supabaseUser is still null.
    const timeout = setTimeout(() => {
      if (!ignore) setLoading(false);
    }, 15000);

    return () => {
      ignore = true;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  // ── Step 2: Profile fetch (separate from auth callback) ─────────
  // Runs AFTER the auth lock is released, so queries execute normally.
  // Triggers when supabaseUser.id changes (initial login, user switch).
  // Does NOT re-trigger on TOKEN_REFRESHED (same id, different token).
  useEffect(() => {
    if (!supabaseUser) return;
    let ignore = false;

    const fetchProfile = async () => {
      try {
        let { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();

        // Safety net: create profile if trigger didn't fire (magic link edge case)
        if (!profile && supabaseUser.email) {
          const { data: newProfile } = await supabase
            .from('users')
            .insert({
              id: supabaseUser.id,
              email: supabaseUser.email,
              full_name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || '',
              avatar_url: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture || '',
            })
            .select()
            .single();
          profile = newProfile;
        }

        if (!ignore) setUser(profile);
      } catch {
        // Profile fetch failed — user will see fallback name
      } finally {
        // ALWAYS resolve loading, even if profile fetch fails
        if (!ignore) setLoading(false);
      }
    };

    fetchProfile();

    return () => { ignore = true; };
  }, [supabaseUser?.id]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
    window.location.href = '/auth/login';
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => prev ? { ...prev, ...updates } : prev);
  };

  return (
    <AuthContext.Provider value={{ user, supabaseUser, loading, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
