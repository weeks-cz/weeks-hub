'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { APP_NAME } from '@/lib/utils/constants';
import { Mail, Loader2, CheckCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.endsWith('@weeks.cz')) {
      setError('Přihlášení je povoleno pouze pro @weeks.cz emaily.');
      return;
    }

    setIsLoading(true);
    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setIsLoading(false);

    if (otpError) {
      setError('Nepodařilo se odeslat přihlašovací odkaz. Zkus to znovu.');
      return;
    }

    setIsSent(true);
  };

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
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] bg-gradient-to-br from-[var(--color-primary)]/5 via-transparent to-[var(--color-accent)]/5">
      <div className="w-full max-w-md px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] shadow-lg shadow-[var(--color-primary)]/20 mb-6">
            <span className="text-2xl font-bold text-white font-[family-name:var(--font-heading)]">W</span>
          </div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-heading)] mb-2">
            {APP_NAME}
          </h1>
          <p className="text-[var(--text-secondary)]">
            Interní systém pro tým Weeks
          </p>
        </div>

        <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-8">
          {isSent ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-[var(--color-success)] mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                Odkaz odeslán
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Na <strong>{email}</strong> jsme ti poslali přihlašovací odkaz. Klikni na něj pro přihlášení.
              </p>
              <button
                onClick={() => { setIsSent(false); setEmail(''); }}
                className="text-sm text-[var(--color-primary)] hover:underline"
              >
                Použít jiný email
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Firemní email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jmeno@weeks.cz"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-colors"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-[var(--color-error)]">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50 text-white font-medium rounded-xl transition-colors duration-200"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Odesílám...
                    </>
                  ) : (
                    'Přihlásit se emailem'
                  )}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--border-default)]" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-[var(--bg-surface)] px-3 text-[var(--text-muted)]">nebo</span>
                </div>
              </div>

              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white hover:bg-gray-50 text-gray-800 font-medium rounded-xl transition-colors duration-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Přihlásit se přes Google
              </button>
            </>
          )}

          <p className="text-center text-sm text-[var(--text-muted)] mt-4">
            Pouze pro @weeks.cz účty
          </p>
        </div>

        <p className="text-center text-xs text-[var(--text-muted)] mt-8">
          &copy; {new Date().getFullYear()} Weeks s.r.o.
        </p>
      </div>
    </div>
  );
}
