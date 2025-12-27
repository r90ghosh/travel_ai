'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Comment } from '@/types';
import type { Conflict } from '@/lib/comments/conflict-detector';

interface ConflictWarningProps {
  conflicts: Conflict[];
  comments: Comment[];
  onResolve: (commentId: string) => void;
}

/**
 * Shows conflicts between comments and blocks regeneration until resolved
 * Users must resolve or delete conflicting comments before proceeding
 */
export function ConflictWarning({ conflicts, comments, onResolve }: ConflictWarningProps) {
  if (conflicts.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/20">
      <div className="flex items-start gap-3 mb-3">
        <svg
          className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
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
        <div>
          <h3 className="font-medium text-amber-800 dark:text-amber-200">
            Conflicting Feedback
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
            Some comments conflict with each other. Please resolve before regenerating.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {conflicts.map((conflict, idx) => {
          const c1 = comments.find((c) => c.id === conflict.comment1_id);
          const c2 = comments.find((c) => c.id === conflict.comment2_id);

          if (!c1 || !c2) return null;

          return (
            <div
              key={idx}
              className="rounded-md border border-amber-100 bg-white p-3 dark:border-amber-800 dark:bg-slate-800"
            >
              <div className="flex gap-3 mb-3">
                {/* Comment 1 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {c1.user_email || 'Anonymous'}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                    {c1.content}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onResolve(c1.id)}
                    className="mt-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    Remove this
                  </Button>
                </div>

                {/* VS divider */}
                <div className="flex items-center">
                  <span className="text-amber-500 dark:text-amber-400 font-medium text-sm">
                    vs
                  </span>
                </div>

                {/* Comment 2 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {c2.user_email || 'Anonymous'}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                    {c2.content}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onResolve(c2.id)}
                    className="mt-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    Remove this
                  </Button>
                </div>
              </div>

              {/* Conflict details */}
              <div className="border-t border-amber-100 dark:border-amber-800 pt-2 mt-2">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {conflict.reason}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                  <span>Suggestion:</span>
                  <span>{conflict.suggestion}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-amber-200 dark:border-amber-700">
        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            Resolve all conflicts to enable itinerary regeneration
          </span>
        </p>
      </div>
    </div>
  );
}

/**
 * Compact inline conflict indicator for use in comment threads
 */
export function ConflictBadge({ conflictCount }: { conflictCount: number }) {
  if (conflictCount === 0) return null;

  return (
    <Badge
      variant="outline"
      className="bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-600"
    >
      <svg
        className="h-3 w-3 mr-1"
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
      {conflictCount} conflict{conflictCount !== 1 ? 's' : ''}
    </Badge>
  );
}

export default ConflictWarning;
