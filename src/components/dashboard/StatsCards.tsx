'use client';

import { motion } from 'framer-motion';
import { CheckSquare, Calendar, Clock, Users } from 'lucide-react';
import type { Task, CalendarEvent, User } from '@/types/database';
import { isDueThisWeek } from '@/lib/utils/date';

interface StatsCardsProps {
  tasks: Task[];
  events: CalendarEvent[];
  users: User[];
}

export function StatsCards({ tasks, events, users }: StatsCardsProps) {
  const totalTasks = tasks.length;
  const dueThisWeek = tasks.filter((t) => t.due_date && isDueThisWeek(t.due_date)).length;
  const upcomingEvents = events.filter((e) => new Date(e.start_date) >= new Date()).length;
  const teamMembers = users.length;

  const stats = [
    {
      label: 'Celkem tasků',
      value: totalTasks,
      icon: CheckSquare,
      color: 'var(--color-primary)',
    },
    {
      label: 'Tento týden',
      value: dueThisWeek,
      icon: Clock,
      color: 'var(--color-cta)',
    },
    {
      label: 'Události',
      value: upcomingEvents,
      icon: Calendar,
      color: 'var(--color-trust)',
    },
    {
      label: 'Členové',
      value: teamMembers,
      icon: Users,
      color: 'var(--color-accent)',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.08 }}
            className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-4 hover:border-[var(--color-primary)]/20 transition-colors duration-300"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <Icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
                  {stat.value}
                </p>
                <p className="text-xs text-[var(--text-muted)]">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
