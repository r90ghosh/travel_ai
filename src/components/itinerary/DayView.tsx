'use client';

import type { ItineraryDay, HydratedItineraryDay } from '@/types';
import { TimelineItem } from './TimelineItem';

interface DayViewProps {
  day: ItineraryDay | HydratedItineraryDay;
  isExpanded?: boolean;
  onToggle?: () => void;
  onComment?: () => void;
}

/**
 * Displays a single day of the itinerary with its timeline items
 */
export function DayView({ day, isExpanded = true, onToggle }: DayViewProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      {/* Day header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Day {day.day_number}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {day.day_of_week}, {day.date}
            </span>
          </div>
          <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
            {day.title}
          </h3>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {day.stats.spots_count} spots • {Math.round(day.stats.driving_km)} km
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500">
            ~{Math.round(day.stats.driving_minutes / 60)}h driving
          </p>
        </div>
      </button>

      {/* Timeline */}
      {isExpanded && (
        <div className="border-t border-slate-100 p-4 dark:border-slate-700">
          <div className="space-y-4">
            {day.timeline.map((item) => (
              <TimelineItem key={item.id} item={item} />
            ))}
          </div>

          {/* Accommodation */}
          {day.accommodation && (
            <div className="mt-6 rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Stay tonight
              </h4>
              <p className="mt-1 text-slate-900 dark:text-white">
                {day.accommodation.area}
              </p>
              {day.accommodation.suggestion && (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {day.accommodation.suggestion}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DayView;
