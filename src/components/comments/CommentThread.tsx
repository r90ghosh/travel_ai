'use client';

import { useState } from 'react';
import type { CommentThread as CommentThreadType } from '@/types';

interface CommentThreadProps {
  thread: CommentThreadType;
  onReply?: (content: string) => void;
  onResolve?: () => void;
}

/**
 * Displays a comment thread with replies
 */
export function CommentThread({ thread, onReply, onResolve }: CommentThreadProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleSubmitReply = () => {
    if (replyContent.trim() && onReply) {
      onReply(replyContent);
      setReplyContent('');
      setIsReplying(false);
    }
  };

  const { root, replies } = thread;

  return (
    <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      {/* Root comment */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-600" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-900 dark:text-white">
                {root.user_id}
              </span>
              <span className="text-xs text-slate-500">
                {formatDate(root.created_at)}
              </span>
              <StatusBadge status={root.status} />
            </div>
            {root.selected_text && (
              <blockquote className="mt-1 border-l-2 border-slate-300 pl-2 text-sm italic text-slate-600 dark:border-slate-600 dark:text-slate-400">
                &ldquo;{root.selected_text}&rdquo;
              </blockquote>
            )}
            <p className="mt-2 text-slate-700 dark:text-slate-300">{root.content}</p>
            {root.intent && (
              <IntentDisplay intent={root.intent} />
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-700">
          {replies.map((reply) => (
            <div key={reply.id} className="border-t border-slate-50 p-4 pl-12 dark:border-slate-700/50">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-600" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {reply.user_id}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatDate(reply.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                    {reply.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-slate-100 p-3 dark:border-slate-700">
        <button
          onClick={() => setIsReplying(!isReplying)}
          className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400"
        >
          Reply
        </button>
        {root.status === 'pending' && (
          <button
            onClick={onResolve}
            className="text-sm text-green-600 hover:text-green-700 dark:text-green-400"
          >
            Mark resolved
          </button>
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
            <button
              onClick={() => setIsReplying(false)}
              className="rounded px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitReply}
              className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
            >
              Reply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    addressed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    deleted: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
  };

  return (
    <span className={`rounded px-1.5 py-0.5 text-xs ${colors[status] || colors.pending}`}>
      {status}
    </span>
  );
}

function IntentDisplay({ intent }: { intent: { action: string; confidence: string; details: string } }) {
  return (
    <div className="mt-2 rounded bg-slate-50 p-2 text-xs dark:bg-slate-900">
      <span className="font-medium">Intent:</span> {intent.action}
      <span className="ml-2 text-slate-500">({intent.confidence} confidence)</span>
      {intent.details && <p className="mt-1 text-slate-600 dark:text-slate-400">{intent.details}</p>}
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default CommentThread;
