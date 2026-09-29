'use client';

import { useState, type InputHTMLAttributes } from 'react';
import { Input } from '@/components/ui/Input';
import { parseTime } from '@/lib/utils/time';

interface TimeInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  label?: string;
  /** Vždy HH:MM ve 24h. */
  value: string;
  onChange: (value: string) => void;
}

/**
 * Čas ve 24h bez ohledu na jazyk prohlížeče — náhrada za `<input type="time">`,
 * který v anglickém prohlížeči ukazuje AM/PM (viz `parseTime`).
 *
 * Platný čas se propisuje hned při psaní, takže odeslání formuláře bez
 * opuštění pole uloží to, co je vidět. Neplatný text se po opuštění pole
 * vrátí na poslední platnou hodnotu.
 */
export function TimeInput({ label, value, onChange, onBlur, ...props }: TimeInputProps) {
  const [draft, setDraft] = useState(value);
  const [predchozi, setPredchozi] = useState(value);

  // Hodnota zvenku (reset modalu, otevření jiné události) přepíše rozepsaný
  // text — ale ne, když jen odpovídá tomu, co člověk právě píše („1“ → 01:00).
  if (value !== predchozi) {
    setPredchozi(value);
    if (parseTime(draft) !== value) setDraft(value);
  }

  const platny = parseTime(draft) !== null;

  return (
    <Input
      {...props}
      label={label}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      placeholder="HH:MM"
      maxLength={5}
      value={draft}
      error={platny ? undefined : 'Zadejte čas, např. 15:30'}
      onChange={(e) => {
        setDraft(e.target.value);
        const cas = parseTime(e.target.value);
        if (cas) onChange(cas);
      }}
      onBlur={(e) => {
        setDraft(parseTime(draft) ?? value);
        onBlur?.(e);
      }}
    />
  );
}
