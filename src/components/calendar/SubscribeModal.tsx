'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, RefreshCw, ExternalLink, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function SubscribeModal({ isOpen, onClose }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Fetch once on first open. The token never changes on its own, so reopening
  // reuses it — which also keeps this effect free of a synchronous setState.
  useEffect(() => {
    if (!isOpen || token) return;

    let cancelled = false;

    // Creating on open keeps it one click — the token only exists for people
    // who actually asked for the feed.
    fetch('/api/calendar/feed-token', { method: 'POST' })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((json) => {
        if (!cancelled) setToken(json.token);
      })
      .catch(() => {
        if (!cancelled) toast.error('Odkaz se nepodařilo vytvořit');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, token]);

  const httpsUrl = token && typeof window !== 'undefined' ? `${window.location.origin}/api/calendar/feed/${token}` : '';
  const webcalUrl = httpsUrl.replace(/^https?:/, 'webcal:');

  const copy = async () => {
    await navigator.clipboard.writeText(httpsUrl);
    setCopied(true);
    toast.success('Odkaz zkopírován');
    setTimeout(() => setCopied(false), 2000);
  };

  const regenerate = async () => {
    if (!confirm('Vytvořit nový odkaz? Ten starý přestane fungovat a kalendáře, kde je přidaný, se přestanou aktualizovat.')) {
      return;
    }

    setLoading(true);
    const res = await fetch('/api/calendar/feed-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regenerate: true }),
    });
    const json = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      toast.error(json.error ?? 'Nepodařilo se');
      return;
    }

    setToken(json.token);
    toast.success('Nový odkaz vytvořen');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Připojit do kalendáře" size="lg">
      {loading ? (
        <div className="py-10 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Adresa kalendáře
            </label>
            <div className="flex gap-2">
              <input
                readOnly
                value={httpsUrl}
                onFocus={(e) => e.target.select()}
                className="flex-1 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
              />
              <Button variant="secondary" size="sm" onClick={copy}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-default)] divide-y divide-[var(--border-default)]">
            <div className="px-4 py-3">
              <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Apple Calendar / iPhone</p>
              <p className="text-sm text-[var(--text-secondary)] mb-2">
                Otevřete odkaz níže — systém se sám zeptá, jestli kalendář přidat.
              </p>
              <a
                href={webcalUrl}
                className="inline-flex items-center gap-1.5 text-sm text-[var(--color-primary)] hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Přidat do Apple Calendar
              </a>
            </div>

            <div className="px-4 py-3">
              <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Google Kalendář</p>
              <p className="text-sm text-[var(--text-secondary)]">
                Na počítači: <em>Jiné kalendáře</em> → <em>+</em> → <em>Z adresy URL</em> → vložte adresu výše.
                V mobilní aplikaci to nejde, musí se to udělat jednou na webu — pak se kalendář objeví i v telefonu.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              Nové události se v Google objeví se zpožděním — stahuje si odběry po svém, běžně za 8 až 24 hodin.
              Apple aktualizuje rychleji. Není to chyba a nejde to z naší strany zrychlit.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1 border-t border-[var(--border-default)]">
            <p className="text-xs text-[var(--text-muted)]">
              Odkaz je tajný — kdo ho má, vidí týmový kalendář.
            </p>
            <Button variant="ghost" size="sm" onClick={regenerate}>
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Nový odkaz
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
