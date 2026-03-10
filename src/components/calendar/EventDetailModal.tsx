'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Avatar } from '@/components/ui/Avatar';
import { Trash2 } from 'lucide-react';
import { EVENT_TYPE_CONFIG, type CalendarEvent, type EventType } from '@/types/database';
import { formatDateTime, formatDate } from '@/lib/utils/date';

interface EventDetailModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (eventId: string, updates: Partial<CalendarEvent>) => Promise<boolean>;
  onDelete: (eventId: string) => Promise<boolean>;
}

export function EventDetailModal({ event, isOpen, onClose, onUpdate, onDelete }: EventDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<EventType>('meeting');

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || '');
      setEventType(event.event_type);
      setIsEditing(false);
    }
  }, [event]);

  if (!event) return null;

  const config = EVENT_TYPE_CONFIG[event.event_type];
  const color = event.color || config.color;

  const handleSave = async () => {
    await onUpdate(event.id, { title, description: description || null, event_type: eventType });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Opravdu smazat tuto událost?')) {
      await onDelete(event.id);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Upravit událost' : event.title} size="md">
      <div className="space-y-4">
        {isEditing ? (
          <>
            <Input label="Název" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea label="Popis" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            <Select
              label="Typ"
              options={Object.entries(EVENT_TYPE_CONFIG).map(([key, c]) => ({ value: key, label: c.label }))}
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
            />
            <div className="flex justify-between pt-2">
              <Button variant="danger" size="sm" onClick={handleDelete}>
                <Trash2 className="w-4 h-4" /> Smazat
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setIsEditing(false)}>Zrušit</Button>
                <Button onClick={handleSave}>Uložit</Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-sm font-medium" style={{ color }}>{config.label}</span>
            </div>

            <div className="text-sm text-[var(--text-secondary)]">
              {event.all_day
                ? formatDate(event.start_date)
                : formatDateTime(event.start_date)}
              {event.end_date && (
                <>
                  {' → '}
                  {event.all_day
                    ? formatDate(event.end_date)
                    : formatDateTime(event.end_date)}
                </>
              )}
            </div>

            {event.description && (
              <div className="text-sm text-[var(--text-primary)] whitespace-pre-wrap bg-[var(--bg-primary)] rounded-xl p-3 border border-[var(--border-default)]">
                {event.description}
              </div>
            )}

            {event.attendees && event.attendees.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Účastníci</label>
                <div className="flex flex-wrap gap-2">
                  {event.attendees.map((attendee) => (
                    <div key={attendee.id} className="flex items-center gap-1.5 bg-[var(--bg-primary)] px-2 py-1 rounded-lg">
                      <Avatar src={attendee.avatar_url} name={attendee.full_name} size="sm" />
                      <span className="text-xs text-[var(--text-primary)]">{attendee.full_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {event.creator && (
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                Vytvořil/a:
                <Avatar src={event.creator.avatar_url} name={event.creator.full_name} size="sm" />
                {event.creator.full_name}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setIsEditing(true)}>Upravit</Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
