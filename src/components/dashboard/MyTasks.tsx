'use client';

import Link from 'next/link';
import { CheckSquare } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { PRIORITY_CONFIG, TASK_COLUMNS, type Task } from '@/types/database';
import { formatDateShort } from '@/lib/utils/date';

interface MyTasksProps {
  tasks: Task[];
}

const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  TASK_COLUMNS.map((col) => [col.id, col.title])
);

function isOverdueOrSoon(dueDate: string): 'overdue' | 'tomorrow' | 'normal' {
  const now = new Date();
  const due = new Date(dueDate);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays = Math.floor((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';
  if (diffDays <= 1) return 'tomorrow';
  return 'normal';
}

export function MyTasks({ tasks }: MyTasksProps) {
  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
          Moje tasky
        </h3>
        <Link href="/board" className="text-xs text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors">
          Zobrazit vše →
        </Link>
      </div>

      {sortedTasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-5 h-5" />}
          title="Žádné přiřazené tasky"
          description="Všechny úkoly máš hotové!"
        />
      ) : (
        <div className="space-y-2">
          {sortedTasks.slice(0, 8).map((task) => {
            const priorityConfig = PRIORITY_CONFIG[task.priority];
            const urgency = task.due_date ? isOverdueOrSoon(task.due_date) : 'normal';
            const deadlineColor = urgency === 'overdue' ? '#EF4444' : urgency === 'tomorrow' ? '#EF4444' : 'var(--text-muted)';

            return (
              <Link
                key={task.id}
                href="/board"
                className="block p-3 rounded-xl bg-[var(--bg-surface-hover)]/50 hover:bg-[var(--bg-surface-hover)] transition-colors border-l-[3px]"
                style={{ borderLeftColor: priorityConfig.color }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm text-[var(--text-primary)] font-medium leading-tight">
                    {task.title}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0"
                    style={{ backgroundColor: `${priorityConfig.color}20`, color: priorityConfig.color }}
                  >
                    {priorityConfig.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  {task.due_date && (
                    <span className="text-xs flex items-center gap-1" style={{ color: deadlineColor }}>
                      {urgency === 'overdue' ? '⚠' : '⏰'} {urgency === 'overdue' ? 'Po termínu' : formatDateShort(task.due_date)}
                    </span>
                  )}
                  <span className="text-xs text-[var(--text-muted)]">
                    {STATUS_LABELS[task.status] || task.status}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
