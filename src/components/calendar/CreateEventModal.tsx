'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EVENT_TYPE_CONFIG, type EventType } from '@/types/database';

// Helper to construct a proper ISO string from local date/time components
function localToISO(dateStr: string, timeStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0).toISOString();
}

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: {
    title: string;
    description?: string;
    event_type: EventType;
    start_date: string;
    end_date?: string | null;
    all_day?: boolean;
  }) => Promise<unknown>;
  defaultDate?: string;
  /** Čas z kliknutí do týdenní mřížky, formát HH:MM. */
  defaultTime?: string;
}

export function CreateEventModal({ isOpen, onClose, onSubmit, defaultDate, defaultTime }: CreateEventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<EventType>('meeting');
  const [startDate, setStartDate] = useState(defaultDate || '');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');
  const [allDay, setAllDay] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Modal zůstává trvale namountovaný a jen se přepíná `isOpen`, takže
   * `useState(defaultDate)` se vyhodnotí jedinkrát při načtení stránky, kdy je
   * ještě prázdný — datum vybraného dne se proto nikdy nepředvyplnilo.
   * Reset při otevření to řeší a zároveň zahodí rozepsaný text z minulého
   * pokusu, který se dosud držel až do úspěšného odeslání.
   */
  useEffect(() => {
    if (!isOpen) return;
    setTitle('');
    setDescription('');
    setEventType('meeting');
    setStartDate(defaultDate || '');
    const zacatek = defaultTime || '09:00';
    setStartTime(zacatek);
    setEndDate('');
    // Konec o hodinu dál, ať se nemusí vyplňovat ručně.
    const [h, m] = zacatek.split(':').map(Number);
    setEndTime(`${String((h + 1) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    setAllDay(false);
  }, [isOpen, defaultDate, defaultTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate) return;

    setIsSubmitting(true);

    const start = allDay ? localToISO(startDate, '12:00') : localToISO(startDate, startTime);
    const end = endDate
      ? allDay ? localToISO(endDate, '12:00') : localToISO(endDate, endTime)
      : null;

    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      event_type: eventType,
      start_date: start,
      end_date: end,
      all_day: allDay,
    });

    setIsSubmitting(false);
    setTitle('');
    setDescription('');
    setEventType('meeting');
    setStartDate('');
    setStartTime('09:00');
    setEndDate('');
    setEndTime('10:00');
    setAllDay(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nová událost" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Název"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Název události"
          autoFocus
          required
        />

        <Textarea
          label="Popis"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Popis události"
          rows={2}
        />

        <Select
          label="Typ události"
          options={Object.entries(EVENT_TYPE_CONFIG).map(([key, config]) => ({
            value: key,
            label: config.label,
          }))}
          value={eventType}
          onChange={(e) => setEventType(e.target.value as EventType)}
        />

        {/* All day toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
            className="w-4 h-4 rounded border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
          />
          <span className="text-sm text-[var(--text-secondary)]">Celý den</span>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Datum začátku"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="[color-scheme:dark]"
          />
          {!allDay && (
            <Input
              label="Čas začátku"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="[color-scheme:dark]"
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Datum konce (volitelné)"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="[color-scheme:dark]"
          />
          {!allDay && endDate && (
            <Input
              label="Čas konce"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="[color-scheme:dark]"
            />
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Zrušit
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={!title.trim() || !startDate}>
            Vytvořit událost
          </Button>
        </div>
      </form>
    </Modal>
  );
}
