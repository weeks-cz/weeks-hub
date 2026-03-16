'use client';

import { useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { formatRelative } from '@/lib/utils/date';
import type { TaskComment } from '@/types/database';

interface CommentListProps {
  comments: TaskComment[];
  onUpdate: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
}

function highlightMentions(text: string): React.ReactNode[] {
  const parts = text.split(/(@\S+(?:\s\S+)?)/g);
  return parts.map((part, i) =>
    part.startsWith('@') ? (
      <span key={i} className="text-[var(--color-primary)] font-medium">{part}</span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function CommentList({ comments, onUpdate, onDelete }: CommentListProps) {
  const { user } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  if (comments.length === 0) return null;

  const handleEdit = (comment: TaskComment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleSave = () => {
    if (editingId && editContent.trim()) {
      onUpdate(editingId, editContent.trim());
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-3 mb-3">
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-3 group">
          <Avatar
            src={comment.user?.avatar_url}
            customSrc={comment.user?.custom_avatar_url}
            name={comment.user?.full_name || '?'}
            size="sm"
            className="mt-0.5 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {comment.user?.full_name || 'Neznámý'}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">
                {formatRelative(comment.created_at)}
              </span>
              {comment.updated_at !== comment.created_at && (
                <span className="text-[10px] text-[var(--text-muted)] italic">(upraveno)</span>
              )}
            </div>

            {editingId === comment.id ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--color-primary)] rounded-xl text-sm text-[var(--text-primary)] outline-none resize-y"
                  rows={2}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={handleSave} className="text-xs text-[var(--color-primary)] hover:underline">Uložit</button>
                  <button onClick={() => setEditingId(null)} className="text-xs text-[var(--text-muted)] hover:underline">Zrušit</button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap break-words">
                {highlightMentions(comment.content)}
              </div>
            )}

            {/* Actions — own comments only */}
            {user?.id === comment.user_id && editingId !== comment.id && (
              <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(comment)} className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors">
                  <Edit className="w-3 h-3" />
                </button>
                <button onClick={() => onDelete(comment.id)} className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--color-error)] transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
