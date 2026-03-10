'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
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

// Helper to extract date part (YYYY-MM-DD) from ISO string
function toDateString(iso: string): string {
  return iso.split('T')[0];
}

// Helper to extract time part (HH:MM) from ISO string
function toTimeString(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function EventDetailModal({ event, isOpen, onClose, onUpdate, onDelete }: EventDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<EventType>('meeting');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');
  const [allDay, setAllDay] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || '');
      setEventType(event.event_type);
      setAllDay(event.all_day);
      setStartDate(toDateString(event.start_date));
      setStartTime(event.all_day ? '09:00' : toTimeString(event.start_date));
      if (event.end_date) {
        setEndDate(toDateString(event.end_date));
        setEndTime(event.all_day ? '10:00' : toTimeString(event.end_date));
      } else {
        setEndDate(toDateString(event.start_date));
        setEndTime(event.all_day ? '10:00' : toTimeString(event.start_date));
      }
      setIsEditing(false);
    }
  }, [event]);

  if (!event) return null;

  const config = EVENT_TYPE_CONFIG[event.event_type];
  const color = event.color || config.color;

  const handleSave = async () => {
    let start_date: string;
    let end_date: string | null;

    if (allDay) {
      start_date = `${startDate}T00:00:00`;
      end_date = endDate ? `${endDate}T23:59:59` : null;
    } else {
      start_date = `${startDate}T${startTime}:00`;
      end_date = endDate ? `${endDate}T${endTime}:00` : null;
    }

    await onUpdate(event.id, {
      title,
      description: description || null,
      event_type: eventType,
      start_date,
      end_date,
      all_day: allDay,
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await onDelete(event.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <>
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

              {/* All day toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--border-default)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] bg-[var(--bg-primary)]"
                />
                <span className="text-sm font-medium text-[var(--text-secondary)]">Celý den</span>
              </label>

              {/* Date/Time inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[var(--text-secondary)]">Začátek</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-colors [color-scheme:dark]"
                  />
                  {!allDay && (
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-colors [color-scheme:dark]"
                    />
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[var(--text-secondary)]">Konec</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-colors [color-scheme:dark]"
                  />
                  {!allDay && (
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-colors [color-scheme:dark]"
                    />
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
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

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Smazat událost"
        message="Opravdu chceš smazat tuto událost? Tato akce je nevratná."
        confirmLabel="Smazat"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
