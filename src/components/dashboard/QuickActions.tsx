'use client';

import { useState } from 'react';
import { Plus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CreateTaskModal } from '@/components/board/CreateTaskModal';
import { CreateEventModal } from '@/components/calendar/CreateEventModal';
import { useTasks } from '@/hooks/useTasks';
import { useEvents } from '@/hooks/useEvents';

export function QuickActions() {
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const { createTask } = useTasks();
  const { createEvent } = useEvents();

  return (
    <>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => setTaskModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Nový task
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setEventModalOpen(true)}>
          <Calendar className="w-4 h-4" />
          Nová událost
        </Button>
      </div>

      <CreateTaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSubmit={createTask}
      />
      <CreateEventModal
        isOpen={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        onSubmit={createEvent}
      />
    </>
  );
}
