'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { BoardColumn } from './BoardColumn';
import { CreateTaskModal } from './CreateTaskModal';
import { TaskDetailPanel } from './TaskDetailPanel';
import { useTasks } from '@/hooks/useTasks';
import { TASK_COLUMNS, type Task, type TaskStatus, type TaskPriority } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { BoardSkeleton } from '@/components/ui/Skeleton';
import { Plus, Filter } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { buildSubtaskStatsMap } from '@/lib/utils/subtasks';

export function KanbanBoard() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [filters, setFilters] = useState<{
    assigneeId?: string | null;
    priority?: TaskPriority | null;
  }>({});
  const [showFilters, setShowFilters] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<TaskStatus>('todo');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const {
    tasks,
    loading,
    createTask,
    updateTask,
    moveTask,
    deleteTask,
    addSubtask,
    updateSubtask,
    toggleSubtask,
    deleteSubtask,
    getTasksByStatus,
    addChildTask,
  } = useTasks(filters);
  const { users } = useUsers();

  // Sync selected task with URL
  useEffect(() => {
    const taskParam = searchParams.get('task');
    if (taskParam && !loading) {
      setSelectedTaskId(taskParam);
    }
  }, [searchParams, loading]);

  const selectedTask = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) || null : null;

  // Cards can't see their own child tasks, so counts are derived from the full list here.
  const subtaskStats = useMemo(() => buildSubtaskStatsMap(tasks), [tasks]);

  const openTask = (task: Task) => {
    setSelectedTaskId(task.id);
    router.replace(`/board?task=${task.id}`, { scroll: false });
  };

  const closeTask = () => {
    setSelectedTaskId(null);
    router.replace('/board', { scroll: false });
  };

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { draggableId, destination, source } = result;
      if (!destination) return;
      if (destination.droppableId === source.droppableId && destination.index === source.index) return;

      const newStatus = destination.droppableId as TaskStatus;
      const newPosition = destination.index;

      await moveTask(draggableId, newStatus, newPosition);
    },
    [moveTask]
  );

  const handleAddTask = (status: TaskStatus) => {
    setCreateStatus(status);
    setCreateModalOpen(true);
  };

  const handleQuickComplete = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (task.status === 'done') {
      await moveTask(taskId, 'todo', 0);
    } else {
      await moveTask(taskId, 'done', 0);
    }
  };

  if (loading) return <BoardSkeleton />;

  return (
    <div className="flex gap-0 h-[calc(100vh-120px)]">
      {/* Board area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              Filtry
            </Button>
          </div>
          <Button size="sm" onClick={() => handleAddTask('todo')}>
            <Plus className="w-4 h-4" />
            Nový task
          </Button>
        </div>

        {/* Filters bar */}
        {showFilters && (
          <div className="flex flex-wrap items-end gap-3 mb-4 p-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] animate-slide-down shrink-0">
            <Select
              label="Přiřazený"
              options={[
                { value: '', label: 'Všichni' },
                ...users.map((u) => ({ value: u.id, label: u.full_name })),
              ]}
              value={filters.assigneeId || ''}
              onChange={(e) =>
                setFilters((f) => ({ ...f, assigneeId: e.target.value || null }))
              }
            />
            <Select
              label="Priorita"
              options={[
                { value: '', label: 'Všechny' },
                { value: 'urgent', label: 'Urgentní' },
                { value: 'high', label: 'Vysoká' },
                { value: 'medium', label: 'Střední' },
                { value: 'low', label: 'Nízká' },
              ]}
              value={filters.priority || ''}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  priority: (e.target.value as TaskPriority) || null,
                }))
              }
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({})}
            >
              Resetovat
            </Button>
          </div>
        )}

        {/* Board columns */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
            {TASK_COLUMNS.map((column) => (
              <BoardColumn
                key={column.id}
                id={column.id}
                title={column.title}
                tasks={getTasksByStatus(column.id)}
                subtaskStats={subtaskStats}
                onTaskClick={openTask}
                onAddTask={handleAddTask}
                onQuickComplete={handleQuickComplete}
              />
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Task Detail Panel */}
      <TaskDetailPanel
        task={selectedTask}
        allTasks={tasks}
        isOpen={!!selectedTaskId}
        onClose={closeTask}
        onUpdate={updateTask}
        onDelete={deleteTask}
        onMoveTask={moveTask}
        onAddSubtask={addSubtask}
        onUpdateSubtask={updateSubtask}
        onToggleSubtask={toggleSubtask}
        onDeleteSubtask={deleteSubtask}
        onAddChildTask={addChildTask}
        onNavigateToTask={(taskId) => {
          setSelectedTaskId(taskId);
          router.replace(`/board?task=${taskId}`, { scroll: false });
        }}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={createTask}
        defaultStatus={createStatus}
      />
    </div>
  );
}
