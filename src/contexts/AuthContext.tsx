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

    // onAuthStateChange is the SOLE mechanism for resolving auth state.
    //
    // Why NOT getUser() or getSession():
    //   Both go through the Supabase client's internal token refresh lock.
    //   If the access token is expired, the client starts a refresh.
    //   ALL calls through the client (getUser, getSession, queries) are
    //   serialized behind this lock. Racing with a timeout just creates
    //   a broken state where loading resolves but data isn't available.
    //
    // onAuthStateChange fires INITIAL_SESSION after the lock resolves,
    // guaranteeing we get a valid session (or null if truly expired).
    // We wait for this event — the loading spinner shows in the meantime.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (ignore) return;

        const authUser = session?.user ?? null;
        setSupabaseUser(authUser);

        if (authUser) {
          // Fetch profile BEFORE resolving loading so the UI never
          // flashes with "Ahoj, tam" (null user).
          await fetchProfile(authUser);
        } else {
          setUser(null);
        }

        if (!ignore) setLoading(false);
      }
    );

    // Hard timeout: absolute safety net. If onAuthStateChange never fires
    // (network failure, Supabase outage, client bug), force loading to
    // resolve after 15s. The AuthGuard in the layout will then redirect
    // to login since supabaseUser is still null.
    const timeout = setTimeout(() => {
      if (!ignore) setLoading(false);
    }, 15000);

    return () => {
      ignore = true;
      clearTimeout(timeout);
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
