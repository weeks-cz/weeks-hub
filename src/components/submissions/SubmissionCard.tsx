'use client';

import { Mail, Baby, MessageSquare, Package, Check, Archive } from 'lucide-react';
import { formatRelative, formatDateTime } from '@/lib/utils/date';
import { dnuOd, dnyText } from '@/lib/utils/urgency';
import type { FormSubmission, FormSubmissionStatus } from '@/types/database';
import { FORM_TYPE_CONFIG, FORM_STATUS_CONFIG, PROGRAM_CONFIG } from '@/types/database';

interface SubmissionCardProps {
  submission: FormSubmission;
  onClick: () => void;
  onUpdateStatus?: (id: string, status: FormSubmissionStatus, email: string) => Promise<boolean>;
}

/** Po kolika dnech bez odpovědi se poptávka označí jako čekající příliš dlouho. */
const LHUTA_DNU = 3;

export function SubmissionCard({ submission, onClick, onUpdateStatus }: SubmissionCardProps) {
  const typeConfig = FORM_TYPE_CONFIG[submission.form_type];
  const statusConfig = FORM_STATUS_CONFIG[submission.status];

  const jeNovy = submission.status === 'new';
  const cekaDnu = dnuOd(submission.submitted_at);
  const cekaDlouho = jeNovy && cekaDnu >= LHUTA_DNU;

  // Popisný řádek se vykreslí jen když je co říct. Dřív se u waitlistu vždycky
  // vypsalo „(neuvedeno)", protože jméno dítěte tam skoro nikdy není — a byl
  // to nejvýraznější text na kartě.
  const detail = (() => {
    if (submission.form_type === 'waitlist') {
      const jmeno = submission.child_name?.trim();
      if (!jmeno && !submission.child_age) return null;
      return {
        Ikona: Baby,
        text: [jmeno, submission.child_age ? `${submission.child_age} let` : null]
          .filter(Boolean)
          .join(' · '),
      };
    }
    if (submission.form_type === 'shop_interest') {
      const jmeno = submission.sender_name?.trim();
      if (!jmeno && !submission.product_name) return null;
      return {
        Ikona: Package,
        text: [jmeno, submission.product_name].filter(Boolean).join(' — '),
      };
    }
    const jmeno = submission.sender_name?.trim();
    const zprava = submission.message?.trim();
    if (!jmeno && !zprava) return null;
    return {
      Ikona: MessageSquare,
      text: [jmeno, zprava ? `${zprava.slice(0, 60)}${zprava.length > 60 ? '…' : ''}` : null]
        .filter(Boolean)
        .join(' — '),
    };
  })();

  const zpracoval = submission.processor?.full_name;

  return (
    // Karta není <button>, protože uvnitř má vlastní tlačítka — vnořený button
    // je neplatné HTML a prohlížeč si s ním poradí po svém.
    <div
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Formulář od ${submission.email}`}
      className="w-full text-left p-4 rounded-xl border bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 cursor-pointer border-l-2"
      style={{
        borderColor: 'var(--border-default)',
        borderLeftColor: cekaDlouho ? '#F87171' : jeNovy ? '#FBBF24' : 'var(--border-default)',
      }}
    >
      {/* Badges row */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span
          className="text-[10px] px-1.5 py-0.5 rounded font-medium"
          style={{ backgroundColor: `${typeConfig.color}20`, color: typeConfig.color }}
        >
          {typeConfig.label}
        </span>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded font-medium"
          style={{ backgroundColor: `${statusConfig.color}20`, color: statusConfig.color }}
        >
          {statusConfig.label}
        </span>
        {submission.form_type === 'waitlist' && submission.program && (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]">
            {PROGRAM_CONFIG[submission.program] || submission.program}
          </span>
        )}
        {submission.form_type === 'shop_interest' && submission.product_name && (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]">
            {submission.product_name}
          </span>
        )}
      </div>

      {/* Email */}
      <div className="flex items-center gap-2 mb-1.5">
        <Mail className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
        <span className="text-sm font-medium text-[var(--text-primary)] truncate">
          {submission.email}
        </span>
      </div>

      {detail && (
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <detail.Ikona className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{detail.text}</span>
        </div>
      )}

      <div className="flex items-end justify-between gap-2 mt-2">
        <div className="min-w-0">
          {/* Relativní čas se čte líp, přesný je potřeba při psaní odpovědi. */}
          <span className="text-[10px] text-[var(--text-muted)]" title={formatDateTime(submission.submitted_at)}>
            {formatRelative(submission.submitted_at)}
          </span>
          {cekaDlouho && (
            <span className="text-[10px] ml-1.5" style={{ color: '#F87171' }}>
              čeká {dnyText(cekaDnu)}
            </span>
          )}
          {zpracoval && submission.status !== 'new' && (
            <span className="block text-[10px] text-[var(--text-muted)] truncate">
              {submission.status === 'archived' ? 'Archivoval' : 'Zpracoval'} {zpracoval.split(' ')[0]}
            </span>
          )}
        </div>

        {/* Rychlé akce — bez nich se musel kvůli jednomu kliknutí otevřít
            a zase zavřít modal, a to u šestnácti poptávek za sebou. */}
        {onUpdateStatus && submission.status === 'new' && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateStatus(submission.id, 'processed', submission.email);
              }}
              title="Označit jako zpracované"
              aria-label="Označit jako zpracované"
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[#10B981] hover:bg-[#10B981]/10 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateStatus(submission.id, 'archived', submission.email);
              }}
              title="Archivovat"
              aria-label="Archivovat"
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
            >
              <Archive className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
