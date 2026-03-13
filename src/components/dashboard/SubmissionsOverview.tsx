'use client';

import Link from 'next/link';
import { FileText, Mail } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatRelative } from '@/lib/utils/date';
import type { FormSubmission } from '@/types/database';
import { FORM_TYPE_CONFIG } from '@/types/database';

interface SubmissionsOverviewProps {
  submissions: FormSubmission[];
  newCount: number;
}

export function SubmissionsOverview({ submissions, newCount }: SubmissionsOverviewProps) {
  const recent = submissions.slice(0, 5);

  return (
    <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
            Formuláře
          </h3>
          {newCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-[#F59E0B]/20 text-[#F59E0B]">
              {newCount} nový{newCount > 1 && newCount < 5 ? 'é' : newCount >= 5 ? 'ch' : ''}
            </span>
          )}
        </div>
        <Link href="/formulare" className="text-xs text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors">
          Všechny formuláře →
        </Link>
      </div>

      {recent.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-5 h-5" />}
          title="Žádné formuláře"
          description="Zatím nepřišly žádné formuláře z webu"
        />
      ) : (
        <div className="space-y-2">
          {recent.map((submission) => {
            const typeConfig = FORM_TYPE_CONFIG[submission.form_type];
            return (
              <Link
                key={submission.id}
                href="/formulare"
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                <Mail className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-[var(--text-primary)] truncate">{submission.email}</span>
                    <span
                      className="text-[9px] px-1 py-0.5 rounded font-medium shrink-0"
                      style={{ backgroundColor: `${typeConfig.color}20`, color: typeConfig.color }}
                    >
                      {typeConfig.label}
                    </span>
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)]">
                    {formatRelative(submission.submitted_at)}
                  </div>
                </div>
                {submission.status === 'new' && (
                  <div className="w-2 h-2 rounded-full bg-[#F59E0B] shrink-0" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
