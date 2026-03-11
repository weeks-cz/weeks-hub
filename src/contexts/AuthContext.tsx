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
    };

    // Primary auth check — getUser() guarantees a server-validated result
    // Add timeout to prevent infinite loading if network is slow
    const authPromise = supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (ignore) return;
      setSupabaseUser(authUser);
      if (authUser) {
        await fetchProfile(authUser);
      }
      if (!ignore) setLoading(false);
    });

    // Fallback: if getUser() takes more than 5s, try getSession() (local, no network)
    const timeout = setTimeout(async () => {
      if (ignore) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (ignore) return;
      if (session?.user) {
        setSupabaseUser(session.user);
        await fetchProfile(session.user);
      }
      setLoading(false);
    }, 5000);

    authPromise.finally(() => clearTimeout(timeout));

    // Listen for subsequent auth changes (sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (ignore) return;
        // Skip INITIAL_SESSION — already handled by getUser() above
        if (event === 'INITIAL_SESSION') return;
        setSupabaseUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user);
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      ignore = true;
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
