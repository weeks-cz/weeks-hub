'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Trash2, Calendar, ChevronDown, Paperclip, MessageSquare, ArrowLeft, Tag } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { LabelSelect } from '@/components/shared/LabelSelect';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SubtaskList } from './SubtaskList';
import { CommentList } from './CommentList';
import { CommentInput } from './CommentInput';
import { AttachmentList } from './AttachmentList';
import { FileUploadZone } from './FileUploadZone';
import { useTaskComments } from '@/hooks/useTaskComments';
import { useTaskAttachments } from '@/hooks/useTaskAttachments';
import { useUsers } from '@/hooks/useUsers';
import { PRIORITY_CONFIG, TASK_COLUMNS, type Task, type TaskStatus, type TaskPriority } from '@/types/database';
import { formatDate } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';

interface TaskDetailPanelProps {
  task: Task | null;
  allTasks: Task[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task> & { labelIds?: string[] }) => Promise<boolean>;
  onDelete: (taskId: string) => Promise<boolean>;
  onMoveTask: (taskId: string, newStatus: TaskStatus, newPosition: number) => Promise<boolean>;
  onAddSubtask: (taskId: string, title: string, parentSubtaskId?: string) => Promise<unknown>;
  onUpdateSubtask: (subtaskId: string, updates: { title?: string; assignee_id?: string | null; description?: string | null; completed?: boolean }) => Promise<boolean>;
  onToggleSubtask: (subtaskId: string, completed: boolean) => Promise<boolean>;
  onDeleteSubtask: (subtaskId: string) => Promise<boolean>;
  onAddChildTask: (parentTaskId: string, title: string) => Promise<unknown>;
  onNavigateToTask: (taskId: string) => void;
}

