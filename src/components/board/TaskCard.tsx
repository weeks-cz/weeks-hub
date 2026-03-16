'use client';

import { Draggable } from '@hello-pangea/dnd';
import { Calendar, MessageSquare, Paperclip, Check } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { PRIORITY_CONFIG, type Task } from '@/types/database';
import { formatDateShort } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: () => void;
  onQuickComplete?: (taskId: string) => void;
}

export function TaskCard({ task, index, onClick, onQuickComplete }: TaskCardProps) {
  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length ?? 0;
  const totalSubtasks = task.subtasks?.length ?? 0;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;
  const commentCount = task.comments?.length ?? 0;
  const attachmentCount = task.attachments?.length ?? 0;
  const isDone = task.status === 'done';

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={cn(
            'bg-[var(--bg-surface)] border rounded-xl p-3 cursor-pointer hover:border-[var(--color-primary)]/30 hover:-translate-y-[1px] hover:shadow-md hover:shadow-black/10 transition-all duration-200 group relative border-l-[3px]',
            snapshot.isDragging && 'shadow-lg shadow-[var(--color-primary)]/10 border-[var(--color-primary)]/50 rotate-2',
            isDone ? 'opacity-60 border-l-[var(--color-trust)]' : ''
          )}
          style={{
            ...provided.draggableProps.style,
            borderLeftColor: isDone ? undefined : priorityConfig.color,
            borderRightColor: 'var(--border-default)',
            borderTopColor: 'var(--border-default)',
            borderBottomColor: 'var(--border-default)',
          }}
        >
          {/* Quick complete button — appears on hover */}
          {onQuickComplete && (
            <button
              onClick={(e) => { e.stopPropagation(); onQuickComplete(task.id); }}
              className={cn(
                'absolute top-2 left-2 w-5 h-5 rounded border flex items-center justify-center transition-all z-10',
                isDone
                  ? 'bg-[var(--color-trust)] border-[var(--color-trust)]'
                  : 'border-[var(--border-default)] opacity-0 group-hover:opacity-100 hover:border-[var(--color-trust)] hover:bg-[var(--color-trust)]/10'
              )}
            >
              {isDone && <Check className="w-3 h-3 text-white" />}
            </button>
          )}

          {/* Assignee avatar — top right */}
          {task.assignee && (
            <div className="absolute -top-1.5 -right-1.5 z-10">
              <Avatar
                src={task.assignee.avatar_url}
                customSrc={task.assignee.custom_avatar_url}
                name={task.assignee.full_name}
                size="sm"
                className="border-2 border-[var(--bg-primary)] !w-7 !h-7"
              />
            </div>
          )}

          {/* Labels */}
          {task.labels && task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2 mr-6">
              {task.labels.map((label) => (
                <Badge key={label.id} color={label.color}>
                  {label.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Title */}
          <h4 className={cn(
            'text-sm font-medium mb-2 line-clamp-2',
            isDone ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]',
            !task.labels?.length && task.assignee && 'mr-6'
          )}>
            {task.title}
          </h4>

          {/* Bottom row — meta info */}
          <div className="flex items-center gap-2 flex-wrap">
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
                ✓ {completedSubtasks}/{totalSubtasks}
              </span>
            )}

            {/* Comment count */}
            {commentCount > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-[var(--text-muted)]">
                <MessageSquare className="w-3 h-3" />
                {commentCount}
              </span>
            )}

            {/* Attachment count */}
            {attachmentCount > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-[var(--text-muted)]">
                <Paperclip className="w-3 h-3" />
                {attachmentCount}
              </span>
            )}
          </div>

          {/* Subtask progress bar */}
          {totalSubtasks > 0 && (
            <div className="h-0.5 bg-[var(--bg-surface-hover)] rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-[var(--color-trust)] rounded-full transition-all duration-300"
                style={{ width: `${subtaskProgress}%` }}
              />
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
