'use client';

import { useState, useCallback } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { BoardColumn } from './BoardColumn';
import { CreateTaskModal } from './CreateTaskModal';
import { TaskDetailModal } from './TaskDetailModal';
import { useTasks } from '@/hooks/useTasks';
import { TASK_COLUMNS, type Task, type TaskStatus, type TaskPriority } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { BoardSkeleton } from '@/components/ui/Skeleton';
import { Plus, Filter } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';

export function KanbanBoard() {
  const [filters, setFilters] = useState<{
    assigneeId?: string | null;
    priority?: TaskPriority | null;
  }>({});
  const [showFilters, setShowFilters] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<TaskStatus>('todo');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const {
    tasks,
    loading,
    createTask,
    updateTask,
    moveTask,
    deleteTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    getTasksByStatus,
  } = useTasks(filters);
  const { users } = useUsers();

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { draggableId, destination, source } = result;
      if (!destination) return;
      if (destination.droppableId === source.droppableId && destination.index === source.index) return;

      const newStatus = destination.droppableId as TaskStatus;
      const newPosition = destination.index;

      // Optimistic update
      await moveTask(draggableId, newStatus, newPosition);
    },
    [moveTask]
  );

  const handleAddTask = (status: TaskStatus) => {
    setCreateStatus(status);
    setCreateModalOpen(true);
  };

  if (loading) return <BoardSkeleton />;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
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
        <div className="flex flex-wrap items-end gap-3 mb-4 p-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] animate-slide-down">
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

      {/* Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {TASK_COLUMNS.map((column) => (
            <BoardColumn
              key={column.id}
              id={column.id}
              title={column.title}
              tasks={getTasksByStatus(column.id)}
              onTaskClick={(task) => setSelectedTask(task)}
              onAddTask={handleAddTask}
            />
          ))}
        </div>
      </DragDropContext>

      {/* Modals */}
      <CreateTaskModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={createTask}
        defaultStatus={createStatus}
      />

      <TaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={updateTask}
        onDelete={deleteTask}
        onAddSubtask={addSubtask}
        onToggleSubtask={toggleSubtask}
        onDeleteSubtask={deleteSubtask}
      />
    </div>
  );
}
