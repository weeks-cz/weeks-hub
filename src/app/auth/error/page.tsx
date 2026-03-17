'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, Info } from 'lucide-react';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ErrorInfo {
  title: string;
  message: string;
  showGoogleTip?: boolean;
}

const ERROR_MESSAGES: Record<string, ErrorInfo> = {
  invalid_domain: {
    title: 'Nepovolený účet',
    message: 'Přihlášení je povoleno pouze pro @weeks.cz emaily. Použij prosím svůj firemní účet.',
  },
  invalid_email: {
    title: 'Neplatný email',
    message: 'Zadaný email není @weeks.cz adresa. Přihlášení je povoleno pouze pro firemní emaily.',
  },
  magic_link_failed: {
    title: 'Přihlašovací odkaz nefunguje',
    message: 'Odkaz je neplatný nebo vypršel. Pokud máš aplikaci nainstalovanou na ploše (PWA), odkaz se otevře v jiném prohlížeči a přihlášení selže.',
    showGoogleTip: true,
  },
  auth_failed: {
    title: 'Přihlášení selhalo',
    message: 'Něco se pokazilo při přihlašování. Zkus to prosím znovu.',
  },
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get('error') ?? 'auth_failed';
  const error = ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.auth_failed;

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          hd: 'weeks.cz',
        },
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="w-full max-w-md px-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-error)]/10 mb-6">
          <AlertTriangle className="w-8 h-8 text-[var(--color-error)]" />
        </div>

        <h1 className="text-2xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-heading)] mb-3">
          {error.title}
        </h1>
        <p className="text-[var(--text-secondary)] mb-6">
          {error.message}
        </p>

        {error.showGoogleTip && (
          <div className="bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-[var(--color-primary)] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
                  Tip: Použij Google přihlášení
                </p>
                <p className="text-xs text-[var(--text-secondary)] mb-3">
                  Funguje vždy — i v nainstalované aplikaci, i v prohlížeči. Stačí mít @weeks.cz Google účet.
                </p>
                <button
                  onClick={handleGoogleLogin}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-800 text-sm font-semibold rounded-lg transition-all shadow-sm ring-1 ring-black/5 group"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Přihlásit se přes Google
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        )}

        <Link
          href="/auth/login"
          className="inline-flex items-center justify-center px-6 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-medium rounded-xl transition-colors duration-200"
        >
          Zpět na přihlášení
        </Link>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-[var(--text-muted)]">Načítání...</div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
