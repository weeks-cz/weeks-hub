'use client';

import { useState, useRef } from 'react';
import { Send } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/types/database';
import { cn } from '@/lib/utils/cn';
import { obsahuje } from '@/lib/utils/text';

interface CommentInputProps {
  onSubmit: (content: string) => void;
  users: User[];
}

export function CommentInput({ onSubmit, users }: CommentInputProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Po zavináči nikdo nepíše háčky — „@stepan" musí najít Štěpána.
  const filteredUsers = mentionQuery
    ? users.filter((u) => obsahuje(u.full_name, mentionQuery) && u.id !== user?.id)
    : users.filter((u) => u.id !== user?.id);

  const handleChange = (value: string) => {
    setContent(value);

    // Check for @ mention trigger
    const textarea = textareaRef.current;
    if (!textarea) return;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\S*)$/);

    if (atMatch) {
      setShowMentions(true);
      setMentionQuery(atMatch[1]);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  };

  const insertMention = (mentionUser: User) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = content.slice(0, cursorPos);
    const textAfterCursor = content.slice(cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    const newContent = textBeforeCursor.slice(0, atIndex) + `@${mentionUser.full_name} ` + textAfterCursor;
    setContent(newContent);
    setShowMentions(false);
    setMentionQuery('');

    // Refocus textarea
    setTimeout(() => {
      textarea.focus();
      const newPos = atIndex + mentionUser.full_name.length + 2;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit(content.trim());
    setContent('');
    setShowMentions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setShowMentions(false);
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <div className="flex gap-3">
        <Avatar
          src={user.avatar_url}
          customSrc={user.custom_avatar_url}
          name={user.full_name}
          size="sm"
          className="mt-1 shrink-0"
        />
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Napiš komentář... (@ pro zmínku)"
            rows={2}
            className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-y"
          />

          {/* Mention dropdown */}
          {showMentions && filteredUsers.length > 0 && (
            <div className="absolute bottom-full mb-1 left-0 w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-lg overflow-hidden max-h-40 overflow-y-auto z-10 animate-fade-in">
              {filteredUsers.slice(0, 5).map((u) => (
                <button
                  key={u.id}
                  onClick={() => insertMention(u)}
                  className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  <Avatar src={u.avatar_url} customSrc={u.custom_avatar_url} name={u.full_name} size="sm" />
                  <span className="text-[var(--text-primary)]">{u.full_name}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-[var(--text-muted)]">Ctrl+Enter pro odeslání</span>
            <button
              onClick={handleSubmit}
              disabled={!content.trim()}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                content.trim()
                  ? 'text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10'
                  : 'text-[var(--text-muted)] opacity-30'
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
