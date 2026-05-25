'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { MapPin, Users, ExternalLink, Plus, Minus, Trash2, Pencil, Tag } from 'lucide-react';
import {
  CAMP_STATUS_CONFIG, CAMP_PROGRAM_CONFIG, CAMP_TYPE_CONFIG,
  type Camp, type CampStatus, type CampProgram, type CampType,
} from '@/types/database';
import { formatDate } from '@/lib/utils/date';

interface CampDetailModalProps {
  camp: Camp;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (campId: string, updates: Partial<Camp>) => Promise<boolean>;
  onDelete: (campId: string) => Promise<boolean>;
  onEnrollmentChange: (campId: string, delta: number) => Promise<boolean>;
}

function dayFromDate(iso: string): string {
  if (!iso) return '';
  const days = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'];
  const d = new Date(iso + 'T12:00:00');
  return Number.isNaN(d.getTime()) ? '' : days[d.getDay()];
}

export function CampDetailModal({ camp, isOpen, onClose, onUpdate, onDelete, onEnrollmentChange }: CampDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [title, setTitle] = useState(camp.title);
  const [description, setDescription] = useState(camp.description || '');
  const [startDate, setStartDate] = useState(camp.start_date);
  const [endDate, setEndDate] = useState(camp.end_date);
  const [location, setLocation] = useState(camp.location || '');
  const [locationDetail, setLocationDetail] = useState(camp.location_detail || '');
  const [capacity, setCapacity] = useState(String(camp.capacity));
  const [status, setStatus] = useState<CampStatus>(camp.status);
  const [registrationUrl, setRegistrationUrl] = useState(camp.registration_url || '');
  const [program, setProgram] = useState<CampProgram>((camp.program as CampProgram) || '3d-tisk');
  const [campType, setCampType] = useState<CampType>((camp.camp_type as CampType) || 'oneday');
  const [price, setPrice] = useState(String(camp.price ?? ''));
  const [ddmId, setDdmId] = useState(camp.ddm_id || '');
  const [singleDayOption, setSingleDayOption] = useState(!!camp.single_day_option);
  const [isSaving, setIsSaving] = useState(false);

  const statusConfig = CAMP_STATUS_CONFIG[camp.status];
  const programConfig = camp.program ? CAMP_PROGRAM_CONFIG[camp.program as CampProgram] : null;
  const fillPercent = camp.capacity > 0 ? Math.min(100, (camp.enrolled_count / camp.capacity) * 100) : 0;

  const startEdit = () => {
    setTitle(camp.title);
    setDescription(camp.description || '');
    setStartDate(camp.start_date);
    setEndDate(camp.end_date);
    setLocation(camp.location || '');
    setLocationDetail(camp.location_detail || '');
    setCapacity(String(camp.capacity));
    setStatus(camp.status);
    setRegistrationUrl(camp.registration_url || '');
    setProgram((camp.program as CampProgram) || '3d-tisk');
    setCampType((camp.camp_type as CampType) || 'oneday');
    setPrice(String(camp.price ?? ''));
    setDdmId(camp.ddm_id || '');
    setSingleDayOption(!!camp.single_day_option);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const success = await onUpdate(camp.id, {
      title: title.trim(),
      description: description.trim() || null,
      start_date: startDate,
      end_date: endDate,
      location: location.trim() || null,
      location_detail: locationDetail.trim() || null,
      capacity: parseInt(capacity) || 15,
      status,
      registration_url: registrationUrl.trim() || null,
      program,
      camp_type: campType,
      price: price.trim() ? parseInt(price) : null,
      ddm_id: ddmId.trim() || null,
      day_label: dayFromDate(startDate) || null,
      single_day_option: singleDayOption,
    });
    setIsSaving(false);
    if (success) setIsEditing(false);
  };

  const handleDelete = async () => {
    await onDelete(camp.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  if (isEditing) {
    return (
      <Modal isOpen={isOpen} onClose={() => setIsEditing(false)} title="Upravit tábor" size="md">
        <div className="space-y-4">
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
              onChange={(e) => setCampType(e.target.value as CampType)}
            />
          </div>
          <Input label="Název" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Textarea label="Popis" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Datum začátku" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="[color-scheme:dark]" />
            <Input label="Datum konce" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="[color-scheme:dark]" />
          </div>
          <Input label="Lokace" value={location} onChange={(e) => setLocation(e.target.value)} />
          <Input label="Adresa" value={locationDetail} onChange={(e) => setLocationDetail(e.target.value)} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Cena (Kč)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} min="0" />
            <Input label="Kapacita" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} min="1" required />
            <Select
              label="Status"
              options={Object.entries(CAMP_STATUS_CONFIG).map(([key, config]) => ({ value: key, label: config.label }))}
              value={status}
              onChange={(e) => setStatus(e.target.value as CampStatus)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="DDM ID" value={ddmId} onChange={(e) => setDdmId(e.target.value)} placeholder="775" />
            <Input label="Odkaz na registraci" value={registrationUrl} onChange={(e) => setRegistrationUrl(e.target.value)} placeholder="https://..." />
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
            <Button variant="ghost" onClick={() => setIsEditing(false)}>Zrušit</Button>
            <Button onClick={handleSave} isLoading={isSaving}>Uložit</Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={camp.title} size="md">
        <div className="space-y-5">
          {/* Status + program badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs px-2.5 py-1 rounded-lg font-medium"
              style={{ backgroundColor: `${statusConfig.color}20`, color: statusConfig.color }}
            >
              {statusConfig.label}
            </span>
            {programConfig && (
              <span
                className="text-xs px-2.5 py-1 rounded-lg font-medium inline-flex items-center gap-1.5"
                style={{ backgroundColor: `${programConfig.color}20`, color: programConfig.color }}
              >
                <Tag className="w-3 h-3" />
                {programConfig.label}
              </span>
            )}
            {camp.camp_type && (
              <span className="text-xs px-2.5 py-1 rounded-lg font-medium bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]">
                {CAMP_TYPE_CONFIG[camp.camp_type as CampType].label}
              </span>
            )}
          </div>

          {/* Dates */}
          <div className="text-sm text-[var(--text-secondary)]">
            {formatDate(camp.start_date)}
            {camp.end_date !== camp.start_date ? ` – ${formatDate(camp.end_date)}` : ''}
            {camp.price ? <span className="ml-2 text-[var(--text-muted)]">· {camp.price} Kč</span> : null}
          </div>

          {/* Location */}
          {camp.location && (
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <MapPin className="w-4 h-4 text-[var(--text-muted)]" />
              {camp.location}
            </div>
          )}

          {camp.description && (
            <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{camp.description}</p>
          )}

          {camp.registration_url && (
            <a
              href={camp.registration_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Odkaz na registraci
              {camp.ddm_id ? <span className="text-[var(--text-muted)]">(DDM #{camp.ddm_id})</span> : null}
            </a>
          )}

          {/* Enrollment section */}
          <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-default)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--text-muted)]" />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Přihlášeni: {camp.enrolled_count} / {camp.capacity}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEnrollmentChange(camp.id, -1)}
                  disabled={camp.enrolled_count <= 0}
                  className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors disabled:opacity-30 disabled:pointer-events-none"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEnrollmentChange(camp.id, 1)}
                  className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="h-2 rounded-full bg-[var(--bg-surface-hover)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${fillPercent}%`,
                  backgroundColor: fillPercent >= 100 ? '#EF4444' : fillPercent >= 75 ? '#F59E0B' : '#10B981',
                }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-2 border-t border-[var(--border-default)]">
            <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 className="w-4 h-4" />
              Smazat
            </Button>
            <Button variant="secondary" size="sm" onClick={startEdit}>
              <Pencil className="w-4 h-4" />
              Upravit
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Smazat tábor"
        message={`Opravdu chceš smazat tábor "${camp.title}"? Tuto akci nelze vrátit.`}
        confirmLabel="Smazat"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
