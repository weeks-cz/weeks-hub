'use client';

import { motion } from 'framer-motion';
import { Coins, ClipboardList, Receipt, Scale } from 'lucide-react';
import type { MetaCampaignsData } from '@/hooks/useMetaCampaigns';
import type { Registration } from '@/types/database';

const czk = new Intl.NumberFormat('cs-CZ', {
  style: 'currency',
  currency: 'CZK',
  maximumFractionDigits: 0,
});

interface EkonomikaPanelProps {
  meta: MetaCampaignsData | null;
  /** Meta API neodpovědělo — útrata pak není neznámá nulou, ale neznámou. */
  metaChyba?: string | null;
  registrations: Registration[];
  /** Registrace se nenačetly (chybí práva nebo výpadek) — tržby pak neuvádíme. */
  bezRegistraci?: boolean;
}

/**
 * Kolik stála jedna registrace.
 *
 * Stránka do teď ukazovala útratu za reklamu na jednom místě a registrace na
 * úplně jiném, takže otázku „vyplácí se to?" musel člověk počítat na papíře.
 * Obě čísla přitom aplikace zná — tady se potkávají.
 *
 * Vědomě se porovnává celá doba, ne posledních 7 dní: kampaň běží po vlnách a
 * registrace chodí se zpožděním, takže týdenní řez by dával nesmyslné poměry.
 */
export function EkonomikaPanel({ meta, metaChyba, registrations, bezRegistraci }: EkonomikaPanelProps) {
  // Řádky kampaní chodí z Meta API za celou dobu jejich běhu (date_preset=maximum),
  // takže jejich součet je útrata od začátku — ne za posledních 7 dní.
  const utrata = meta?.campaigns.reduce((soucet, k) => soucet + k.spend, 0) ?? 0;

  const zaplacene = registrations.filter(
    (r) => r.payment_status === 'completed' && r.status !== 'cancelled',
  );
  const trzby = zaplacene.reduce((soucet, r) => soucet + (r.payment_amount ?? 0), 0);

  // Bez útraty i bez registrací není co porovnávat a panel by jen zabíral místo.
  if (utrata === 0 && zaplacene.length === 0) return null;

  const nakladNaRegistraci = zaplacene.length > 0 && utrata > 0 ? utrata / zaplacene.length : null;
  const navratnost = utrata > 0 && trzby > 0 ? trzby / utrata : null;

  const polozky: { label: string; hodnota: string; popis: string; icon: typeof Coins; barva: string }[] = [
    {
      label: 'Útrata za reklamu',
      hodnota: utrata > 0 ? czk.format(utrata) : '—',
      popis: metaChyba ? 'Meta API neodpovídá' : 'Meta, od začátku kampaní',
      icon: Coins,
      barva: '#1877F2',
    },
    {
      label: 'Zaplacené registrace',
      hodnota: bezRegistraci ? '—' : String(zaplacene.length),
      popis: bezRegistraci ? 'Nemáš přístup k registracím' : 'Karlovy Vary, vlastní systém',
      icon: ClipboardList,
      barva: 'var(--color-trust)',
    },
    {
      label: 'Tržby',
      hodnota: bezRegistraci ? '—' : czk.format(trzby),
      popis: 'Přijaté platby, bez storen',
      icon: Receipt,
      barva: 'var(--color-cta)',
    },
    {
      label: 'Náklad na registraci',
      hodnota: nakladNaRegistraci ? czk.format(nakladNaRegistraci) : '—',
      popis: navratnost
        ? `Za 1 Kč reklamy ${navratnost.toFixed(1)} Kč tržeb`
        : metaChyba
          ? 'Spočítá se, až bude útrata dostupná'
          : 'Chybí útrata nebo registrace',
      icon: Scale,
      barva: 'var(--color-primary)',
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5"
      aria-labelledby="ekonomika-nadpis"
    >
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="ekonomika-nadpis"
          className="font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--text-primary)]"
        >
          Vyplácí se reklama
        </h2>
        {/* Bez tohohle přiznání by čísla vypadala na přesnou atribuci, kterou nemáme. */}
        <p className="text-xs text-[var(--text-muted)]">
          Porovnává útratu a registrace za stejné období, ne to, odkud člověk přišel
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {polozky.map(({ label, hodnota, popis, icon: Icon, barva }) => (
          <div key={label} className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] p-4">
            <div className="mb-2 flex items-center gap-2">
              <Icon className="h-4 w-4 shrink-0" style={{ color: barva }} aria-hidden />
              <span className="text-xs text-[var(--text-muted)]">{label}</span>
            </div>
            <p className="font-[family-name:var(--font-heading)] text-2xl font-bold tabular-nums text-[var(--text-primary)]">
              {hodnota}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{popis}</p>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
