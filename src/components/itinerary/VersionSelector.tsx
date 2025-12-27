'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ItineraryVersion } from '@/types';

interface VersionSelectorProps {
  versions: ItineraryVersion[];
  currentVersion: number;
  onSelectVersion: (version: number) => void;
  onCompare: () => void;
}

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  base: { label: 'Generated', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  similar: { label: 'From Similar', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  differential: { label: 'Extended', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  regeneration: { label: 'Regenerated', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  cherry_pick: { label: 'Cherry-picked', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
};

/**
 * Dropdown in TripHeader showing version history
 * Allows switching between versions and opening comparison view
 */
export function VersionSelector({
  versions,
  currentVersion,
  onSelectVersion,
  onCompare,
}: VersionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sortedVersions = [...versions].sort((a, b) => b.version - a.version);
  const currentVersionData = versions.find((v) => v.version === currentVersion);

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return diffHours + 'h ago';
    if (diffDays < 7) return diffDays + 'd ago';

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <svg
            className="h-4 w-4"
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
          Version {currentVersion}
          {currentVersionData && (
            <Badge variant="secondary" className="ml-1 text-xs">
              current
            </Badge>
          )}
          <svg
            className="h-4 w-4 ml-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            Version History
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {versions.length} version{versions.length !== 1 ? 's' : ''}
          </p>
        </div>

        <DropdownMenuSeparator />

        <div className="max-h-64 overflow-y-auto">
          {sortedVersions.map((version) => {
            const sourceInfo = SOURCE_LABELS[version.source_type] || SOURCE_LABELS.base;
            const isCurrent = version.version === currentVersion;

            return (
              <DropdownMenuItem
                key={version.id}
                onClick={() => {
                  onSelectVersion(version.version);
                  setIsOpen(false);
                }}
                className={'flex flex-col items-start gap-1 py-2 cursor-pointer ' +
                  (isCurrent ? 'bg-blue-50 dark:bg-blue-900/20' : '')}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Version {version.version}</span>
                    {isCurrent && (
                      <Badge variant="default" className="text-xs">
                        current
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    {formatDate(version.created_at)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={'text-xs ' + sourceInfo.color}>
                    {sourceInfo.label}
                  </Badge>
                  {version.modification_summary && (
                    <span className="text-xs text-slate-500 truncate max-w-40">
                      {version.modification_summary}
                    </span>
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}
        </div>

        {versions.length > 1 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                onCompare();
                setIsOpen(false);
              }}
              className="justify-center text-blue-600 dark:text-blue-400 cursor-pointer"
            >
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Compare Versions
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default VersionSelector;
