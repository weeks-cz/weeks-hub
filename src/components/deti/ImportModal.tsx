'use client';

import { useState } from 'react';
import { Download, Upload, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';

type RowStatus = 'new' | 'existing' | 'duplicate' | 'error';

interface PreviewRow {
  rowNumber: number;
  fullName: string;
  birthdate: string | null;
  campLabel: string;
  visitDate: string | null;
  status: RowStatus;
  uncertain: boolean;
  error: string | null;
}

interface Preview {
  summary: Record<RowStatus, number>;
  rows: PreviewRow[];
}

const STATUS_LABEL: Record<RowStatus, { label: string; className: string }> = {
  new: { label: 'Nové dítě', className: 'bg-[var(--color-trust)]/10 text-[var(--color-trust)]' },
  existing: { label: 'Spáruje se', className: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' },
  duplicate: { label: 'Duplicita — přeskočí se', className: 'bg-[var(--bg-surface-hover)] text-[var(--text-muted)]' },
  error: { label: 'Chyba', className: 'bg-[var(--color-error)]/10 text-[var(--color-error)]' },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
}

export function ImportModal({ isOpen, onClose, onImported }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setBusy(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const send = async (mode: 'preview' | 'commit') => {
    if (!file) return;

    const body = new FormData();
    body.append('file', file);
    body.append('mode', mode);

    setBusy(true);
    const res = await fetch('/api/children/import', { method: 'POST', body });
    const json = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) {
      toast.error(json.error ?? 'Import selhal');
      return;
    }

    if (mode === 'preview') {
      setPreview(json as Preview);
      return;
    }

    toast.success(`Importováno: ${json.childrenCreated} dětí, ${json.visitsCreated} návštěv`);
    onImported();
    close();
  };

  const importable = preview ? preview.summary.new + preview.summary.existing : 0;

  return (
    <Modal isOpen={isOpen} onClose={close} title="Import z Excelu" size="lg">
      <div className="space-y-4">
        <div className="rounded-xl bg-[var(--bg-surface-hover)] px-4 py-3 text-sm text-[var(--text-secondary)] space-y-1">
          <p><strong className="text-[var(--text-primary)]">Jeden řádek = jedna účast na táboře</strong>, ne jedno dítě.</p>
          <p>Když stejné dítě jelo třikrát, budou to tři řádky — díky tomu se návštěvy správně sečtou.</p>
          {/* download attribute keeps this a file download from an API route, not page navigation */}
          <a
            href="/api/children/template"
            download
            className="inline-flex items-center gap-1.5 text-[var(--color-primary)] hover:underline pt-1"
          >
            <Download className="w-4 h-4" />
            Stáhnout šablonu
          </a>
        </div>

        <label
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 cursor-pointer transition-colors',
            file
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
              : 'border-[var(--border-default)] hover:border-[var(--color-primary)]/50'
          )}
        >
          <Upload className="w-6 h-6 text-[var(--text-muted)]" />
          <span className="text-sm text-[var(--text-secondary)]">
            {file ? file.name : 'Vyberte soubor .xlsx'}
          </span>
          <input
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setPreview(null);
            }}
          />
        </label>

        {preview && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(STATUS_LABEL) as RowStatus[]).map((status) => (
                preview.summary[status] > 0 && (
                  <span
                    key={status}
                    className={cn('px-2.5 py-1 rounded-lg text-xs font-medium', STATUS_LABEL[status].className)}
                  >
                    {STATUS_LABEL[status].label}: {preview.summary[status]}
                  </span>
                )
              ))}
            </div>

            {preview.rows.some((r) => r.uncertain) && (
              <p className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
                <AlertTriangle className="w-4 h-4 shrink-0 text-[var(--color-cta)]" />
                Některé řádky nemají datum narození — párují se jen podle jména, takže se dvě různé děti se stejným jménem mohou sloučit.
              </p>
            )}

            <div className="max-h-64 overflow-y-auto rounded-xl border border-[var(--border-default)]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[var(--bg-surface)]">
                  <tr className="text-left text-xs text-[var(--text-muted)]">
                    <th className="px-3 py-2 font-medium">Řádek</th>
                    <th className="px-3 py-2 font-medium">Dítě</th>
                    <th className="px-3 py-2 font-medium">Tábor</th>
                    <th className="px-3 py-2 font-medium">Stav</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row) => (
                    <tr key={row.rowNumber} className="border-t border-[var(--border-default)]">
                      <td className="px-3 py-2 text-[var(--text-muted)]">{row.rowNumber}</td>
                      <td className="px-3 py-2 text-[var(--text-primary)]">
                        {row.fullName || '—'}
                        {row.uncertain && row.status !== 'error' && (
                          <span className="ml-1 text-xs text-[var(--color-cta)]" title="Bez data narození">?</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-[var(--text-secondary)]">{row.campLabel || '—'}</td>
                      <td className="px-3 py-2">
                        <span className={cn('px-2 py-0.5 rounded-md text-xs', STATUS_LABEL[row.status].className)}>
                          {row.error ?? STATUS_LABEL[row.status].label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={close}>Zrušit</Button>
          {preview ? (
            <Button onClick={() => send('commit')} isLoading={busy} disabled={importable === 0}>
              Importovat {importable} {importable === 1 ? 'řádek' : importable >= 2 && importable <= 4 ? 'řádky' : 'řádků'}
            </Button>
          ) : (
            <Button onClick={() => send('preview')} isLoading={busy} disabled={!file}>
              Zkontrolovat
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
