'use client';

import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface FileUploadZoneProps {
  onUpload: (file: File) => Promise<unknown>;
  uploading: boolean;
}

export function FileUploadZone({ onUpload, uploading }: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) await onUpload(file);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await onUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && fileInputRef.current?.click()}
      className={cn(
        'border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors',
        isDragOver
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
          : 'border-[var(--border-default)] hover:border-[var(--color-primary)]/30',
        uploading && 'opacity-50 pointer-events-none'
      )}
    >
      <Upload className="w-5 h-5 text-[var(--text-muted)] mx-auto mb-1" />
      <p className="text-xs text-[var(--text-muted)]">
        {uploading ? 'Nahrávání...' : 'Přetáhni soubor nebo klikni (max 10 MB)'}
      </p>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
