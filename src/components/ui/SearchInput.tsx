'use client';

import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Popisek pro čtečky, když z okolí není jasné, co se hledá. */
  label?: string;
  className?: string;
}

/**
 * Vyhledávací pole.
 *
 * Board, registrace i formuláře měly každý vlastní kopii téhož pole — a každá
 * kopie je další místo, kde se zapomene na křížek, popisek pro čtečku nebo na
 * to, že si `type="search"` kreslí vlastní tlačítko na smazání.
 */
export function SearchInput({ value, onChange, placeholder = 'Hledat…', label, className }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        className="w-full pl-8 pr-8 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--color-primary)] outline-none transition-colors"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Zrušit hledání"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
