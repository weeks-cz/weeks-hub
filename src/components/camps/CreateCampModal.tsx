'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { CAMP_STATUS_CONFIG, type CampStatus } from '@/types/database';

interface CreateCampModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (camp: {
    title: string;
    description?: string;
    start_date: string;
    end_date: string;
    location?: string;
    capacity: number;
    status: CampStatus;
    registration_url?: string;
  }) => Promise<unknown>;
}

export function CreateCampModal({ isOpen, onClose, onSubmit }: CreateCampModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('30');
  const [status, setStatus] = useState<CampStatus>('collecting_interest');
  const [registrationUrl, setRegistrationUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate) return;

    setIsSubmitting(true);

    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      start_date: startDate,
      end_date: endDate,
      location: location.trim() || undefined,
      capacity: parseInt(capacity) || 30,
      status,
      registration_url: registrationUrl.trim() || undefined,
    });

    setIsSubmitting(false);
    setTitle('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setLocation('');
    setCapacity('30');
    setStatus('collecting_interest');
    setRegistrationUrl('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novy tabor" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nazev"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nazev tabora"
          autoFocus
          required
        />

        <Textarea
          label="Popis"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Popis tabora"
          rows={2}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Datum zacatku"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="[color-scheme:dark]"
          />
          <Input
            label="Datum konce"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className="[color-scheme:dark]"
          />
        </div>

        <Input
          label="Lokace"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Misto konani"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Kapacita"
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            min="1"
            required
          />
          <Select
            label="Status"
            options={Object.entries(CAMP_STATUS_CONFIG).map(([key, config]) => ({
              value: key,
              label: config.label,
            }))}
            value={status}
            onChange={(e) => setStatus(e.target.value as CampStatus)}
          />
        </div>

        <Input
          label="Odkaz na registraci (volitelne)"
          value={registrationUrl}
          onChange={(e) => setRegistrationUrl(e.target.value)}
          placeholder="https://..."
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Zrusit
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={!title.trim() || !startDate || !endDate}>
            Vytvorit tabor
          </Button>
        </div>
      </form>
    </Modal>
  );
}
