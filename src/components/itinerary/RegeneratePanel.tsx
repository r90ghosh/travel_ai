'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConflictWarning } from '@/components/comments/ConflictWarning';
import { SignupPrompt } from '@/components/auth/SignupPrompt';
import type { Comment } from '@/types';
import type { Conflict } from '@/lib/comments/conflict-detector';

interface RegeneratePanelProps {
  tripId: string;
  comments: Comment[];
  conflicts: Conflict[];
  regenerationsUsed: number;
  maxRegenerations: number;
  isAuthenticated: boolean;
  onResolveConflict: (commentId: string) => Promise<void>;
  onRegenerate: () => Promise<void>;
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
 * Panel showing pending comments summary and regenerate button
 * Displays conflict warnings and blocks regeneration until resolved
 */
export function RegeneratePanel({
  tripId,
  comments,
  conflicts,
  regenerationsUsed,
  maxRegenerations,
  isAuthenticated,
  onResolveConflict,
  onRegenerate,
}: RegeneratePanelProps) {
  const router = useRouter();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pendingComments = comments.filter((c) => c.status === 'pending');
  const hasConflicts = conflicts.length > 0;
  const remainingRegenerations = maxRegenerations - regenerationsUsed;
  const canRegenerate =
    pendingComments.length > 0 &&
    !hasConflicts &&
    remainingRegenerations > 0;

  async function handleRegenerate() {
    if (!isAuthenticated) {
      setShowSignup(true);
      return;
    }

    if (!canRegenerate) return;

    setIsRegenerating(true);
    setError(null);

    try {
      await onRegenerate();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate');
    } finally {
      setIsRegenerating(false);
    }
  }

  if (pendingComments.length === 0) {
    return null;
  }

  // Group comments by intent
  const commentsByIntent = pendingComments.reduce(
    (acc, comment) => {
      const intent = (comment.intent as { action?: string })?.action || 'unclear';
      if (!acc[intent]) acc[intent] = [];
      acc[intent].push(comment);
      return acc;
    },
    {} as Record<string, Comment[]>
  );

  return (
    <>
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <svg
                className="h-5 w-5 text-blue-600 dark:text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Pending Feedback
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {remainingRegenerations} of {maxRegenerations} regenerations remaining
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Conflict warning */}
          {hasConflicts && (
            <ConflictWarning
              conflicts={conflicts}
              comments={comments}
              onResolve={onResolveConflict}
            />
          )}

          {/* Comments grouped by intent */}
          <div className="space-y-3">
            {Object.entries(commentsByIntent).map(([intent, intentComments]) => {
              const intentInfo = INTENT_LABELS[intent] || INTENT_LABELS.unclear;
              return (
                <div key={intent} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className={intentInfo.color}>
                      <span className="mr-1">{intentInfo.icon}</span>
                      {intentInfo.label}
                    </Badge>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {intentComments.length} comment{intentComments.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <ul className="space-y-1 pl-4">
                    {intentComments.map((comment) => (
                      <li
                        key={comment.id}
                        className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2"
                      >
                        <span className="text-slate-400 mt-1">•</span>
                        <span className="line-clamp-2">{comment.content}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Regenerate button */}
          <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
            <Button
              onClick={handleRegenerate}
              disabled={!canRegenerate || isRegenerating}
              className="w-full"
              size="lg"
            >
              {isRegenerating ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Regenerating itinerary...
                </span>
              ) : hasConflicts ? (
                'Resolve conflicts to regenerate'
              ) : remainingRegenerations === 0 ? (
                'Upgrade to regenerate more'
              ) : (
                <>
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Apply {pendingComments.length} change{pendingComments.length !== 1 ? 's' : ''} & Regenerate
                </>
              )}
            </Button>

            {remainingRegenerations <= 1 && remainingRegenerations > 0 && (
              <p className="text-xs text-center text-amber-600 dark:text-amber-400 mt-2">
                This is your last free regeneration
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Signup prompt for unauthenticated users */}
      {showSignup && (
        <SignupPrompt
          trigger="regenerate"
          tripId={tripId}
          onClose={() => setShowSignup(false)}
          onSuccess={() => {
            setShowSignup(false);
            handleRegenerate();
          }}
        />
      )}
    </>
  );
}

export default RegeneratePanel;
