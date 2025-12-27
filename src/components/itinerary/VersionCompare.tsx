'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { GeneratedItinerary, ItineraryVersion, ItineraryDay } from '@/types';

interface VersionCompareProps {
  versions: ItineraryVersion[];
  initialLeftVersion: number;
  initialRightVersion: number;
  onCherryPick: (daySelections: Record<number, number>) => Promise<void>;
  onClose: () => void;
}

interface DayDiff {
  dayNumber: number;
  status: 'same' | 'added' | 'removed' | 'modified';
  leftDay: ItineraryDay | null;
  rightDay: ItineraryDay | null;
  changes: string[];
}

/**
 * Side-by-side comparison of two itinerary versions
 * Supports cherry-picking best days from each version
 */
export function VersionCompare({
  versions,
  initialLeftVersion,
  initialRightVersion,
  onCherryPick,
  onClose,
}: VersionCompareProps) {
  const [leftVersion, setLeftVersion] = useState(initialLeftVersion);
  const [rightVersion, setRightVersion] = useState(initialRightVersion);
  const [selectedDay, setSelectedDay] = useState(1);
  const [cherryPickMode, setCherryPickMode] = useState(false);
  const [daySelections, setDaySelections] = useState<Record<number, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  const leftData = versions.find((v) => v.version === leftVersion)?.data as GeneratedItinerary | undefined;
  const rightData = versions.find((v) => v.version === rightVersion)?.data as GeneratedItinerary | undefined;

  // Calculate differences between versions
  const diffs = useMemo(() => {
    if (!leftData || !rightData) return [];

    const allDays = new Set([
      ...leftData.days.map((d) => d.day_number),
      ...rightData.days.map((d) => d.day_number),
    ]);

    const result: DayDiff[] = [];

    for (const dayNum of Array.from(allDays).sort((a, b) => a - b)) {
      const leftDay = leftData.days.find((d) => d.day_number === dayNum) || null;
      const rightDay = rightData.days.find((d) => d.day_number === dayNum) || null;

      let status: DayDiff['status'] = 'same';
      const changes: string[] = [];

      if (!leftDay) {
        status = 'added';
        changes.push('Day added in right version');
      } else if (!rightDay) {
        status = 'removed';
        changes.push('Day removed in right version');
      } else {
        // Compare timeline items
        const leftItems = leftDay.timeline.map((t) => t.id).join(',');
        const rightItems = rightDay.timeline.map((t) => t.id).join(',');

        if (leftItems !== rightItems) {
          status = 'modified';

          // Count differences
          const leftSpots = leftDay.timeline.filter((t) => t.type === 'spot').length;
          const rightSpots = rightDay.timeline.filter((t) => t.type === 'spot').length;
          if (leftSpots !== rightSpots) {
            changes.push((rightSpots - leftSpots > 0 ? '+' : '') + (rightSpots - leftSpots) + ' stops');
          }

          const leftDuration = leftDay.timeline.reduce((sum, t) => sum + (t.duration_minutes || 0), 0);
          const rightDuration = rightDay.timeline.reduce((sum, t) => sum + (t.duration_minutes || 0), 0);
          if (Math.abs(leftDuration - rightDuration) > 30) {
            const diff = rightDuration - leftDuration;
            changes.push((diff > 0 ? '+' : '') + Math.round(diff / 60) + 'h duration');
          }
        }
      }

      result.push({ dayNumber: dayNum, status, leftDay, rightDay, changes });
    }

    return result;
  }, [leftData, rightData]);

  const currentDiff = diffs.find((d) => d.dayNumber === selectedDay);

  async function handleSaveCherryPick() {
    if (Object.keys(daySelections).length === 0) return;

    setIsSaving(true);
    try {
      await onCherryPick(daySelections);
    } finally {
      setIsSaving(false);
    }
  }

  function toggleDaySelection(dayNumber: number, version: number) {
    setDaySelections((prev) => {
      const next = { ...prev };
      if (next[dayNumber] === version) {
        delete next[dayNumber];
      } else {
        next[dayNumber] = version;
      }
      return next;
    });
  }

  const STATUS_COLORS = {
    same: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    added: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    removed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    modified: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Compare Versions
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant={cherryPickMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCherryPickMode(!cherryPickMode)}
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Cherry-pick Mode
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Version selectors */}
      <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex-1">
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Left Version</label>
          <Select value={String(leftVersion)} onValueChange={(v) => setLeftVersion(Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {versions.map((v) => (
                <SelectItem key={v.id} value={String(v.version)}>
                  Version {v.version}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end pb-2">
          <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
        <div className="flex-1">
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Right Version</label>
          <Select value={String(rightVersion)} onValueChange={(v) => setRightVersion(Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {versions.map((v) => (
                <SelectItem key={v.id} value={String(v.version)}>
                  Version {v.version}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Day tabs */}
      <div className="flex gap-1 p-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
        {diffs.map((diff) => (
          <button
            key={diff.dayNumber}
            onClick={() => setSelectedDay(diff.dayNumber)}
            className={'px-3 py-1.5 rounded-md text-sm font-medium transition-colors ' +
              (selectedDay === diff.dayNumber
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800')}
          >
            Day {diff.dayNumber}
            {diff.status !== 'same' && (
              <span className={'ml-1.5 inline-block w-2 h-2 rounded-full ' +
                (diff.status === 'added' ? 'bg-green-500' :
                 diff.status === 'removed' ? 'bg-red-500' : 'bg-yellow-500')} />
            )}
          </button>
        ))}
      </div>

      {/* Comparison content */}
      <div className="flex-1 overflow-auto p-4">
        {currentDiff && (
          <div className="grid grid-cols-2 gap-4">
            {/* Left version */}
            <DayPanel
              day={currentDiff.leftDay}
              version={leftVersion}
              isSelected={cherryPickMode && daySelections[selectedDay] === leftVersion}
              cherryPickMode={cherryPickMode}
              onSelect={() => toggleDaySelection(selectedDay, leftVersion)}
              side="left"
              otherDay={currentDiff.rightDay}
            />

            {/* Right version */}
            <DayPanel
              day={currentDiff.rightDay}
              version={rightVersion}
              isSelected={cherryPickMode && daySelections[selectedDay] === rightVersion}
              cherryPickMode={cherryPickMode}
              onSelect={() => toggleDaySelection(selectedDay, rightVersion)}
              side="right"
              otherDay={currentDiff.leftDay}
            />
          </div>
        )}

        {currentDiff && currentDiff.changes.length > 0 && (
          <div className="mt-4 p-3 rounded-md bg-slate-50 dark:bg-slate-800">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Changes in this day:
            </p>
            <div className="flex flex-wrap gap-2">
              {currentDiff.changes.map((change, i) => (
                <Badge key={i} variant="secondary" className={STATUS_COLORS[currentDiff.status]}>
                  {change}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cherry-pick footer */}
      {cherryPickMode && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {Object.keys(daySelections).length} day{Object.keys(daySelections).length !== 1 ? 's' : ''} selected
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click days to select the best version for each
              </p>
            </div>
            <Button
              onClick={handleSaveCherryPick}
              disabled={Object.keys(daySelections).length === 0 || isSaving}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                'Create Cherry-picked Version'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface DayPanelProps {
  day: ItineraryDay | null;
  version: number;
  isSelected: boolean;
  cherryPickMode: boolean;
  onSelect: () => void;
  side: 'left' | 'right';
  otherDay: ItineraryDay | null;
}

function DayPanel({ day, version, isSelected, cherryPickMode, onSelect, side, otherDay }: DayPanelProps) {
  if (!day) {
    return (
      <Card className="opacity-50">
        <CardContent className="p-6 text-center text-slate-500">
          <p>Day not present in Version {version}</p>
        </CardContent>
      </Card>
    );
  }

  const otherIds = new Set(otherDay?.timeline.map((t) => t.id) || []);

  return (
    <Card
      className={'transition-all ' +
        (isSelected ? 'ring-2 ring-blue-500' : '') +
        (cherryPickMode ? ' cursor-pointer hover:ring-2 hover:ring-blue-300' : '')}
      onClick={cherryPickMode ? onSelect : undefined}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Version {version}</CardTitle>
          {isSelected && (
            <Badge className="bg-blue-500">Selected</Badge>
          )}
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">{day.title}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {day.timeline.map((item) => {
            const isInOther = otherIds.has(item.id);
            const itemClass = !isInOther
              ? (side === 'right' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800')
              : '';

            const itemLabel = item.type === 'meal'
              ? (item.meal_type || 'Meal')
              : item.type === 'spot'
                ? (item.spot_id || 'Stop')
                : item.type;

            return (
              <div
                key={item.id}
                className={'p-2 rounded border text-sm ' + itemClass}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">{itemLabel}</span>
                  <span className="text-xs text-slate-500">
                    {item.time} - {item.end_time || ''}
                  </span>
                </div>
                {item.notes && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                    {item.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default VersionCompare;
