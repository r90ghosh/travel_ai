'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CommentIntent } from '@/lib/ai/classify-comment';

interface CommentInputProps {
  targetType: 'spot' | 'drive' | 'activity' | 'meal' | 'day';
  targetId: string;
  targetContext?: string;
  tripId: string;
  onSubmit: (content: string, intent: CommentIntent | null) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

const INTENT_LABELS: Record<string, { label: string; color: string }> = {
  remove: { label: 'Remove', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  add: { label: 'Add', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  extend: { label: 'Extend', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  shorten: { label: 'Shorten', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  swap: { label: 'Swap', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  move: { label: 'Move', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  question: { label: 'Question', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  preference: { label: 'Preference', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
  unclear: { label: 'Note', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' },
};

/**
 * Comment input with debounced AI classification preview
 * Shows intent badge as user types
 */
export function CommentInput({
  targetType,
  targetId,
  targetContext,
  tripId,
  onSubmit,
  onCancel,
  placeholder = 'Add feedback or suggestion...',
  autoFocus = false,
}: CommentInputProps) {
  const [content, setContent] = useState('');
  const [intent, setIntent] = useState<CommentIntent | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Debounced classification
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (content.trim().length < 5) {
      setIntent(null);
      setIsClassifying(false);
      return;
    }

    setIsClassifying(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch('/api/comments/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            comment: content,
            targetType,
            targetContext,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setIntent(data);
        }
      } catch (error) {
        console.error('Failed to classify comment:', error);
      } finally {
        setIsClassifying(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [content, targetType, targetContext]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim(), intent);
      setContent('');
      setIntent(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
    if (e.key === 'Escape' && onCancel) {
      onCancel();
    }
  }

  const intentInfo = intent?.intent ? INTENT_LABELS[intent.intent] : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={2}
          className="resize-none pr-20"
          disabled={isSubmitting}
        />

        {/* Classification indicator */}
        <div className="absolute right-2 top-2 flex items-center gap-1">
          {isClassifying && (
            <span className="h-4 w-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
          )}
          {!isClassifying && intentInfo && (
            <Badge
              variant="secondary"
              className={cn('text-xs', intentInfo.color)}
            >
              {intentInfo.label}
            </Badge>
          )}
        </div>
      </div>

      {/* Intent explanation */}
      {intent?.reasoning && !isClassifying && (
        <p className="text-xs text-slate-500 dark:text-slate-400 px-1">
          AI detected: {intent.reasoning}
        </p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter to submit
        </p>

        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Adding...
              </span>
            ) : (
              'Add Comment'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default CommentInput;
