'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { dnuOd, dnyText } from '@/lib/utils/urgency';
import type { Camp, FormSubmission, Registration } from '@/types/database';

interface AttentionBannerProps {
  submissions: FormSubmission[];
  camps: Camp[];
  registrations: Registration[];
}

interface Polozka {
  klic: string;
  text: string;
  odkaz: string;
  barva: string;
}

/** Poptávka bez odpovědi déle než tři dny už je propásnutá příležitost. */
const LHUTA_POPTAVKY = 3;
/** Nezaplacená registrace po týdnu je peníze, které nejspíš nepřijdou samy. */
const LHUTA_PLATBY = 7;

/**
 * Pruh „co hoří". Ukazuje jen to, co jinde na dashboardu vidět není a co
 * potřebuje člověka. Když je všechno v pořádku, nevykreslí se vůbec —
 * prázdný dashboard má být odměna, ne pět krabic hlásících prázdno.
 */
export function AttentionBanner({ submissions, camps, registrations }: AttentionBannerProps) {
  const polozky: Polozka[] = [];

  // 1. Nezodpovězené poptávky z webu
  const cekajici = submissions.filter((s) => s.status === 'new');
  const zrale = cekajici.filter((s) => dnuOd(s.submitted_at) >= LHUTA_POPTAVKY);
  if (zrale.length > 0) {
    const nejstarsi = Math.max(...zrale.map((s) => dnuOd(s.submitted_at)));
    polozky.push({
      klic: 'poptavky',
      text: `${zrale.length} ${zrale.length === 1 ? 'poptávka čeká' : zrale.length <= 4 ? 'poptávky čekají' : 'poptávek čeká'} na odpověď, nejstarší ${dnyText(nejstarsi)}`,
      odkaz: '/formulare',
      barva: '#F87171',
    });
  }

  // 2. Nezaplacené registrace
  const nezaplacene = registrations.filter(
    (r) => r.status === 'pending' && dnuOd(r.created_at) >= LHUTA_PLATBY,
  );
  if (nezaplacene.length > 0) {
    polozky.push({
      klic: 'platby',
      text: `${nezaplacene.length} ${nezaplacene.length === 1 ? 'registrace čeká' : nezaplacene.length <= 4 ? 'registrace čekají' : 'registrací čeká'} na platbu déle než týden`,
      odkaz: '/registrace',
      barva: '#FBBF24',
    });
  }

  // 3. Naplněné turnusy — dobrá zpráva, ale je potřeba na ni reagovat
  const dnes = new Date().toISOString().slice(0, 10);
  const plne = camps.filter(
    (c) => c.end_date >= dnes && c.status !== 'closed' && c.capacity > 0 && c.enrolled_count >= c.capacity,
  );
  if (plne.length > 0) {
    polozky.push({
      klic: 'plne',
      text: plne.length === 1
        ? `Turnus ${plne[0].title} je plný`
        : `${plne.length} turnusy jsou plné`,
      odkaz: '/camps',
      barva: '#34D399',
    });
  }

  if (polozky.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] divide-y divide-[var(--border-default)]">
      {polozky.map((p) => (
        <Link
          key={p.klic}
          href={p.odkaz}
          className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-surface-hover)] transition-colors first:rounded-t-2xl last:rounded-b-2xl group"
        >
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: p.barva }} />
          <span className="text-sm text-[var(--text-primary)] flex-1 min-w-0">{p.text}</span>
          <ArrowRight className="w-4 h-4 text-[var(--text-muted)] shrink-0 group-hover:text-[var(--color-primary)] transition-colors" />
        </Link>
      ))}
    </div>
  );
}
