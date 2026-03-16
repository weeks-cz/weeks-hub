'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/Badge';
import { X } from 'lucide-react';
import type { Label } from '@/types/database';

interface LabelSelectProps {
  value: string[];
  onChange: (labelIds: string[]) => void;
  className?: string;
}

export function LabelSelect({ value, onChange, className }: LabelSelectProps) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchLabels = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('labels').select('*').order('name');
      if (data) setLabels(data);
    };
    fetchLabels();
  }, []);

  const selectedLabels = labels.filter((l) => value.includes(l.id));

  const toggleLabel = (labelId: string) => {
    if (value.includes(labelId)) {
      onChange(value.filter((id) => id !== labelId));
    } else {
      onChange([...value, labelId]);
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
        Štítky
      </label>

      {/* Selected labels */}
      {selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedLabels.map((label) => (
            <Badge key={label.id} color={label.color}>
              {label.name}
              <button
                type="button"
                onClick={() => toggleLabel(label.id)}
                className="ml-1 hover:opacity-70"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl text-sm text-[var(--text-muted)] text-left focus:outline-none focus:border-[var(--color-primary)] transition-colors"
        >
          {selectedLabels.length === 0 ? 'Přidat štítky...' : 'Přidat další...'}
        </button>

        {isOpen && (
          <div className="absolute z-10 bottom-full mb-1 w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-lg overflow-hidden animate-fade-in max-h-48 overflow-y-auto">
            {labels.map((label) => (
              <button
                key={label.id}
                type="button"
                onClick={() => toggleLabel(label.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="text-[var(--text-primary)]">{label.name}</span>
                </div>
                {value.includes(label.id) && (
                  <span className="text-[var(--color-primary)]">&#10003;</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
