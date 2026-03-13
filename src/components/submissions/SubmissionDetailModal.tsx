'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Baby, BookOpen, MessageSquare, User, Clock, CheckCircle, Archive, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatDateTime, formatRelative } from '@/lib/utils/date';
import type { FormSubmission } from '@/types/database';
import { FORM_TYPE_CONFIG, FORM_STATUS_CONFIG, PROGRAM_CONFIG } from '@/types/database';

interface SubmissionDetailModalProps {
  submission: FormSubmission | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: 'processed' | 'archived', email: string) => Promise<boolean>;
  onUpdateNotes: (id: string, notes: string, email: string) => Promise<boolean>;
  onDelete: (id: string, email: string) => Promise<boolean>;
}

export function SubmissionDetailModal({
  submission,
  isOpen,
  onClose,
  onUpdateStatus,
  onUpdateNotes,
  onDelete,
}: SubmissionDetailModalProps) {
  const [notes, setNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleOpen = () => {
    if (submission) {
      setNotes(submission.notes ?? '');
    }
  };

  const handleSaveNotes = async () => {
    if (!submission) return;
    setNotesSaving(true);
    await onUpdateNotes(submission.id, notes, submission.email);
    setNotesSaving(false);
  };

  const handleDelete = async () => {
    if (!submission) return;
    setShowDeleteConfirm(false);
    await onDelete(submission.id, submission.email);
    onClose();
  };

  if (!submission) return null;

  const typeConfig = FORM_TYPE_CONFIG[submission.form_type];
  const statusConfig = FORM_STATUS_CONFIG[submission.status];

  return (
    <>
      <AnimatePresence onExitComplete={() => setNotes('')}>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60"
              onClick={onClose}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', duration: 0.3, bounce: 0.15 }}
              onAnimationComplete={handleOpen}
              className="relative w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)]">
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs px-2 py-0.5 rounded font-medium"
                    style={{ backgroundColor: `${typeConfig.color}20`, color: typeConfig.color }}
                  >
                    {typeConfig.label}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded font-medium"
                    style={{ backgroundColor: `${statusConfig.color}20`, color: statusConfig.color }}
                  >
                    {statusConfig.label}
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Email */}
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                  <div>
                    <div className="text-xs text-[var(--text-muted)]">Email</div>
                    <div className="text-sm font-medium text-[var(--text-primary)]">{submission.email}</div>
                  </div>
                </div>

                {submission.form_type === 'waitlist' ? (
                  <>
                    {/* Child info */}
                    <div className="flex items-center gap-3">
                      <Baby className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                      <div>
                        <div className="text-xs text-[var(--text-muted)]">Dítě</div>
                        <div className="text-sm text-[var(--text-primary)]">
                          {submission.child_name || '(neuvedeno)'}
                          {submission.child_age ? ` · ${submission.child_age} let` : ''}
                        </div>
                      </div>
                    </div>

                    {/* Program */}
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                      <div>
                        <div className="text-xs text-[var(--text-muted)]">Program</div>
                        <div className="text-sm text-[var(--text-primary)]">
                          {submission.program ? (PROGRAM_CONFIG[submission.program] || submission.program) : '(neuvedeno)'}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Sender */}
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                      <div>
                        <div className="text-xs text-[var(--text-muted)]">Odesílatel</div>
                        <div className="text-sm text-[var(--text-primary)]">{submission.sender_name}</div>
                      </div>
                    </div>

                    {/* Message */}
                    <div className="flex items-start gap-3">
                      <MessageSquare className="w-4 h-4 text-[var(--text-muted)] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs text-[var(--text-muted)]">Zpráva</div>
                        <div className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{submission.message}</div>
                      </div>
                    </div>
                  </>
                )}

                {/* Submitted at */}
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                  <div>
                    <div className="text-xs text-[var(--text-muted)]">Odesláno</div>
                    <div className="text-sm text-[var(--text-primary)]">
                      {formatDateTime(submission.submitted_at)}
                      <span className="text-[var(--text-muted)] ml-1">({formatRelative(submission.submitted_at)})</span>
                    </div>
                  </div>
                </div>

                {/* Processed info */}
                {submission.processed_by && submission.processor && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-surface-hover)]">
                    {submission.processor.avatar_url ? (
                      <img src={submission.processor.avatar_url} alt="" className="w-6 h-6 rounded-full shrink-0" />
                    ) : (
                      <User className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                    )}
                    <div className="text-xs text-[var(--text-secondary)]">
                      Zpracoval/a <span className="font-medium text-[var(--text-primary)]">{submission.processor.full_name}</span>
                      {submission.processed_at && (
                        <> · {formatRelative(submission.processed_at)}</>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">
                    Poznámky
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Přidat poznámku..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)]"
                    rows={3}
                  />
                  {notes !== (submission.notes ?? '') && (
                    <div className="flex justify-end mt-1.5">
                      <Button size="sm" onClick={handleSaveNotes} isLoading={notesSaving}>
                        Uložit poznámku
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-default)] bg-[var(--bg-primary)]">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--color-error)] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Smazat
                </button>

                <div className="flex gap-2">
                  {submission.status === 'new' && (
                    <Button
                      size="sm"
                      onClick={() => onUpdateStatus(submission.id, 'processed', submission.email)}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Zpracovat
                    </Button>
                  )}
                  {(submission.status === 'new' || submission.status === 'processed') && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onUpdateStatus(submission.id, 'archived', submission.email)}
                    >
                      <Archive className="w-3.5 h-3.5" />
                      Archivovat
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Smazat formulář"
        message={`Opravdu chcete smazat formulář od ${submission.email}? Tuto akci nelze vrátit.`}
        confirmLabel="Smazat"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
