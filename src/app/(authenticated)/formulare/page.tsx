'use client';

import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Inbox } from 'lucide-react';
import { useFormSubmissions } from '@/hooks/useFormSubmissions';
import { SubmissionCard } from '@/components/submissions/SubmissionCard';
import { SubmissionDetailModal } from '@/components/submissions/SubmissionDetailModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { TaskListSkeleton } from '@/components/ui/Skeleton';
import type { FormSubmission, FormSubmissionStatus, FormSubmissionType } from '@/types/database';
import { FORM_STATUS_CONFIG, FORM_TYPE_CONFIG, PROGRAM_CONFIG } from '@/types/database';

type StatusFilter = 'all' | FormSubmissionStatus;
type TypeFilter = 'all' | FormSubmissionType;

export default function FormularePage() {
  const { submissions, loading, updateStatus, updateNotes, deleteSubmission } = useFormSubmissions();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);

  const filtered = useMemo(() => {
    let result = submissions;
    if (statusFilter !== 'all') {
      result = result.filter((s) => s.status === statusFilter);
    }
    if (typeFilter !== 'all') {
      result = result.filter((s) => s.form_type === typeFilter);
    }
    if (programFilter !== 'all') {
      result = result.filter((s) => s.program === programFilter);
    }
    return result;
  }, [submissions, statusFilter, typeFilter, programFilter]);

  // Keep selectedSubmission in sync with latest data
  const currentSubmission = selectedSubmission
    ? submissions.find((s) => s.id === selectedSubmission.id) ?? selectedSubmission
    : null;

  const statusOptions: { value: StatusFilter; label: string; count?: number }[] = [
    { value: 'all', label: 'Vše', count: submissions.length },
    ...Object.entries(FORM_STATUS_CONFIG).map(([key, cfg]) => ({
      value: key as FormSubmissionStatus,
      label: cfg.label,
      count: submissions.filter((s) => s.status === key).length,
    })),
  ];

  const typeOptions: { value: TypeFilter; label: string }[] = [
    { value: 'all', label: 'Vše' },
    ...Object.entries(FORM_TYPE_CONFIG).map(([key, cfg]) => ({
      value: key as FormSubmissionType,
      label: cfg.label,
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-[var(--color-primary)]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
              Formuláře
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Waitlist, kontaktní formuláře a zájmy z e-shopu
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status filter */}
        <div className="flex items-center gap-1 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-1">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === opt.value
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              {opt.label}
              {opt.count !== undefined && (
                <span className={`ml-1 ${statusFilter === opt.value ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>
                  {opt.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-1 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-1">
          {typeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTypeFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                typeFilter === opt.value
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Program filter (only when waitlist visible) */}
        {(typeFilter === 'all' || typeFilter === 'waitlist') && (
          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          >
            <option value="all">Všechny programy</option>
            {Object.entries(PROGRAM_CONFIG).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <TaskListSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-5 h-5" />}
          title="Žádné formuláře"
          description={statusFilter !== 'all' || typeFilter !== 'all' || programFilter !== 'all'
            ? 'Zkuste změnit filtry'
            : 'Zatím nepřišly žádné formuláře z webu'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((submission) => (
              <motion.div
                key={submission.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <SubmissionCard
                  submission={submission}
                  onClick={() => setSelectedSubmission(submission)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Detail Modal */}
      <SubmissionDetailModal
        submission={currentSubmission}
        isOpen={!!selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        onUpdateStatus={updateStatus}
        onUpdateNotes={updateNotes}
        onDelete={deleteSubmission}
      />
    </div>
  );
}
