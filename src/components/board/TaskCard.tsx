'use client';

import { Draggable } from '@hello-pangea/dnd';
import { Calendar, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { PRIORITY_CONFIG, type Task } from '@/types/database';
import { formatDateShort } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: () => void;
}

export function TaskCard({ task, index, onClick }: TaskCardProps) {
  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length ?? 0;
  const totalSubtasks = task.subtasks?.length ?? 0;

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={cn(
            'bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-3 cursor-pointer hover:border-[var(--color-primary)]/30 hover:-translate-y-[1px] hover:shadow-md hover:shadow-black/10 transition-all duration-200 group',
            snapshot.isDragging && 'shadow-lg shadow-[var(--color-primary)]/10 border-[var(--color-primary)]/50 rotate-2'
          )}
        >
          {/* Labels */}
          {task.labels && task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {task.labels.map((label) => (
                <Badge key={label.id} color={label.color}>
                  {label.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Title */}
          <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2 line-clamp-2">
            {task.title}
          </h4>

          {/* Bottom row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Priority badge */}
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: priorityConfig.color }}
                title={priorityConfig.label}
              />

              {/* Due date */}
              {task.due_date && (
                <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                  <Calendar className="w-3 h-3" />
                  {formatDateShort(task.due_date)}
                </span>
              )}

              {/* Subtask count */}
              {totalSubtasks > 0 && (
                <span className="text-xs text-[var(--text-muted)]">
                  {completedSubtasks}/{totalSubtasks}
                </span>
              )}
            </div>

            {/* Assignee */}
            {task.assignee && (
              <Avatar
                src={task.assignee.avatar_url}
                name={task.assignee.full_name}
                size="sm"
              />
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
