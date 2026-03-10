'use client';

import { Droppable } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { cn } from '@/lib/utils/cn';
import type { Task, TaskStatus } from '@/types/database';

interface BoardColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
}

export function BoardColumn({ id, title, tasks, onTaskClick, onAddTask }: BoardColumnProps) {
  return (
    <div className="flex flex-col bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-default)] min-w-[280px] w-[280px] max-h-[calc(100vh-160px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
          <span className="px-2 py-0.5 bg-[var(--bg-surface-hover)] text-[var(--text-muted)] text-xs rounded-full">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(id)}
          className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
          title="Přidat task"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px]',
              snapshot.isDraggingOver && 'bg-[var(--color-primary)]/5 rounded-b-2xl'
            )}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onClick={() => onTaskClick(task)}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
