'use client';

import { Clock, Pause, ChevronRight } from 'lucide-react';
import type { TimelineItem as TimelineItemType, HydratedTimelineItem, MealType } from '@/types';
import { SpotCard } from './SpotCard';
import { DriveSegment } from './DriveSegment';
import { ActivityCard } from './ActivityCard';
import { MealCard } from './MealCard';
import { hydrateTimelineItem } from '@/lib/data-hydrator';
import { cn } from '@/lib/utils';

interface DayColorTheme {
  bg: string;
  light: string;
  border: string;
  text: string;
}

interface TimelineItemProps {
  item: TimelineItemType | HydratedTimelineItem;
  dayColor?: DayColorTheme;
  onComment?: (itemId?: string) => void;
  onSwap?: (itemId: string) => void;
  onRemove?: (itemId: string) => void;
}

/**
 * Renders a single timeline item (spot, drive, meal, activity, etc.)
 * Supports both hydrated and non-hydrated items - will hydrate on-demand if needed
 */
export function TimelineItem({ item, dayColor, onComment, onSwap, onRemove }: TimelineItemProps) {
  // Hydrate the item if it has IDs but no full data
  const hydratedItem: HydratedTimelineItem = isHydrated(item) ? item : hydrateTimelineItem(item);

  const formatTime = (time: string) => {
    return time;
  };

  const itemColors = getItemColors(hydratedItem.type);

  return (
    <div className="relative flex gap-4 group">
      {/* Time column */}
      <div className="w-16 flex-shrink-0 text-right pt-3">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {formatTime(hydratedItem.time)}
        </span>
        {hydratedItem.end_time && (
          <span className="block text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {formatTime(hydratedItem.end_time)}
          </span>
        )}
      </div>

      {/* Timeline connector */}
      <div className="relative flex flex-col items-center pt-3">
        <div className={cn(
          'h-4 w-4 rounded-full ring-4 ring-white dark:ring-slate-800 shadow-sm z-10',
          itemColors.dot
        )} />
        <div className="w-0.5 flex-1 bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800 -mt-1" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-4 min-w-0">
        {hydratedItem.type === 'spot' && hydratedItem.spot && (
          <SpotCard
            spot={hydratedItem.spot}
            duration={hydratedItem.duration_minutes}
            onComment={() => onComment?.(hydratedItem.spot_id || hydratedItem.id)}
            onSwap={() => onSwap?.(hydratedItem.id)}
            onRemove={() => onRemove?.(hydratedItem.id)}
          />
        )}

        {hydratedItem.type === 'drive' && hydratedItem.route && (
          <DriveSegment route={hydratedItem.route} />
        )}

        {hydratedItem.type === 'activity' && hydratedItem.activity && (
          <ActivityCard
            activity={hydratedItem.activity}
            duration={hydratedItem.duration_minutes}
            onComment={() => onComment?.(hydratedItem.activity_id || hydratedItem.id)}
          />
        )}

        {hydratedItem.type === 'meal' && hydratedItem.meal_type && (
          <MealCard
            mealType={hydratedItem.meal_type as MealType}
            suggestion={hydratedItem.meal_suggestion}
            duration={hydratedItem.duration_minutes}
          />
        )}

        {hydratedItem.type === 'free_time' && (
          <div className="rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 border border-purple-100 dark:border-purple-800/50">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                <Pause className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-900 dark:text-white">
                    Free time
                  </h4>
                  <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 px-2 py-1 rounded-full">
                    <Clock className="h-3 w-3" />
                    {hydratedItem.duration_minutes} min
                  </span>
                </div>
                {hydratedItem.free_time_suggestion && (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {hydratedItem.free_time_suggestion}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notes for any item type */}
        {hydratedItem.notes && (
          <div className="mt-2 flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
            <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span className="italic">{hydratedItem.notes}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Check if an item is already hydrated (has full data objects)
 */
function isHydrated(item: TimelineItemType | HydratedTimelineItem): item is HydratedTimelineItem {
  if (item.type === 'spot') {
    return 'spot' in item && item.spot !== undefined;
  }
  if (item.type === 'activity') {
    return 'activity' in item && item.activity !== undefined;
  }
  if (item.type === 'drive') {
    return 'route' in item && item.route !== undefined;
  }
  // Meals, free_time, accommodation don't need hydration
  return true;
}

function getItemColors(type: string): { dot: string; bg: string } {
  switch (type) {
    case 'spot':
      return { dot: 'bg-blue-500', bg: 'bg-blue-50' };
    case 'drive':
      return { dot: 'bg-slate-400', bg: 'bg-slate-50' };
    case 'meal':
      return { dot: 'bg-orange-500', bg: 'bg-orange-50' };
    case 'activity':
      return { dot: 'bg-emerald-500', bg: 'bg-emerald-50' };
    case 'free_time':
      return { dot: 'bg-purple-500', bg: 'bg-purple-50' };
    case 'accommodation':
      return { dot: 'bg-indigo-500', bg: 'bg-indigo-50' };
    default:
      return { dot: 'bg-slate-400', bg: 'bg-slate-50' };
  }
}

export default TimelineItem;
