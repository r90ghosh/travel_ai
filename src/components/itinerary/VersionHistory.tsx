'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ItineraryVersion } from '@/types';

interface VersionHistoryProps {
  versions: ItineraryVersion[];
  currentVersion: number;
  onViewVersion: (version: number) => void;
  onRestoreVersion: (version: number) => Promise<void>;
  onClose: () => void;
}

const SOURCE_INFO: Record<string, { label: string; icon: string; color: string }> = {
  base: {
    label: 'Generated',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    color: 'text-blue-600 dark:text-blue-400',
  },
  similar: {
    label: 'From Similar Trip',
    icon: 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z',
    color: 'text-purple-600 dark:text-purple-400',
  },
  differential: {
    label: 'Extended',
    icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
    color: 'text-green-600 dark:text-green-400',
  },
  regeneration: {
    label: 'Regenerated from Feedback',
    icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    color: 'text-orange-600 dark:text-orange-400',
  },
  cherry_pick: {
    label: 'Cherry-picked',
    icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
    color: 'text-pink-600 dark:text-pink-400',
  },
};

/**
 * Full version history timeline panel
 * Shows all versions with ability to view or restore
 */
export function VersionHistory({
  versions,
  currentVersion,
  onViewVersion,
  onRestoreVersion,
  onClose,
}: VersionHistoryProps) {
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null);

  const sortedVersions = [...versions].sort((a, b) => b.version - a.version);

  async function handleRestore(version: number) {
    setRestoringVersion(version);
    try {
      await onRestoreVersion(version);
    } finally {
      setRestoringVersion(null);
    }
  }

  function formatDateTime(dateString: string): { date: string; time: string } {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }),
    };
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Version History
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Button>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />

          {/* Version entries */}
          <div className="space-y-6">
            {sortedVersions.map((version, index) => {
              const sourceInfo = SOURCE_INFO[version.source_type] || SOURCE_INFO.base;
              const isCurrent = version.version === currentVersion;
              const isRestoring = restoringVersion === version.version;
              const { date, time } = formatDateTime(version.created_at);

              return (
                <div key={version.id} className="relative pl-10">
                  {/* Timeline dot */}
                  <div
                    className={'absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ' +
                      (isCurrent
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600')}
                  >
                    {isCurrent && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>

                  {/* Version card */}
                  <div
                    className={'rounded-lg border p-4 ' +
                      (isCurrent
                        ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                        : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800')}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            Version {version.version}
                          </span>
                          {isCurrent && (
                            <Badge variant="default" className="text-xs">
                              current
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {date} at {time}
                        </p>
                      </div>
                    </div>

                    {/* Source type */}
                    <div className={'flex items-center gap-2 mb-2 ' + sourceInfo.color}>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sourceInfo.icon} />
                      </svg>
                      <span className="text-sm">{sourceInfo.label}</span>
                    </div>

                    {/* Modification summary */}
                    {version.modification_summary && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                        {version.modification_summary}
                      </p>
                    )}

                    {/* Parent version reference */}
                    {version.parent_version && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                        Based on Version {version.parent_version}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewVersion(version.version)}
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </Button>
                      {!isCurrent && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(version.version)}
                          disabled={isRestoring}
                        >
                          {isRestoring ? (
                            <span className="flex items-center gap-1">
                              <span className="h-3 w-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                              Restoring...
                            </span>
                          ) : (
                            <>
                              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                              Restore
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default VersionHistory;
