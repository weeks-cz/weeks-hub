'use client';

import { FileText, Image, File, Trash2, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatFileSize } from '@/hooks/useTaskAttachments';
import type { TaskAttachment } from '@/types/database';

interface AttachmentListProps {
  attachments: TaskAttachment[];
  onDelete: (id: string, fileUrl: string) => void;
}

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) return Image;
  if (fileType === 'application/pdf') return FileText;
  return File;
}

export function AttachmentList({ attachments, onDelete }: AttachmentListProps) {
  const { user } = useAuth();

  if (attachments.length === 0) return null;

  return (
    <div className="space-y-1.5 mb-3">
      {attachments.map((attachment) => {
        const Icon = getFileIcon(attachment.file_type);
        const isImage = attachment.file_type.startsWith('image/');

        return (
          <div
            key={attachment.id}
            className="flex items-center gap-3 p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-default)] group hover:border-[var(--color-primary)]/20 transition-colors"
          >
            {isImage ? (
              <img
                src={attachment.file_url}
                alt={attachment.file_name}
                className="w-10 h-10 rounded object-cover shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded bg-[var(--bg-surface-hover)] flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-[var(--text-muted)]" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--text-primary)] truncate">{attachment.file_name}</p>
              <p className="text-[10px] text-[var(--text-muted)]">{formatFileSize(attachment.file_size)}</p>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <a
                href={attachment.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-3.5 h-3.5" />
              </a>
              {user?.id === attachment.user_id && (
                <button
                  onClick={() => onDelete(attachment.id, attachment.file_url)}
                  className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--color-error)] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
