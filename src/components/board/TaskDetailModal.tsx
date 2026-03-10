'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { DatePicker } from '@/components/ui/DatePicker';
import { PrioritySelect } from '@/components/shared/PrioritySelect';
import { UserSelect } from '@/components/shared/UserSelect';
import { LabelSelect } from '@/components/shared/LabelSelect';
import { SubtaskList } from './SubtaskList';
import { Trash2 } from 'lucide-react';
import { PRIORITY_CONFIG, type Task, type TaskPriority } from '@/types/database';
import { formatDate } from '@/lib/utils/date';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task> & { labelIds?: string[] }) => Promise<boolean>;
  onDelete: (taskId: string) => Promise<boolean>;
  onAddSubtask: (taskId: string, title: string) => Promise<unknown>;
  onToggleSubtask: (subtaskId: string, completed: boolean) => Promise<boolean>;
  onDeleteSubtask: (subtaskId: string) => Promise<boolean>;
}

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [labelIds, setLabelIds] = useState<string[]>([]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setDueDate(task.due_date || '');
      setAssigneeId(task.assignee_id);
      setLabelIds(task.labels?.map((l) => l.id) || []);
      setIsEditing(false);
    }
  }, [task]);

  if (!task) return null;

  const handleSave = async () => {
    await onUpdate(task.id, {
      title,
      description: description || null,
      priority,
      due_date: dueDate || null,
      assignee_id: assigneeId,
      labelIds,
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Opravdu smazat tento task?')) {
      await onDelete(task.id);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Upravit task' : task.title} size="lg">
      <div className="space-y-5">
        {isEditing ? (
          <>
            <Input
              label="Název"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              label="Popis"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
            <PrioritySelect value={priority} onChange={setPriority} />
            <div className="grid grid-cols-2 gap-4">
              <DatePicker
                label="Due date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
              <UserSelect value={assigneeId} onChange={setAssigneeId} />
            </div>
            <LabelSelect value={labelIds} onChange={setLabelIds} />
            <div className="flex justify-between pt-2">
              <Button variant="danger" onClick={handleDelete} size="sm">
                <Trash2 className="w-4 h-4" />
                Smazat
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setIsEditing(false)}>
                  Zrušit
                </Button>
                <Button onClick={handleSave}>
                  Uložit změny
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Info row */}
            <div className="flex flex-wrap items-center gap-3">
              <Badge color={PRIORITY_CONFIG[task.priority].color}>
                {PRIORITY_CONFIG[task.priority].label}
              </Badge>
              {task.labels?.map((label) => (
                <Badge key={label.id} color={label.color}>
                  {label.name}
                </Badge>
              ))}
              {task.due_date && (
                <span className="text-sm text-[var(--text-muted)]">
                  Due: {formatDate(task.due_date)}
                </span>
              )}
            </div>

            {/* Assignee */}
            {task.assignee && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--text-muted)]">Assignee:</span>
                <Avatar src={task.assignee.avatar_url} name={task.assignee.full_name} size="sm" />
                <span className="text-sm text-[var(--text-primary)]">{task.assignee.full_name}</span>
              </div>
            )}

            {/* Description */}
            {task.description ? (
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Popis</label>
                <div className="text-sm text-[var(--text-primary)] whitespace-pre-wrap bg-[var(--bg-primary)] rounded-xl p-3 border border-[var(--border-default)]">
                  {task.description}
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)] italic">Žádný popis</p>
            )}

            {/* Subtasks */}
            <SubtaskList
              subtasks={task.subtasks || []}
              onToggle={onToggleSubtask}
              onDelete={onDeleteSubtask}
              onAdd={(title) => onAddSubtask(task.id, title)}
            />

            {/* Actions */}
            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                Upravit
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
