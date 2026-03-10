'use client';

import { useState } from 'react';
import { Check, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { Subtask } from '@/types/database';

interface SubtaskListProps {
  subtasks: Subtask[];
  onToggle: (subtaskId: string, completed: boolean) => void;
  onDelete: (subtaskId: string) => void;
  onAdd: (title: string) => void;
}

export function SubtaskList({ subtasks, onToggle, onDelete, onAdd }: SubtaskListProps) {
  const [newTitle, setNewTitle] = useState('');
  const completed = subtasks.filter((s) => s.completed).length;
  const total = subtasks.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  const handleAdd = () => {
    if (newTitle.trim()) {
      onAdd(newTitle.trim());
      setNewTitle('');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-[var(--text-secondary)]">
          Checklisty ({completed}/{total})
        </label>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="h-1.5 bg-[var(--bg-surface-hover)] rounded-full mb-3 overflow-hidden">
          <div
            className="h-full bg-[var(--color-trust)] rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Subtask items */}
      <div className="space-y-1 mb-3">
        {subtasks
          .sort((a, b) => a.position - b.position)
          .map((subtask) => (
            <div
              key={subtask.id}
              className="flex items-center gap-2 group py-1"
            >
              <button
                onClick={() => onToggle(subtask.id, !subtask.completed)}
                className={cn(
                  'w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0',
                  subtask.completed
                    ? 'bg-[var(--color-trust)] border-[var(--color-trust)]'
                    : 'border-[var(--border-default)] hover:border-[var(--color-trust)]'
                )}
              >
                {subtask.completed && <Check className="w-3 h-3 text-white" />}
              </button>
              <span
                className={cn(
                  'text-sm flex-1',
                  subtask.completed
                    ? 'text-[var(--text-muted)] line-through'
                    : 'text-[var(--text-primary)]'
                )}
              >
                {subtask.title}
              </span>
              <button
                onClick={() => onDelete(subtask.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded text-[var(--text-muted)] hover:text-[var(--color-error)] transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
      </div>

      {/* Add subtask */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Přidat položku..."
          className="flex-1 px-3 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
        />
        <button
          onClick={handleAdd}
          disabled={!newTitle.trim()}
          className="p-1.5 rounded-lg bg-[var(--color-primary)] text-white disabled:opacity-30 hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
