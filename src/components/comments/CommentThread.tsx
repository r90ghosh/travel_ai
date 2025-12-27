'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CommentThread as CommentThreadType, Comment } from '@/types';
import type { CommentIntent } from '@/lib/ai/classify-comment';

interface CommentThreadProps {
  thread: CommentThreadType;
  currentUserId?: string;
  onReply?: (content: string) => void;
  onResolve?: () => void;
  onDelete?: (commentId: string) => void;
  conflictsWith?: string[];
}

const INTENT_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  remove: { label: 'Remove', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: '−' },
  add: { label: 'Add', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: '+' },
  extend: { label: 'Extend', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: '↔' },
  shorten: { label: 'Shorten', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: '↕' },
  swap: { label: 'Swap', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: '⇄' },
  move: { label: 'Move', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400', icon: '→' },
  question: { label: 'Question', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: '?' },
  preference: { label: 'Preference', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400', icon: '♥' },
  unclear: { label: 'Note', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400', icon: '•' },
};

/**
 * Displays a comment thread with replies
 * Includes delete button for own comments and conflict badges
 */
export function CommentThread({
  thread,
  currentUserId,
  onReply,
  onResolve,
  onDelete,
  conflictsWith,
}: CommentThreadProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmitReply = () => {
    if (replyContent.trim() && onReply) {
      onReply(replyContent);
      setReplyContent('');
      setIsReplying(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(commentId);
    } finally {
      setIsDeleting(false);
    }
  };

  const { root, replies } = thread;
  const isOwner = currentUserId && root.user_id === currentUserId;
  const hasConflict = conflictsWith && conflictsWith.length > 0;

  return (
    <div
      className={cn(
        'rounded-lg border bg-white dark:bg-slate-800',
        hasConflict
          ? 'border-amber-300 dark:border-amber-600'
          : 'border-slate-200 dark:border-slate-700'
      )}
    >
      {/* Conflict warning */}
      {hasConflict && (
        <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 dark:border-amber-700 dark:bg-amber-900/20">
          <svg
            className="h-4 w-4 text-amber-600 dark:text-amber-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
            Conflicting feedback detected
          </span>
        </div>
      )}

      {/* Root comment */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            <span className="text-xs font-medium text-white">
              {root.user_id?.charAt(0)?.toUpperCase() || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-slate-900 dark:text-white truncate">
                  {root.user_email || 'Anonymous'}
                </span>
                <span className="text-xs text-slate-500">
                  {formatDate(root.created_at)}
                </span>
                <StatusBadge status={root.status} />
              </div>
              {isOwner && onDelete && (
                <button
                  onClick={() => handleDelete(root.id)}
                  disabled={isDeleting}
                  className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  title="Delete comment"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
            {root.selected_text && (
              <blockquote className="mt-1 border-l-2 border-slate-300 pl-2 text-sm italic text-slate-600 dark:border-slate-600 dark:text-slate-400">
                &ldquo;{root.selected_text}&rdquo;
              </blockquote>
            )}
            <p className="mt-2 text-slate-700 dark:text-slate-300">{root.content}</p>
            {root.intent && (
              <IntentDisplay intent={root.intent as unknown as CommentIntent} />
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-700">
          {replies.map((reply) => {
            const isReplyOwner = currentUserId && reply.user_id === currentUserId;
            return (
              <div
                key={reply.id}
                className="border-t border-slate-50 p-4 pl-12 first:border-t-0 dark:border-slate-700/50"
              >
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 flex-shrink-0 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center">
                    <span className="text-[10px] font-medium text-white">
                      {reply.user_id?.charAt(0)?.toUpperCase() || 'A'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {(reply as Comment & { user_email?: string }).user_email || 'Anonymous'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatDate(reply.created_at)}
                        </span>
                      </div>
                      {isReplyOwner && onDelete && (
                        <button
                          onClick={() => handleDelete(reply.id)}
                          disabled={isDeleting}
                          className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          title="Delete reply"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                      {reply.content}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-slate-100 p-3 dark:border-slate-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsReplying(!isReplying)}
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400"
        >
          Reply
        </Button>
        {root.status === 'pending' && onResolve && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResolve}
            className="text-green-600 hover:text-green-700 dark:text-green-400"
          >
            Mark resolved
          </Button>
        )}
      </div>

      {/* Reply input */}
      {isReplying && (
        <div className="border-t border-slate-100 p-4 dark:border-slate-700">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            className="w-full rounded-lg border border-slate-300 p-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            rows={2}
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsReplying(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmitReply}
              disabled={!replyContent.trim()}
            >
              Reply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    addressed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    deleted: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
  };

  return (
    <Badge variant="secondary" className={cn('text-xs', styles[status] || styles.pending)}>
      {status}
    </Badge>
  );
}

function IntentDisplay({ intent }: { intent: CommentIntent }) {
  const intentInfo = intent.intent ? INTENT_LABELS[intent.intent] : null;

  if (!intentInfo) return null;

  return (
    <div className="mt-2 flex items-start gap-2 rounded-md bg-slate-50 p-2 dark:bg-slate-900">
      <Badge variant="secondary" className={cn('text-xs flex-shrink-0', intentInfo.color)}>
        <span className="mr-1">{intentInfo.icon}</span>
        {intentInfo.label}
      </Badge>
      {intent.reasoning && (
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {intent.reasoning}
        </span>
      )}
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default CommentThread;
