'use client';

import { PRIORITY_CONFIG, type TaskPriority } from '@/types/database';

interface PrioritySelectProps {
  value: TaskPriority;
  onChange: (value: TaskPriority) => void;
  className?: string;
}

export function PrioritySelect({ value, onChange, className }: PrioritySelectProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
        Priorita
      </label>
      <div className="flex gap-1.5">
        {(Object.entries(PRIORITY_CONFIG) as [TaskPriority, { label: string; color: string }][]).map(
          ([key, config]) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                value === key
                  ? 'text-white ring-2 ring-offset-1 ring-offset-[var(--bg-surface)]'
                  : 'text-[var(--text-secondary)] bg-[var(--bg-primary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
              style={
                value === key
                  ? { backgroundColor: config.color, '--tw-ring-color': config.color } as React.CSSProperties
                  : undefined
              }
            >
              {config.label}
            </button>
          )
        )}
      </div>
    </div>
  );
}
