'use client';

import type { HydratedTimelineItem } from '@/types';
import { SpotCard } from './SpotCard';
import { DriveSegment } from './DriveSegment';

interface TimelineItemProps {
  item: HydratedTimelineItem;
  onComment?: () => void;
}

/**
 * Renders a single timeline item (spot, drive, meal, activity, etc.)
 */
export function TimelineItem({ item, onComment }: TimelineItemProps) {
  const formatTime = (time: string) => {
    // Assuming time is in HH:MM format
    return time;
  };

  return (
    <div className="relative flex gap-4">
      {/* Time column */}
      <div className="w-16 flex-shrink-0 text-right">
        <span className="text-sm font-medium text-slate-900 dark:text-white">
          {formatTime(item.time)}
        </span>
        {item.end_time && (
          <span className="block text-xs text-slate-500">
            → {formatTime(item.end_time)}
          </span>
        )}
      </div>

      {/* Timeline line */}
      <div className="relative flex flex-col items-center">
        <div className={`h-3 w-3 rounded-full ${getItemColor(item.type)}`} />
        <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-700" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        {item.type === 'spot' && item.spot && (
          <SpotCard spot={item.spot} duration={item.duration_minutes} />
        )}

        {item.type === 'drive' && item.route && (
          <DriveSegment route={item.route} />
        )}

        {item.type === 'activity' && item.activity && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
            <h4 className="font-medium text-slate-900 dark:text-white">
              {item.activity.name}
            </h4>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {item.activity.operator}
            </p>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              {item.activity.description}
            </p>
          </div>
        )}

        {item.type === 'meal' && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
            <h4 className="font-medium capitalize text-slate-900 dark:text-white">
              {item.meal_type}
            </h4>
            {item.meal_suggestion && (
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {item.meal_suggestion}
              </p>
            )}
          </div>
        )}

        {item.type === 'free_time' && (
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20">
            <h4 className="font-medium text-slate-900 dark:text-white">
              Free time ({item.duration_minutes} min)
            </h4>
            {item.free_time_suggestion && (
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {item.free_time_suggestion}
              </p>
            )}
          </div>
        )}

        {item.notes && (
          <p className="mt-2 text-sm italic text-slate-500 dark:text-slate-400">
            {item.notes}
          </p>
        )}
      </div>
    </div>
  );
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
