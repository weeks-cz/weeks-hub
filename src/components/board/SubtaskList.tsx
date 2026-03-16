'use client';

import { useState } from 'react';
import { Check, Trash2, Plus, ChevronRight, ChevronDown as ChevronDownIcon } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils/cn';
import type { Subtask, User } from '@/types/database';

interface SubtaskListProps {
  subtasks: Subtask[];
  onToggle: (subtaskId: string, completed: boolean) => void;
  onDelete: (subtaskId: string) => void;
  onAdd: (title: string) => void;
  onAddChild?: (title: string, parentId: string) => void;
  onUpdate?: (subtaskId: string, updates: { title?: string; assignee_id?: string | null; description?: string | null; completed?: boolean }) => Promise<boolean>;
  users?: User[];
  level?: number;
  parentId?: string | null;
}

export function SubtaskList({ subtasks, onToggle, onDelete, onAdd, onAddChild, onUpdate, users, level = 0, parentId = null }: SubtaskListProps) {
  const [newTitle, setNewTitle] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [assigneeDropdownId, setAssigneeDropdownId] = useState<string | null>(null);

  // Filter subtasks for current level
  const levelSubtasks = subtasks
    .filter((s) => (s.parent_subtask_id || null) === parentId)
    .sort((a, b) => a.position - b.position);

  const allLevelSubtasks = parentId === null ? subtasks.filter((s) => !s.parent_subtask_id) : levelSubtasks;
  const completed = allLevelSubtasks.filter((s) => s.completed).length;
  const total = allLevelSubtasks.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getChildren = (subtaskId: string) =>
    subtasks.filter((s) => s.parent_subtask_id === subtaskId);

  const handleAdd = () => {
    if (newTitle.trim()) {
      onAdd(newTitle.trim());
      setNewTitle('');
    }
  };

  const handleChangeAssignee = async (subtaskId: string, userId: string | null) => {
    if (onUpdate) {
      await onUpdate(subtaskId, { assignee_id: userId });
    }
    setAssigneeDropdownId(null);
  };

  return (
    <div>
      {/* Progress bar — only at top level */}
      {level === 0 && total > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-1.5 bg-[var(--bg-surface-hover)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-trust)] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-[var(--text-muted)] shrink-0">{completed}/{total}</span>
        </div>
      )}

      {/* Subtask items */}
      <div className={cn('space-y-0.5', level > 0 && 'ml-5 mt-1 border-l border-[var(--border-default)] pl-3')}>
        {levelSubtasks.map((subtask) => {
          const children = getChildren(subtask.id);
          const hasChildren = children.length > 0;
          const isExpanded = expandedIds.has(subtask.id);

          return (
            <div key={subtask.id}>
              <div className="flex items-center gap-2 group py-1 rounded-lg hover:bg-[var(--bg-surface-hover)]/50 px-1 -mx-1 transition-colors">
                {/* Expand arrow */}
                {(hasChildren || level < 2) && (
                  <button
                    onClick={() => toggleExpand(subtask.id)}
                    className={cn(
                      'w-4 h-4 flex items-center justify-center shrink-0 text-[var(--text-muted)]',
                      !hasChildren && 'opacity-0'
                    )}
                  >
                    {isExpanded ? <ChevronDownIcon className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </button>
                )}

                {/* Checkbox */}
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

                {/* Title */}
                <span
                  className={cn(
                    'text-sm flex-1 min-w-0 truncate',
                    subtask.completed ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'
                  )}
                >
                  {subtask.title}
                </span>

                {/* Assignee */}
                {users && (
                  <div className="relative shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setAssigneeDropdownId(assigneeDropdownId === subtask.id ? null : subtask.id); }}
                      className={cn(
                        'transition-opacity',
                        subtask.assignee ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      )}
                    >
                      {subtask.assignee ? (
                        <Avatar src={subtask.assignee.avatar_url} customSrc={subtask.assignee.custom_avatar_url} name={subtask.assignee.full_name} size="sm" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-dashed border-[var(--border-default)] flex items-center justify-center">
                          <Plus className="w-2.5 h-2.5 text-[var(--text-muted)]" />
                        </div>
                      )}
                    </button>
                    {assigneeDropdownId === subtask.id && (
                      <div className="absolute right-0 top-full mt-1 z-20 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-lg overflow-hidden min-w-[180px] max-h-48 overflow-y-auto animate-fade-in">
                        <button
                          onClick={() => handleChangeAssignee(subtask.id, null)}
                          className="w-full text-left px-3 py-2 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                        >
                          Odebrat
                        </button>
                        {users.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => handleChangeAssignee(subtask.id, u.id)}
                            className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-[var(--bg-surface-hover)] transition-colors"
                          >
                            <Avatar src={u.avatar_url} customSrc={u.custom_avatar_url} name={u.full_name} size="sm" />
                            {u.full_name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Delete */}
                <button
                  onClick={() => onDelete(subtask.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-[var(--text-muted)] hover:text-[var(--color-error)] transition-all shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Children */}
              {isExpanded && level < 2 && (
                <SubtaskList
                  subtasks={subtasks}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onAdd={(title) => onAddChild?.(title, subtask.id)}
                  onAddChild={onAddChild}
                  onUpdate={onUpdate}
                  users={users}
                  level={level + 1}
                  parentId={subtask.id}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Add subtask */}
      <div className={cn('flex items-center gap-2 mt-2', level > 0 && 'ml-5 pl-3')}>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={level === 0 ? 'Přidat subtask...' : 'Přidat pod-subtask...'}
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
