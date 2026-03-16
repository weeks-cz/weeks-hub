'use client';

import Link from 'next/link';
import { Users } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { TASK_COLUMNS, type Task, type User } from '@/types/database';

interface TeamTasksProps {
  tasks: Task[];
  users: User[];
  currentUserId: string | undefined;
}

const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  TASK_COLUMNS.map((col) => [col.id, col.title])
);

export function TeamTasks({ tasks, users, currentUserId }: TeamTasksProps) {
  const teamTasks = tasks
    .filter((t) => t.assignee_id && t.assignee_id !== currentUserId && t.status === 'in_progress')
    .slice(0, 5);

  const userMap = new Map(users.map((u) => [u.id, u]));

  return (
    <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
          Co řeší tým
        </h3>
        <Link href="/board" className="text-xs text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors">
          Board →
        </Link>
      </div>

      {teamTasks.length === 0 ? (
        <EmptyState
          icon={<Users className="w-5 h-5" />}
          title="Tým odpočívá"
          description="Nikdo nemá rozpracovaný task"
        />
      ) : (
        <div className="space-y-2">
          {teamTasks.map((task) => {
            const user = userMap.get(task.assignee_id!);
            return (
              <Link
                key={task.id}
                href="/board"
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                <Avatar
                  src={user?.avatar_url}
                  name={user?.full_name || '?'}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[var(--text-primary)] truncate">{task.title}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {STATUS_LABELS[task.status] || task.status}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
