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
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      if (!ignore) {
        setUser(profile);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (ignore) return;
        setSupabaseUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user);
        } else {
          setUser(null);
        }
        setLoading(false);
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
