'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Child } from '@/types/database';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (values: Partial<Child>) => Promise<string | null>;
}

const EMPTY = {
  full_name: '',
  birthdate: '',
  parent_name: '',
  parent_email: '',
  parent_phone: '',
  insurance: '',
  health_notes: '',
  notes: '',
};

export function AddChildModal({ isOpen, onClose, onCreate }: Props) {
  const [values, setValues] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const submit = async () => {
    if (!values.full_name.trim()) {
      toast.error('Jméno je povinné');
      return;
    }

    setSaving(true);
    const error = await onCreate(values);
    setSaving(false);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success('Dítě přidáno');
    setValues(EMPTY);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Přidat dítě" size="md">
      <div className="space-y-3">
        <Input label="Jméno a příjmení *" value={values.full_name} onChange={set('full_name')} autoFocus />
        <Input label="Datum narození" type="date" value={values.birthdate} onChange={set('birthdate')} />
        <p className="text-xs text-[var(--text-muted)] -mt-1">
          Bez data narození nejde dítě spolehlivě rozpoznat při importu — vyplňte, pokud ho znáte.
        </p>
        <Input label="Rodič" value={values.parent_name} onChange={set('parent_name')} />
        <Input label="E-mail rodiče" type="email" value={values.parent_email} onChange={set('parent_email')} />
        <Input label="Telefon" type="tel" value={values.parent_phone} onChange={set('parent_phone')} />
        <Input label="Pojišťovna" value={values.insurance} onChange={set('insurance')} />
        <Textarea label="Zdravotní poznámky" rows={2} value={values.health_notes} onChange={set('health_notes')} />
        <Textarea label="Interní poznámka" rows={2} value={values.notes} onChange={set('notes')} />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Zrušit</Button>
          <Button onClick={submit} isLoading={saving}>Přidat</Button>
        </div>
      </div>
    </Modal>
  );
}