export function TaskDetailPanel({
  task,
  allTasks,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onMoveTask,
  onAddSubtask,
  onUpdateSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onAddChildTask,
  onNavigateToTask,
}: TaskDetailPanelProps) {
  const { users } = useUsers();
  const { comments, loading: commentsLoading, addComment, updateComment, deleteComment } = useTaskComments(task?.id ?? null);
  const { attachments, uploading, uploadAttachment, deleteAttachment } = useTaskAttachments(task?.id ?? null);

  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [description, setDescription] = useState('');
  const [editingDueDate, setEditingDueDate] = useState(false);
  const [dueDate, setDueDate] = useState('');

  const titleInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Build breadcrumb chain
  const breadcrumb: { id: string; title: string }[] = [];
  if (task) {
    let current: Task | undefined = task;
    const chain: { id: string; title: string }[] = [];
    while (current?.parent_task_id) {
      const parent = allTasks.find((t) => t.id === current!.parent_task_id);
      if (parent) {
        chain.unshift({ id: parent.id, title: parent.title });
        current = parent;
      } else break;
    }
    breadcrumb.push(...chain);
  }

  // Get child tasks for current task
  const childTasks = task ? allTasks.filter((t) => t.parent_task_id === task.id).sort((a, b) => a.position - b.position) : [];

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setDueDate(task.due_date || '');
      setEditingTitle(false);
      setEditingDescription(false);
      setShowAssigneeDropdown(false);
      setShowStatusDropdown(false);
      setShowPriorityDropdown(false);
    }
  }, [task?.id]);

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  if (!task) return null;

  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const currentColumn = TASK_COLUMNS.find((c) => c.id === task.status);

  const saveTitle = async () => {
    if (title.trim() && title.trim() !== task.title) {
      await onUpdate(task.id, { title: title.trim() });
    }
    setEditingTitle(false);
  };

  const saveDescription = async () => {
    if (description !== (task.description || '')) {
      await onUpdate(task.id, { description: description.trim() || null });
    }
    setEditingDescription(false);
  };

  const saveDueDate = async (value: string) => {
    setDueDate(value);
    await onUpdate(task.id, { due_date: value || null });
    setEditingDueDate(false);
  };

  const handleMarkComplete = async () => {
    if (task.status === 'done') {
      await onMoveTask(task.id, 'todo', 0);
    } else {
      await onMoveTask(task.id, 'done', 0);
    }
  };

  const handleChangeAssignee = async (userId: string | null) => {
    await onUpdate(task.id, { assignee_id: userId });
    setShowAssigneeDropdown(false);
  };

  const handleChangeStatus = async (status: TaskStatus) => {
    await onMoveTask(task.id, status, 0);
    setShowStatusDropdown(false);
  };

  const handleChangePriority = async (priority: TaskPriority) => {
    await onUpdate(task.id, { priority });
    setShowPriorityDropdown(false);
  };

  const handleDelete = async () => {
    await onDelete(task.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop — mobile only */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
              onClick={onClose}
            />

            {/* Panel */}
            <motion.div
              ref={panelRef}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[480px] lg:w-[560px] xl:w-[640px] bg-[var(--bg-surface)] border-l border-[var(--border-default)] shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)] shrink-0">
                <div className="flex items-center gap-2">
                  <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <button onClick={onClose} className="hidden lg:block p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={task.status === 'done' ? 'secondary' : 'primary'}
                    onClick={handleMarkComplete}
                  >
                    <Check className="w-4 h-4" />
                    {task.status === 'done' ? 'Znovu otevřít' : 'Dokončit'}
                  </Button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 lg:p-6 space-y-5">
                  {/* Breadcrumb */}
                  {breadcrumb.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] flex-wrap">
                      {breadcrumb.map((item, i) => (
                        <span key={item.id} className="flex items-center gap-1">
                          <button
                            onClick={() => onNavigateToTask(item.id)}
                            className="hover:text-[var(--color-primary)] transition-colors truncate max-w-[150px]"
                          >
                            {item.title}
                          </button>
                          <span>›</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Title */}
                  {editingTitle ? (
                    <input
                      ref={titleInputRef}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onBlur={saveTitle}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setTitle(task.title); setEditingTitle(false); } }}
                      className="w-full text-xl font-bold text-[var(--text-primary)] bg-transparent border-b-2 border-[var(--color-primary)] outline-none pb-1 font-[family-name:var(--font-heading)]"
                    />
                  ) : (
                    <h2
                      onClick={() => setEditingTitle(true)}
                      className="text-xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-heading)] cursor-text hover:bg-[var(--bg-surface-hover)] rounded-lg px-1 -mx-1 py-0.5 transition-colors"
                    >
                      {task.title}
                    </h2>
                  )}

                  {/* Meta bar */}
                  <div className="flex flex-wrap gap-2">
                    {/* Status */}
                    <div className="relative">
                      <button
                        onClick={() => { setShowStatusDropdown(!showStatusDropdown); setShowAssigneeDropdown(false); setShowPriorityDropdown(false); }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface-hover)] text-sm text-[var(--text-secondary)] hover:bg-[var(--border-default)] transition-colors"
                      >
                        {currentColumn?.title || task.status}
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      {showStatusDropdown && (
                        <div className="absolute top-full mt-1 left-0 z-10 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-lg overflow-hidden min-w-[160px] animate-fade-in">
                          {TASK_COLUMNS.map((col) => (
                            <button
                              key={col.id}
                              onClick={() => handleChangeStatus(col.id)}
                              className={cn(
                                'w-full text-left px-3 py-2 text-sm hover:bg-[var(--bg-surface-hover)] transition-colors',
                                task.status === col.id ? 'text-[var(--color-primary)] font-medium' : 'text-[var(--text-primary)]'
                              )}
                            >
                              {col.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Priority */}
                    <div className="relative">
                      <button
                        onClick={() => { setShowPriorityDropdown(!showPriorityDropdown); setShowAssigneeDropdown(false); setShowStatusDropdown(false); }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors"
                        style={{ backgroundColor: `${priorityConfig.color}15`, color: priorityConfig.color }}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: priorityConfig.color }} />
                        {priorityConfig.label}
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      {showPriorityDropdown && (
                        <div className="absolute top-full mt-1 left-0 z-10 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-lg overflow-hidden min-w-[140px] animate-fade-in">
                          {(Object.entries(PRIORITY_CONFIG) as [TaskPriority, typeof priorityConfig][]).map(([key, config]) => (
                            <button
                              key={key}
                              onClick={() => handleChangePriority(key)}
                              className={cn(
                                'w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-[var(--bg-surface-hover)] transition-colors',
                                task.priority === key ? 'font-medium' : ''
                              )}
                            >
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                              <span style={{ color: task.priority === key ? config.color : undefined }}>{config.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Due date */}
                    {editingDueDate ? (
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => saveDueDate(e.target.value)}
                        onBlur={() => setEditingDueDate(false)}
                        autoFocus
                        className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface-hover)] text-sm text-[var(--text-primary)] border border-[var(--color-primary)] outline-none"
                      />
                    ) : (
                      <button
                        onClick={() => setEditingDueDate(true)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface-hover)] text-sm text-[var(--text-secondary)] hover:bg-[var(--border-default)] transition-colors"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        {task.due_date ? formatDate(task.due_date) : 'Termín'}
                      </button>
                    )}

                    {/* Assignee */}
                    <div className="relative">
                      <button
                        onClick={() => { setShowAssigneeDropdown(!showAssigneeDropdown); setShowStatusDropdown(false); setShowPriorityDropdown(false); }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface-hover)] text-sm text-[var(--text-secondary)] hover:bg-[var(--border-default)] transition-colors"
                      >
                        {task.assignee ? (
                          <>
                            <Avatar src={task.assignee.avatar_url} customSrc={task.assignee.custom_avatar_url} name={task.assignee.full_name} size="sm" />
                            <span className="max-w-[100px] truncate">{task.assignee.full_name}</span>
                          </>
                        ) : (
                          <span className="text-[var(--text-muted)]">Přiřadit</span>
                        )}
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      {showAssigneeDropdown && (
                        <div className="absolute top-full mt-1 left-0 z-10 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-lg overflow-hidden min-w-[200px] max-h-64 overflow-y-auto animate-fade-in">
                          <button
                            onClick={() => handleChangeAssignee(null)}
                            className="w-full text-left px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                          >
                            Odebrat přiřazení
                          </button>
                          {users.map((u) => (
                            <button
                              key={u.id}
                              onClick={() => handleChangeAssignee(u.id)}
                              className={cn(
                                'w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-[var(--bg-surface-hover)] transition-colors',
                                task.assignee_id === u.id ? 'text-[var(--color-primary)] font-medium' : 'text-[var(--text-primary)]'
                              )}
                            >
                              <Avatar src={u.avatar_url} customSrc={u.custom_avatar_url} name={u.full_name} size="sm" />
                              {u.full_name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Labels */}
                  <div>
                    <LabelSelect
                      value={task.labels?.map((l) => l.id) || []}
                      onChange={(labelIds) => onUpdate(task.id, { labelIds })}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">Popis</label>
                    {editingDescription ? (
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onBlur={saveDescription}
                        onKeyDown={(e) => { if (e.key === 'Escape') { setDescription(task.description || ''); setEditingDescription(false); } }}
                        autoFocus
                        rows={4}
                        className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--color-primary)] rounded-xl text-sm text-[var(--text-primary)] outline-none resize-y"
                        placeholder="Přidej popis..."
                      />
                    ) : (
                      <div
                        onClick={() => setEditingDescription(true)}
                        className={cn(
                          'min-h-[60px] px-3 py-2 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-default)] text-sm cursor-text hover:border-[var(--color-primary)]/30 transition-colors',
                          task.description ? 'text-[var(--text-primary)] whitespace-pre-wrap' : 'text-[var(--text-muted)] italic'
                        )}
                      >
                        {task.description || 'Přidej popis...'}
                      </div>
                    )}
                  </div>

                  {/* Child Tasks (Subtasks as real tasks) */}
                  <ChildTasksSection
                    childTasks={childTasks}
                    onAddChild={(title) => onAddChildTask(task.id, title)}
                    onNavigate={onNavigateToTask}
                    onToggleComplete={async (childId) => {
                      const child = allTasks.find((t) => t.id === childId);
                      if (child) {
                        await onMoveTask(childId, child.status === 'done' ? 'todo' : 'done', 0);
                      }
                    }}
                    onDelete={onDelete}
                  />

                  {/* Legacy subtasks (checklist) */}
                  {task.subtasks && task.subtasks.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">Checklist</label>
                      <SubtaskList
                        subtasks={task.subtasks}
                        onToggle={onToggleSubtask}
                        onDelete={onDeleteSubtask}
                        onAdd={(title) => onAddSubtask(task.id, title)}
                        onAddChild={(title, parentId) => onAddSubtask(task.id, title, parentId)}
                        onUpdate={onUpdateSubtask}
                        users={users}
                      />
                    </div>
                  )}

                  {/* Attachments */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                      <Paperclip className="w-3.5 h-3.5" />
                      Přílohy ({attachments.length})
                    </label>
                    <AttachmentList attachments={attachments} onDelete={deleteAttachment} />
                    <FileUploadZone onUpload={(file) => uploadAttachment(file)} uploading={uploading} />
                  </div>

                  {/* Comments */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Komentáře ({comments.length})
                    </label>
                    <CommentList comments={comments} onUpdate={updateComment} onDelete={deleteComment} />
                    <CommentInput
                      onSubmit={(content) => addComment(content, task.assignee_id)}
                      users={users}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Smazat task"
        message="Opravdu chceš smazat tento task? Tato akce je nevratná."
        confirmLabel="Smazat"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}

// --- Child Tasks Section (subtasks as full tasks) ---

import { Plus, Check as CheckIcon, ChevronRight } from 'lucide-react';

function ChildTasksSection({
  childTasks,
  onAddChild,
  onNavigate,
  onToggleComplete,
  onDelete,
}: {
  childTasks: Task[];
  onAddChild: (title: string) => void;
  onNavigate: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
  onDelete: (taskId: string) => Promise<boolean>;
}) {
  const [newTitle, setNewTitle] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleAdd = () => {
    if (newTitle.trim()) {
      onAddChild(newTitle.trim());
      setNewTitle('');
    }
  };

  const completedCount = childTasks.filter((t) => t.status === 'done').length;
  const progress = childTasks.length > 0 ? (completedCount / childTasks.length) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
          Subtasky ({completedCount}/{childTasks.length})
        </label>
        <button
          onClick={() => setShowInput(!showInput)}
          className="text-xs text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors"
        >
          + Přidat
        </button>
      </div>

      {/* Progress */}
      {childTasks.length > 0 && (
        <div className="h-1.5 bg-[var(--bg-surface-hover)] rounded-full mb-3 overflow-hidden">
          <div
            className="h-full bg-[var(--color-trust)] rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Child task list */}
      <div className="space-y-1 mb-2">
        {childTasks.map((child) => {
          const isDone = child.status === 'done';
          return (
            <div
              key={child.id}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-surface-hover)]/50 transition-colors group"
            >
              {/* Complete checkbox */}
              <button
                onClick={(e) => { e.stopPropagation(); onToggleComplete(child.id); }}
                className={cn(
                  'w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0',
                  isDone
                    ? 'bg-[var(--color-trust)] border-[var(--color-trust)]'
                    : 'border-[var(--border-default)] hover:border-[var(--color-trust)]'
                )}
              >
                {isDone && <CheckIcon className="w-3 h-3 text-white" />}
              </button>

              {/* Click to navigate */}
              <button
                onClick={() => onNavigate(child.id)}
                className="flex-1 min-w-0 text-left flex items-center gap-2"
              >
                <span className={cn(
                  'text-sm truncate',
                  isDone ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'
                )}>
                  {child.title}
                </span>
                {child.assignee && (
                  <Avatar
                    src={child.assignee.avatar_url}
                    customSrc={child.assignee.custom_avatar_url}
                    name={child.assignee.full_name}
                    size="sm"
                    className="shrink-0"
                  />
                )}
                <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-auto" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add child task input */}
      {showInput && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowInput(false); }}
            placeholder="Nový subtask..."
            autoFocus
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
      )}
    </div>
  );
}
