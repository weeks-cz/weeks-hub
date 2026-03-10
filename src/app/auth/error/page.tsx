'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Suspense } from 'react';

const ERROR_MESSAGES: Record<string, { title: string; message: string }> = {
  invalid_domain: {
    title: 'Nepovolený účet',
    message: 'Přihlášení je povoleno pouze pro @weeks.cz emaily. Použij prosím svůj firemní účet.',
  },
  invalid_email: {
    title: 'Neplatný email',
    message: 'Zadaný email není @weeks.cz adresa. Přihlášení je povoleno pouze pro firemní emaily.',
  },
  magic_link_failed: {
    title: 'Neplatný odkaz',
    message: 'Přihlašovací odkaz je neplatný nebo vypršel. Nech si poslat nový.',
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="w-full max-w-md px-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-error)]/10 mb-6">
          <AlertTriangle className="w-8 h-8 text-[var(--color-error)]" />
        </div>

        <h1 className="text-2xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-heading)] mb-3">
          {error.title}
        </h1>
        <p className="text-[var(--text-secondary)] mb-8">
          {error.message}
        </p>

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
