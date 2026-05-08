'use client';

import { useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Mail, Loader2, CheckCircle, ArrowRight, ChevronDown, AlertTriangle, Clock, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const startCooldown = () => {
    setCooldown(60);
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!email.endsWith('@weeks.cz')) {
      setPasswordError('Přihlášení je povoleno pouze pro @weeks.cz emaily.');
      return;
    }

    setIsLoading(true);
    const supabase = createClient();
    const { error: passwordLoginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setIsLoading(false);

    if (passwordLoginError) {
      setPasswordError('Email nebo heslo nesedí.');
      return;
    }

    window.location.href = '/';
  };

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
      if (otpError.message?.includes('rate') || otpError.status === 429) {
        setError('Příliš mnoho pokusů. Zkus to znovu za pár minut.');
      } else {
        setError('Nepodařilo se odeslat přihlašovací odkaz. Zkus to znovu.');
      }
      return;
    }

    setIsSent(true);
    startCooldown();
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--bg-primary)]">
      {/* Decorative blobs */}
      <div className="blob blob-primary w-[500px] h-[500px] -top-48 -left-48" />
      <div className="blob blob-accent w-[400px] h-[400px] -bottom-32 -right-32" />
      <div className="blob blob-trust w-[300px] h-[300px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ opacity: 0.08 }} />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="w-full max-w-md px-6 relative z-10">
        {/* Brand */}
        <div className="text-center mb-10">
          <div className="inline-block mb-6">
            <Image
              src="/weeks-logo.png"
              alt="Weeks"
              width={72}
              height={72}
              className="rounded-2xl shadow-2xl shadow-[var(--color-primary)]/20"
            />
          </div>
          <h1 className="text-4xl font-bold font-[family-name:var(--font-heading)] mb-2">
            <span className="text-gradient">Weeks</span>{' '}
            <span className="text-[var(--text-primary)]">Hub</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-lg">
            Interní platforma pro tým
          </p>
        </div>

        {/* Card */}
        <div className="bg-[var(--bg-surface)]/80 backdrop-blur-xl rounded-2xl border border-[var(--border-default)] p-8 shadow-2xl shadow-black/20">
          {isSent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-success)]/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-[var(--color-success)]" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2 font-[family-name:var(--font-heading)]">
                Odkaz odeslán
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Na <strong className="text-[var(--text-primary)]">{email}</strong> jsme ti poslali přihlašovací odkaz.
              </p>

              {/* Spam/delivery hint */}
              <div className="bg-[var(--color-warning)]/5 border border-[var(--color-warning)]/20 rounded-xl p-3 mb-5">
                <div className="flex items-start gap-2.5 text-left">
                  <AlertTriangle className="w-4 h-4 text-[var(--color-warning)] mt-0.5 shrink-0" />
                  <div className="text-xs text-[var(--text-secondary)]">
                    <p className="font-medium text-[var(--text-primary)] mb-1">Email nepřišel?</p>
                    <ul className="space-y-0.5 list-disc list-inside">
                      <li>Zkontroluj <strong>spam/nevyžádaná pošta</strong></li>
                      <li>Email může trvat až 2 minuty</li>
                      <li>Nebo se jednoduše přihlas přes Google</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {/* Resend with cooldown */}
                <button
                  onClick={handleMagicLink as unknown as () => void}
                  disabled={cooldown > 0 || isLoading}
                  className="inline-flex items-center justify-center gap-2 text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cooldown > 0 ? (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      Znovu odeslat za {cooldown}s
                    </>
                  ) : isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Odesílám...
                    </>
                  ) : (
                    'Odeslat znovu'
                  )}
                </button>

                {/* Switch to Google */}
                <button
                  onClick={() => { setIsSent(false); setEmail(''); }}
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  Zpět na přihlášení
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Google — primary method, emphasized */}
              <div className="mb-2">
                <div className="flex items-center justify-center gap-1.5 mb-3">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
                  <span className="text-xs font-medium text-[var(--color-success)]">Doporučený způsob</span>
                </div>
                <button
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white hover:bg-gray-50 text-gray-800 font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg shadow-md group ring-1 ring-black/5"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Přihlásit se přes Google
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <p className="text-center text-xs text-[var(--text-muted)] mt-2">
                  Okamžité přihlášení s @weeks.cz účtem
                </p>
              </div>

              {/* Password login — no redirect, useful for local development */}
              <div className="mt-6">
                <button
                  onClick={() => {
                    setShowPasswordLogin(!showPasswordLogin);
                    setShowMagicLink(false);
                    setPasswordError('');
                  }}
                  className="w-full flex items-center justify-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors py-2"
                >
                  <div className="flex-1 border-t border-[var(--border-default)]" />
                  <span className="px-2 flex items-center gap-1.5">
                    Přihlásit heslem
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showPasswordLogin ? 'rotate-180' : ''}`} />
                  </span>
                  <div className="flex-1 border-t border-[var(--border-default)]" />
                </button>

                {showPasswordLogin && (
                  <form onSubmit={handlePasswordLogin} className="space-y-3 mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jmeno@weeks.cz"
                        required
                        className="w-full pl-11 pr-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-[var(--color-primary)] transition-all"
                      />
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Heslo"
                        required
                        className="w-full pl-11 pr-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-[var(--color-primary)] transition-all"
                      />
                    </div>

                    {passwordError && (
                      <div className="flex items-start gap-2 p-2.5 bg-[var(--color-error)]/5 border border-[var(--color-error)]/20 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-[var(--color-error)] mt-0.5 shrink-0" />
                        <p className="text-sm text-[var(--color-error)]">{passwordError}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium rounded-xl transition-all duration-200 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Přihlašuji...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          Přihlásit se
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>

              {/* Collapsible magic link section */}
              <div className="mt-6">
                <button
                  onClick={() => {
                    setShowMagicLink(!showMagicLink);
                    setShowPasswordLogin(false);
                    setError('');
                  }}
                  className="w-full flex items-center justify-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors py-2"
                >
                  <div className="flex-1 border-t border-[var(--border-default)]" />
                  <span className="px-2 flex items-center gap-1.5">
                    Přihlásit se emailem
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showMagicLink ? 'rotate-180' : ''}`} />
                  </span>
                  <div className="flex-1 border-t border-[var(--border-default)]" />
                </button>

                {showMagicLink && (
                  <form onSubmit={handleMagicLink} className="space-y-3 mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jmeno@weeks.cz"
                        required
                        className="w-full pl-11 pr-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-[var(--color-primary)] transition-all"
                      />
                    </div>

                    {error && (
                      <div className="flex items-start gap-2 p-2.5 bg-[var(--color-error)]/5 border border-[var(--color-error)]/20 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-[var(--color-error)] mt-0.5 shrink-0" />
                        <p className="text-sm text-[var(--color-error)]">{error}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium rounded-xl transition-all duration-200 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Odesílám...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          Odeslat přihlašovací odkaz
                        </>
                      )}
                    </button>

                    <p className="text-xs text-[var(--text-muted)] text-center">
                      Doručení může trvat až 2 minuty. Zkontroluj i spam.
                    </p>
                  </form>
                )}
              </div>
            </>
          )}

          <p className="text-center text-xs text-[var(--text-muted)] mt-5">
            Pouze pro @weeks.cz účty
          </p>
        </div>

        <p className="text-center text-xs text-[var(--text-muted)] mt-8 opacity-60">
          &copy; {new Date().getFullYear()} Weeks s.r.o.
        </p>
      </div>
    </div>
  );
}
