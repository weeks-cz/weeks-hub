'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { DatePicker } from '@/components/ui/DatePicker';
import { PrioritySelect } from '@/components/shared/PrioritySelect';
import { UserSelect } from '@/components/shared/UserSelect';
import { LabelSelect } from '@/components/shared/LabelSelect';
import type { TaskStatus, TaskPriority } from '@/types/database';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    due_date?: string | null;
    assignee_id?: string | null;
    labelIds?: string[];
  }) => Promise<unknown>;
  defaultStatus?: TaskStatus;
}

export function CreateTaskModal({ isOpen, onClose, onSubmit, defaultStatus = 'todo' }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      status: defaultStatus,
      priority,
      due_date: dueDate || null,
      assignee_id: assigneeId,
      labelIds,
    });
    setIsSubmitting(false);

    // Reset and close
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setAssigneeId(null);
    setLabelIds([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nový task" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Název"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Co je potřeba udělat?"
          autoFocus
          required
        />

        <Textarea
          label="Popis"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detailnější popis (markdown)"
          rows={3}
        />

        <PrioritySelect value={priority} onChange={setPriority} />

        <div className="grid grid-cols-2 gap-4">
          <DatePicker
            label="Due date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <UserSelect
            value={assigneeId}
            onChange={setAssigneeId}
          />
        </div>

        <LabelSelect value={labelIds} onChange={setLabelIds} />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Zrušit
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={!title.trim()}>
            Vytvořit task
          </Button>
        </div>
      </form>
    </Modal>
  );
}
