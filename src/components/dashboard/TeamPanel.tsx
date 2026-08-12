'use client';

import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import type { Task, User } from '@/types/database';
import { urciNalehavost } from '@/lib/utils/urgency';

interface TeamPanelProps {
  tasks: Task[];
  users: User[];
  currentUserId: string | undefined;
}

/**
 * Kdo na čem dělá.
 *
 * Dřív to byl seznam pěti rozpracovaných úkolů, ze kterého nešlo poznat, jestli
 * někdo nemá nabito a někdo nic. Teď je to po lidech: kolik má kdo otevřených
 * úkolů, kolik z nich je po termínu a co zrovna dělá.
 */
export function TeamPanel({ tasks, users, currentUserId }: TeamPanelProps) {
  const radky = users
    .map((u) => {
      const otevrene = tasks.filter((t) => t.assignee_id === u.id && t.status !== 'done');
      const poTerminu = otevrene.filter(
        (t) => t.due_date && urciNalehavost(t.due_date) === 'po-terminu',
      ).length;
      const prave = otevrene.find((t) => t.status === 'in_progress');
      return { user: u, pocet: otevrene.length, poTerminu, prave };
    })
    // Kdo nemá nic otevřeného, na dashboard nepatří — je to šum, ne informace.
    .filter((r) => r.pocet > 0)
    .sort((a, b) => b.poTerminu - a.poTerminu || b.pocet - a.pocet);

  return (
    <section className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
          Tým
        </h2>
        <Link
          href="/board"
          className="text-xs text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors"
        >
          Board →
        </Link>
      </div>

      {radky.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] py-4">Nikdo nemá otevřený úkol.</p>
      ) : (
        <div className="space-y-2.5">
          {radky.map(({ user, pocet, poTerminu, prave }) => (
            <div key={user.id} className="flex items-center gap-3">
              <Avatar
                src={user.avatar_url}
                customSrc={user.custom_avatar_url}
                name={user.full_name || user.email}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm text-[var(--text-primary)] truncate">
                    {user.full_name || user.email}
                    {user.id === currentUserId && (
                      <span className="text-[var(--text-muted)]"> (ty)</span>
                    )}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] truncate">
                  {prave ? prave.title : 'Nic rozpracovaného'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm text-[var(--text-primary)] tabular-nums">{pocet}</span>
                {poTerminu > 0 && (
                  <span className="text-xs tabular-nums ml-1.5" style={{ color: '#F87171' }}>
                    {poTerminu} po termínu
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
