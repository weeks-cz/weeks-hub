'use client';

import { Mail, Baby, MessageSquare, Package } from 'lucide-react';
import { formatRelative } from '@/lib/utils/date';
import type { FormSubmission } from '@/types/database';
import { FORM_TYPE_CONFIG, FORM_STATUS_CONFIG, PROGRAM_CONFIG } from '@/types/database';

interface SubmissionCardProps {
  submission: FormSubmission;
  onClick: () => void;
}

export function SubmissionCard({ submission, onClick }: SubmissionCardProps) {
  const typeConfig = FORM_TYPE_CONFIG[submission.form_type];
  const statusConfig = FORM_STATUS_CONFIG[submission.status];

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 group"
    >
      {/* Badges row */}
      <div className="flex items-center gap-2 mb-2">
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

      {/* Details */}
      {submission.form_type === 'waitlist' ? (
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <Baby className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {submission.child_name || '(neuvedeno)'}
            {submission.child_age ? ` · ${submission.child_age} let` : ''}
          </span>
        </div>
      ) : submission.form_type === 'shop_interest' ? (
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <Package className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {submission.sender_name || '(bez jména)'}
            {submission.product_name ? ` — ${submission.product_name}` : ''}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <MessageSquare className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {submission.sender_name}
            {submission.message ? ` — ${submission.message.slice(0, 60)}${submission.message.length > 60 ? '…' : ''}` : ''}
          </span>
        </div>
      )}

      {/* Time */}
      <div className="text-[10px] text-[var(--text-muted)] mt-2">
        {formatRelative(submission.submitted_at)}
      </div>
    </button>
  );
}
