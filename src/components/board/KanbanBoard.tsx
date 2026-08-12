'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { BoardColumn } from './BoardColumn';
import { CreateTaskModal } from './CreateTaskModal';
import { TaskDetailPanel } from './TaskDetailPanel';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { TASK_COLUMNS, type Label, type Task, type TaskStatus, type TaskPriority } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { BoardSkeleton } from '@/components/ui/Skeleton';
import { Plus, Filter, Search, X } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { buildSubtaskStatsMap } from '@/lib/utils/subtasks';
import { obsahuje } from '@/lib/utils/text';

/** Kolik hotových úkolů se ukáže hned. Zbytek na vyžádání. */
const LIMIT_HOTOVYCH = 8;

export function KanbanBoard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  // Přiřazený a priorita jdou na server (indexované sloupce), štítek a hledání
  // se řeší v klientovi — jinak by se refetchovalo při každém napsaném znaku
  // a seznam štítků by se sám osekal na ten právě vybraný.
  const [filters, setFilters] = useState<{
    assigneeId?: string | null;
    priority?: TaskPriority | null;
  }>({});
  const [labelId, setLabelId] = useState<string | null>(null);
  const [hledani, setHledani] = useState('');
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

  // Nabízejí se jen štítky, které se v aktuálním výběru opravdu vyskytují —
  // filtr, po kterém nic nezbude, je jen past.
  const stitky = useMemo(() => {
    const mapa = new Map<string, Label>();
    for (const t of tasks) {
      for (const l of t.labels ?? []) mapa.set(l.id, l);
    }
    return [...mapa.values()].sort((a, b) => a.name.localeCompare(b.name, 'cs'));
  }, [tasks]);

  const dotaz = hledani.trim();

  const sloupec = (status: TaskStatus): Task[] => {
    let seznam = getTasksByStatus(status);
    if (labelId) seznam = seznam.filter((t) => t.labels?.some((l) => l.id === labelId));
    if (dotaz) {
      seznam = seznam.filter((t) => obsahuje(t.title, dotaz) || obsahuje(t.description, dotaz));
    }
    return seznam;
  };

  const pocetVysledku = dotaz
    ? TASK_COLUMNS.reduce((soucet, c) => soucet + sloupec(c.id).length, 0)
    : 0;

  const aktivnichFiltru =
    (filters.assigneeId ? 1 : 0) + (filters.priority ? 1 : 0) + (labelId ? 1 : 0);

  const jenMoje = filters.assigneeId === user?.id && !!user?.id;

  const resetovat = () => {
    setFilters({});
    setLabelId(null);
    setHledani('');
  };

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
        <div className="flex flex-wrap items-center gap-2 mb-4 shrink-0">
          {/* Hledání je nejčastější potřeba při 270 úkolech, proto není
              schované pod Filtry. */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="search"
              value={hledani}
              onChange={(e) => setHledani(e.target.value)}
              placeholder="Hledat úkol…"
              aria-label="Hledat úkol"
              className="w-full pl-8 pr-8 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--color-primary)] outline-none transition-colors"
            />
            {hledani && (
              <button
                onClick={() => setHledani('')}
                aria-label="Zrušit hledání"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {user?.id && (
            <Button
              variant={jenMoje ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() =>
                setFilters((f) => ({ ...f, assigneeId: jenMoje ? null : user.id }))
              }
            >
              Jen moje
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4" />
            Filtry
            {aktivnichFiltru > 0 && (
              <span className="ml-1 px-1.5 rounded-full bg-[var(--color-primary)] text-white text-[10px] tabular-nums">
                {aktivnichFiltru}
              </span>
            )}
          </Button>

          {(aktivnichFiltru > 0 || dotaz) && (
            <button
              onClick={resetovat}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              Zrušit vše
            </button>
          )}

          <div className="ml-auto">
            <Button size="sm" onClick={() => handleAddTask('todo')}>
              <Plus className="w-4 h-4" />
              Nový task
            </Button>
          </div>
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
            {stitky.length > 0 && (
              <Select
                label="Štítek"
                options={[
                  { value: '', label: 'Všechny' },
                  ...stitky.map((l) => ({ value: l.id, label: l.name })),
                ]}
                value={labelId || ''}
                onChange={(e) => setLabelId(e.target.value || null)}
              />
            )}
            <Button variant="ghost" size="sm" onClick={resetovat}>
              Resetovat
            </Button>
          </div>
        )}

        {dotaz && (
          <p className="text-xs text-[var(--text-muted)] mb-2 shrink-0">
            {pocetVysledku === 0
              ? `Na „${dotaz}" nic nesedí.`
              : `${pocetVysledku} ${pocetVysledku === 1 ? 'výsledek' : pocetVysledku <= 4 ? 'výsledky' : 'výsledků'} pro „${dotaz}"`}
          </p>
        )}

        {/* Board columns */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
            {TASK_COLUMNS.map((column) => (
              <BoardColumn
                key={column.id}
                id={column.id}
                title={column.title}
                tasks={sloupec(column.id)}
                subtaskStats={subtaskStats}
                onTaskClick={openTask}
                onAddTask={handleAddTask}
                onQuickComplete={handleQuickComplete}
                // Hotových se za rok nasbírá přes padesát a nikdo je nescrolluje.
                // Při hledání se ale musí ukázat všechny nálezy.
                limit={column.id === 'done' && !dotaz ? LIMIT_HOTOVYCH : undefined}
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
