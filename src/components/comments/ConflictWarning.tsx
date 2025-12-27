'use client';

import type { Comment } from '@/types';

interface ConflictWarningProps {
  comments: Comment[];
  onResolve?: (commentId: string) => void;
}

/**
 * Displays a warning when comments conflict with each other
 * (e.g., one comment says "add X" and another says "remove X")
 */
export function ConflictWarning({ comments, onResolve }: ConflictWarningProps) {
  if (comments.length < 2) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
      <div className="flex items-start gap-3">
        <span className="text-xl">⚠️</span>
        <div className="flex-1">
          <h4 className="font-medium text-amber-900 dark:text-amber-100">
            Conflicting suggestions detected
          </h4>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
            These comments suggest contradictory changes. Please resolve before regenerating.
          </p>

          <div className="mt-4 space-y-2">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="flex items-start justify-between rounded bg-white p-3 dark:bg-slate-800"
              >
                <div>
                  <p className="text-sm text-slate-900 dark:text-white">
                    {comment.content}
                  </p>
                  {comment.intent && (
                    <p className="mt-1 text-xs text-slate-500">
                      Intent: {comment.intent.action}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onResolve?.(comment.id)}
                  className="text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400"
                >
                  Keep this
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <button className="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700">
              Resolve conflicts
            </button>
            <button className="rounded px-3 py-1.5 text-sm text-amber-800 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-900/40">
              Keep all (AI will decide)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConflictWarning;
