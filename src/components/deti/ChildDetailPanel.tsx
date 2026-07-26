'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Pencil, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { CHILD_SOURCE_CONFIG, type Child } from '@/types/database';
import { formatAge } from '@/lib/children/matching';

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm border-b border-[var(--border-default)] last:border-0">
      <span className="text-[var(--text-secondary)] shrink-0">{label}</span>
      <span className="text-[var(--text-primary)] text-right break-words">{value || '—'}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
      <div className="rounded-xl border border-[var(--border-default)] px-4 py-1">{children}</div>
    </section>
  );
}

const EDITABLE_FIELDS = [
  { key: 'full_name', label: 'Jméno a příjmení', type: 'text' },
  { key: 'birthdate', label: 'Datum narození', type: 'date' },
  { key: 'parent_name', label: 'Rodič', type: 'text' },
  { key: 'parent_email', label: 'E-mail rodiče', type: 'email' },
  { key: 'parent_phone', label: 'Telefon', type: 'tel' },
  { key: 'insurance', label: 'Pojišťovna', type: 'text' },
] as const;

interface Props {
  child: Child | null;
  onClose: () => void;
  onUpdate: (id: string, values: Partial<Child>) => Promise<string | null>;
  onDelete: (id: string) => Promise<string | null>;
}

export function ChildDetailPanel({ child, onClose, onUpdate, onDelete }: Props) {
  // Edit state is reset by remounting: the page renders this with key={child.id},
  // so switching children can't leave a half-finished draft on screen.
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Partial<Child>>({});

  if (!child) return null;

  const startEditing = () => {
    setDraft({
      full_name: child.full_name,
      birthdate: child.birthdate ?? '',
      parent_name: child.parent_name ?? '',
      parent_email: child.parent_email ?? '',
      parent_phone: child.parent_phone ?? '',
      insurance: child.insurance ?? '',
      health_notes: child.health_notes ?? '',
      experience: child.experience ?? '',
      notes: child.notes ?? '',
    });
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    const error = await onUpdate(child.id, draft);
    setSaving(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success('Uloženo');
    setEditing(false);
  };

  const remove = async () => {
    if (!confirm(`Opravdu smazat ${child.full_name} včetně historie návštěv?`)) return;
    const error = await onDelete(child.id);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success('Smazáno');
    onClose();
  };

  const source = CHILD_SOURCE_CONFIG[child.source];
  const visits = child.visits ?? [];

  return (
    <AnimatePresence>
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-40"
        />
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', duration: 0.4, bounce: 0.1 }}
          className="fixed right-0 top-0 h-screen w-full max-w-lg bg-[var(--bg-surface)] border-l border-[var(--border-default)] z-50 overflow-y-auto"
        >
          <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-[var(--border-default)] sticky top-0 bg-[var(--bg-surface)] z-10">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] truncate">{child.full_name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: `${source.color}1A`, color: source.color }}
                >
                  {source.label}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  {visits.length === 1 ? '1 návštěva' : `${visits.length} ${visits.length >= 2 && visits.length <= 4 ? 'návštěvy' : 'návštěv'}`}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {!editing && (
                <button onClick={startEditing} className="p-2 rounded-lg hover:bg-[var(--bg-surface-hover)]" title="Upravit">
                  <Pencil className="w-4 h-4 text-[var(--text-secondary)]" />
                </button>
              )}
              <button onClick={remove} className="p-2 rounded-lg hover:bg-[var(--bg-surface-hover)]" title="Smazat">
                <Trash2 className="w-4 h-4 text-[var(--color-error)]" />
              </button>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-surface-hover)]">
                <X className="w-4 h-4 text-[var(--text-secondary)]" />
              </button>
            </div>
          </div>

          <div className="px-6 py-5 space-y-5">
            {editing ? (
              <div className="space-y-3">
                {EDITABLE_FIELDS.map((field) => (
                  <Input
                    key={field.key}
                    label={field.label}
                    type={field.type}
                    value={(draft[field.key] as string) ?? ''}
                    onChange={(e) => setDraft((d) => ({ ...d, [field.key]: e.target.value }))}
                  />
                ))}
                <Textarea
                  label="Zdravotní poznámky"
                  rows={2}
                  value={draft.health_notes ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, health_notes: e.target.value }))}
                />
                <Textarea
                  label="Zkušenosti"
                  rows={2}
                  value={draft.experience ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, experience: e.target.value }))}
                />
                <Textarea
                  label="Interní poznámka"
                  rows={2}
                  value={draft.notes ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                />
                <div className="flex gap-2 pt-1">
                  <Button onClick={save} isLoading={saving}>Uložit</Button>
                  <Button variant="ghost" onClick={() => setEditing(false)}>Zrušit</Button>
                </div>
              </div>
            ) : (
              <>
                <Section title="Dítě">
                  <Row label="Datum narození" value={fmtDate(child.birthdate)} />
                  <Row label="Věk" value={formatAge(child.birthdate)} />
                  <Row label="Pojišťovna" value={child.insurance} />
                  <Row label="Zdravotní poznámky" value={child.health_notes} />
                  <Row label="Zkušenosti" value={child.experience} />
                </Section>

                <Section title="Rodič">
                  <Row label="Jméno" value={child.parent_name} />
                  <Row label="E-mail" value={child.parent_email} />
                  <Row label="Telefon" value={child.parent_phone} />
                </Section>

                <section>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Návštěvy</h3>
                  {visits.length === 0 ? (
                    <p className="text-sm text-[var(--text-muted)] rounded-xl border border-dashed border-[var(--border-default)] px-4 py-6 text-center">
                      Zatím žádná zaznamenaná návštěva.
                    </p>
                  ) : (
                    <ol className="space-y-2">
                      {visits.map((visit) => (
                        <li
                          key={visit.id}
                          className="flex items-start gap-3 rounded-xl border border-[var(--border-default)] px-4 py-3"
                        >
                          <CalendarDays className="w-4 h-4 mt-0.5 text-[var(--color-primary)] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm text-[var(--text-primary)]">{visit.camp_label}</p>
                            <p className="text-xs text-[var(--text-muted)]">
                              {fmtDate(visit.visit_date)}
                              {visit.location ? ` · ${visit.location}` : ''}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>

                {child.notes && (
                  <Section title="Interní poznámka">
                    <Row label="" value={child.notes} />
                  </Section>
                )}
              </>
            )}
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  );
}
