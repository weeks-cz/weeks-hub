'use client';

import Link from 'next/link';
import { CheckSquare } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PRIORITY_CONFIG, type Task } from '@/types/database';
import { formatDateShort } from '@/lib/utils/date';

interface MyTasksProps {
  tasks: Task[];
}

export function MyTasks({ tasks }: MyTasksProps) {
  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-4">
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
          {sortedTasks.slice(0, 8).map((task) => (
            <Link
              key={task.id}
              href="/board"
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[var(--bg-surface-hover)] transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: PRIORITY_CONFIG[task.priority].color }}
                />
                <span className="text-sm text-[var(--text-primary)] truncate">
                  {task.title}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge color={PRIORITY_CONFIG[task.priority].color}>
                  {PRIORITY_CONFIG[task.priority].label}
                </Badge>
                {task.due_date && (
                  <span className="text-xs text-[var(--text-muted)]">
                    {formatDateShort(task.due_date)}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
