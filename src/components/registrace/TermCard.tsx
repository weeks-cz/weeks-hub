'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MapPin, Printer, Users } from 'lucide-react';
import type { Registration } from '@/types/database';
import { REGISTRATION_STATUS_CONFIG } from '@/types/database';
import { ageFromBirthdate, termLabel } from '@/lib/kvCamps';
import type { TermGroup } from '@/hooks/useRegistrations';
import { StatusBadges } from './StatusBadges';

export function TermCard({ group, onSelect }: { group: TermGroup; onSelect: (r: Registration) => void }) {
  const [open, setOpen] = useState(true);

  const openRoster = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/registrace/tisk?term=${group.termId}`, '_blank', 'noopener');
  };

  return (
    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-[var(--bg-surface-hover)] transition-colors text-left"
      >
        <div className="min-w-0">
          <h3 className="font-semibold text-[var(--text-primary)] truncate">{group.programName}</h3>
          <p className="text-sm text-[var(--text-secondary)] flex items-center gap-2">
            <span>{termLabel(group.termStart, group.termEnd)}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{group.locationName}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
            <Users className="w-4 h-4" />
            {group.activeCount}/{group.capacity || '—'}
          </span>
          <span className="text-sm text-[var(--color-success,#10B981)]">{group.paidCount} zaplaceno</span>
          <button
            onClick={openRoster}
            title="Tisk soupisky termínu"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-[var(--bg-surface-hover)] text-[var(--text-primary)] hover:bg-[var(--color-primary)]/10"
          >
            <Printer className="w-3.5 h-3.5" /> Soupiska
          </button>
          <ChevronDown className={`w-5 h-5 text-[var(--text-secondary)] transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-[var(--border-default)]"
          >
            <ul className="divide-y divide-[var(--border-default)]">
              {group.registrations.map((r) => {
                const st = REGISTRATION_STATUS_CONFIG[r.status];
                return (
                  <li key={r.id}>
                    <button
                      onClick={() => onSelect(r)}
                      className="w-full flex items-center justify-between gap-4 px-5 py-3 hover:bg-[var(--bg-surface-hover)] transition-colors text-left"
                    >
                      <div className="min-w-0 flex items-center gap-3">
                        <span className="font-medium text-[var(--text-primary)] truncate">{r.child_name}</span>
                        <span className="text-xs text-[var(--text-secondary)] shrink-0">{ageFromBirthdate(r.child_birthdate)} let</span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-md font-medium shrink-0"
                          style={{ backgroundColor: `${st.color}15`, color: st.color }}
                        >
                          {st.label}
                        </span>
                      </div>
                      <div className="hidden sm:block shrink-0">
                        <StatusBadges r={r} />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
