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

  useEffect(() => {
    let ignore = false;
    let loadingResolved = false;

    // Guarantees loading becomes false — can be called multiple times safely
    const resolveLoading = () => {
      if (!loadingResolved && !ignore) {
        loadingResolved = true;
        setLoading(false);
      }
    };

    const fetchProfile = async (authUser: SupabaseUser) => {
      try {
        let { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        // Safety net: if profile doesn't exist (e.g. trigger failed for magic link user), create it
        if (!profile && authUser.email) {
          const { data: newProfile } = await supabase
            .from('users')
            .insert({
              id: authUser.id,
              email: authUser.email,
              full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
              avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || '',
            })
            .select()
            .single();
          profile = newProfile;
        }

        if (!ignore) {
          setUser(profile);
        }
      } catch {
        // Profile fetch failed — auth still works, profile will load on next attempt
      }
    };

    // Primary: getUser() validates the session server-side.
    // We race it against a timeout so a slow token refresh can't block the UI.
    const init = async () => {
      let authUser: SupabaseUser | null = null;

      try {
        const { data } = await Promise.race([
          supabase.auth.getUser(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('auth_timeout')), 3000)
          ),
        ]);
        authUser = data.user;
      } catch {
        // getUser() timed out or failed — not fatal, we continue
      }

      if (ignore) return;
      setSupabaseUser(authUser);

      if (authUser) {
        // Try to fetch profile quickly (with its own timeout)
        try {
          await Promise.race([
            fetchProfile(authUser),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('profile_timeout')), 2000)
            ),
          ]);
        } catch {
          // Profile timed out — it will load in background via onAuthStateChange
        }
      }

      resolveLoading();
    };

    init();

    // Hard timeout: absolute guarantee against infinite loading.
    // Even if init() somehow hangs, this fires independently.
    const hardTimeout = setTimeout(resolveLoading, 5000);

    // Listen for ALL auth state changes including initial session.
    // This catches cases where getUser() timed out but auth resolves later
    // (e.g. after a slow token refresh completes).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (ignore) return;

        setSupabaseUser(session?.user ?? null);
        resolveLoading();

        if (session?.user) {
          await fetchProfile(session.user);
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      ignore = true;
      clearTimeout(hardTimeout);
      subscription.unsubscribe();
    };
  }, []);

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
