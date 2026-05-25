'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  CAMP_STATUS_CONFIG, CAMP_PROGRAM_CONFIG, CAMP_TYPE_CONFIG,
  type CampStatus, type CampProgram, type CampType,
} from '@/types/database';

interface CreateCampModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (camp: {
    title: string;
    description?: string;
    start_date: string;
    end_date: string;
    location?: string;
    location_detail?: string;
    capacity: number;
    status: CampStatus;
    registration_url?: string;
    program?: CampProgram;
    camp_type?: CampType;
    price?: number;
    ddm_id?: string;
    day_label?: string;
    single_day_option?: boolean;
  }) => Promise<unknown>;
}

// Derive Czech day name from ISO date — keeps day_label consistent with start_date
function dayFromDate(iso: string): string {
  if (!iso) return '';
  const days = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'];
  const d = new Date(iso + 'T12:00:00');
  return Number.isNaN(d.getTime()) ? '' : days[d.getDay()];
}

export function CreateCampModal({ isOpen, onClose, onSubmit }: CreateCampModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('HWLab Praha');
  const [locationDetail, setLocationDetail] = useState('Kongresové centrum Praha, 5. května 11, Praha 4');
  const [capacity, setCapacity] = useState('15');
  const [status, setStatus] = useState<CampStatus>('collecting_interest');
  const [registrationUrl, setRegistrationUrl] = useState('');
  const [program, setProgram] = useState<CampProgram>('3d-tisk');
  const [campType, setCampType] = useState<CampType>('oneday');
  const [price, setPrice] = useState('1490');
  const [ddmId, setDdmId] = useState('');
  const [singleDayOption, setSingleDayOption] = useState(false);
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
      location_detail: locationDetail.trim() || undefined,
      capacity: parseInt(capacity) || 15,
      status,
      registration_url: registrationUrl.trim() || undefined,
      program,
      camp_type: campType,
      price: parseInt(price) || undefined,
      ddm_id: ddmId.trim() || undefined,
      day_label: dayFromDate(startDate) || undefined,
      single_day_option: singleDayOption,
    });

    setIsSubmitting(false);
    setTitle('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setLocation('HWLab Praha');
    setLocationDetail('Kongresové centrum Praha, 5. května 11, Praha 4');
    setCapacity('15');
    setStatus('collecting_interest');
    setRegistrationUrl('');
    setProgram('3d-tisk');
    setCampType('oneday');
    setPrice('1490');
    setDdmId('');
    setSingleDayOption(false);
    onClose();
  };

  // When type flips, suggest sensible defaults — user can still override
  const handleTypeChange = (next: CampType) => {
    setCampType(next);
    if (next === 'weekend') {
      setPrice('2990');
      setTitle(title || 'Víkendový tábor chytrých technologií');
    } else {
      setPrice('1490');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nový tábor" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Program"
            options={Object.entries(CAMP_PROGRAM_CONFIG).map(([key, config]) => ({
              value: key, label: config.label,
            }))}
            value={program}
            onChange={(e) => setProgram(e.target.value as CampProgram)}
          />
          <Select
            label="Formát"
            options={Object.entries(CAMP_TYPE_CONFIG).map(([key, config]) => ({
              value: key, label: config.label,
            }))}
            value={campType}
            onChange={(e) => handleTypeChange(e.target.value as CampType)}
          />
        </div>

        <Input
          label="Název"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Název tábora"
          autoFocus
          required
        />

        <Textarea
          label="Popis"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Popis tábora (volitelné)"
          rows={2}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Datum začátku"
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
            onChange={(e) => {
              setEndDate(e.target.value);
              // Auto-fill end_date from start_date for oneday camps
              if (!e.target.value && campType === 'oneday' && startDate) {
                setEndDate(startDate);
              }
            }}
            required
            className="[color-scheme:dark]"
          />
        </div>

        <Input
          label="Lokace"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="HWLab Praha"
        />

        <Input
          label="Adresa"
          value={locationDetail}
          onChange={(e) => setLocationDetail(e.target.value)}
          placeholder="Kongresové centrum Praha, 5. května 11, Praha 4"
        />

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Cena (Kč)"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min="0"
          />
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
              value: key, label: config.label,
            }))}
            value={status}
            onChange={(e) => setStatus(e.target.value as CampStatus)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="DDM ID (volitelné)"
            value={ddmId}
            onChange={(e) => setDdmId(e.target.value)}
            placeholder="775"
          />
          <Input
            label="Odkaz na registraci (volitelné)"
            value={registrationUrl}
            onChange={(e) => setRegistrationUrl(e.target.value)}
            placeholder="https://www.ddmp6.cz/tabory/?id=..."
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
          <input
            type="checkbox"
            checked={singleDayOption}
            onChange={(e) => setSingleDayOption(e.target.checked)}
            className="w-4 h-4"
          />
          Umožnit přihlášení jen na 1 den (web zobrazí jednodenní variantu)
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Zrušit
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={!title.trim() || !startDate || !endDate}>
            Vytvořit tábor
          </Button>
        </div>
      </form>
    </Modal>
  );
}
