'use client';

import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

/**
 * AuthGuard ensures no authenticated content renders in a broken state.
 *
 * - While loading: full-page spinner (with "Connecting..." hint after 4s)
 * - Auth resolved with user: render children
 * - Auth resolved WITHOUT user (token refresh failed, multi-tab race,
 *   session expired): redirect to login instead of showing empty dashboard
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { supabaseUser, loading } = useAuth();
  const [showHint, setShowHint] = useState(false);

  // Show "Connecting..." hint if loading takes more than 4 seconds
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setShowHint(true), 4000);
    return () => clearTimeout(timer);
  }, [loading]);

  // Redirect to login if auth resolved with no valid session
  useEffect(() => {
    if (!loading && !supabaseUser) {
      window.location.href = '/auth/login';
    }
  }, [loading, supabaseUser]);

  if (loading || !supabaseUser) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center gap-4">
        <LoadingSpinner size="lg" />
        {showHint && (
          <p className="text-sm text-[var(--text-muted)] animate-fade-in">
            Připojuji se k serveru...
          </p>
        )}
      </div>
    );
  }

  return <>{children}</>;
}

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <AuthProvider>
      <AuthGuard>
        <div className="min-h-screen bg-[var(--bg-primary)]">
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-default)',
                borderRadius: '12px',
                fontSize: '14px',
              },
              success: {
                iconTheme: { primary: 'var(--color-success)', secondary: 'white' },
              },
              error: {
                iconTheme: { primary: 'var(--color-error)', secondary: 'white' },
              },
            }}
          />
          <Sidebar />
          <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

          <div className="lg:ml-[260px] print:ml-0">
            <Header onMenuToggle={() => setMobileNavOpen(true)} />
            <main className="p-4 lg:p-6 print:p-0">
              {children}
            </main>
          </div>
        </div>
      </AuthGuard>
    </AuthProvider>
  );
}
