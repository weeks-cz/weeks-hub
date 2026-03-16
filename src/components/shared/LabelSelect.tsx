'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/Badge';
import { X, Tag } from 'lucide-react';
import type { Label } from '@/types/database';

interface LabelSelectProps {
  value: string[];
  onChange: (labelIds: string[]) => void;
  className?: string;
}

export function LabelSelect({ value, onChange, className }: LabelSelectProps) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLabels = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('labels').select('*').order('name');
      if (data) setLabels(data);
    };
    fetchLabels();
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const selectedLabels = labels.filter((l) => value.includes(l.id));

  const toggleLabel = (labelId: string) => {
    if (value.includes(labelId)) {
      onChange(value.filter((id) => id !== labelId));
    } else {
      onChange([...value, labelId]);
    }
  };

  return (
    <div className={className} ref={containerRef}>
      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
        Štítky
      </label>

      {/* Selected labels + add button inline */}
      <div className="flex flex-wrap items-center gap-1.5">
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

        {/* Toggle button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border border-dashed border-[var(--border-default)] transition-colors"
        >
          <Tag className="w-3 h-3" />
          {selectedLabels.length === 0 ? 'Přidat štítek' : '+'}
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="mt-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto animate-fade-in">
          {labels.map((label) => (
            <button
              key={label.id}
              type="button"
              onClick={() => toggleLabel(label.id)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-[var(--bg-surface-hover)] transition-colors"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: label.color }}
                />
                <span className="text-[var(--text-primary)]">{label.name}</span>
              </div>
              {value.includes(label.id) && (
                <span className="text-[var(--color-primary)]">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
