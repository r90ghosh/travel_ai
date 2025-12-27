'use client';

import { Clock, Pause } from 'lucide-react';
import type { TimelineItem as TimelineItemType, HydratedTimelineItem, MealType } from '@/types';
import { SpotCard } from './SpotCard';
import { DriveSegment } from './DriveSegment';
import { ActivityCard } from './ActivityCard';
import { MealCard } from './MealCard';
import { hydrateTimelineItem } from '@/lib/data-hydrator';

interface TimelineItemProps {
  item: TimelineItemType | HydratedTimelineItem;
  onComment?: (itemId?: string) => void;
  onSwap?: (itemId: string) => void;
  onRemove?: (itemId: string) => void;
}

/**
 * Renders a single timeline item (spot, drive, meal, activity, etc.)
 * Supports both hydrated and non-hydrated items - will hydrate on-demand if needed
 */
export function TimelineItem({ item, onComment, onSwap, onRemove }: TimelineItemProps) {
  // Hydrate the item if it has IDs but no full data
  const hydratedItem: HydratedTimelineItem = isHydrated(item) ? item : hydrateTimelineItem(item);

  const formatTime = (time: string) => {
    // Assuming time is in HH:MM format
    return time;
  };

  return (
    <div className="relative flex gap-4">
      {/* Time column */}
      <div className="w-16 flex-shrink-0 text-right pt-1">
        <span className="text-sm font-medium text-slate-900 dark:text-white">
          {formatTime(hydratedItem.time)}
        </span>
        {hydratedItem.end_time && (
          <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {formatTime(hydratedItem.end_time)}
          </span>
        )}
      </div>

      {/* Timeline line */}
      <div className="relative flex flex-col items-center">
        <div className={`h-3 w-3 rounded-full ring-2 ring-white dark:ring-slate-800 ${getItemColor(hydratedItem.type)}`} />
        <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-700" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6 min-w-0">
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
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-900/20">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                <Pause className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-slate-900 dark:text-white">
                    Free time
                  </h4>
                  <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="h-3 w-3" />
                    {hydratedItem.duration_minutes} min
                  </span>
                </div>
                {hydratedItem.free_time_suggestion && (
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {hydratedItem.free_time_suggestion}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notes for any item type */}
        {hydratedItem.notes && (
          <p className="mt-2 text-sm italic text-slate-500 dark:text-slate-400 pl-1">
            {hydratedItem.notes}
          </p>
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

function getItemColor(type: string): string {
  switch (type) {
    case 'spot':
      return 'bg-blue-500';
    case 'drive':
      return 'bg-slate-400';
    case 'meal':
      return 'bg-orange-500';
    case 'activity':
      return 'bg-green-500';
    case 'free_time':
      return 'bg-purple-500';
    case 'accommodation':
      return 'bg-indigo-500';
    default:
      return 'bg-slate-400';
  }
}

export default TimelineItem;
