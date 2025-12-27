'use client';

import { MapPin, Car, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ItineraryDay, HydratedItineraryDay } from '@/types';

interface DaySelectorProps {
  days: (ItineraryDay | HydratedItineraryDay)[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
  showStats?: boolean;
}

export function DaySelector({ days, selectedDay, onSelectDay, showStats = true }: DaySelectorProps) {
  // Calculate total trip stats
  const totalStats = days.reduce(
    (acc, day) => ({
      spots: acc.spots + day.stats.spots_count,
      driving_km: acc.driving_km + day.stats.driving_km,
      driving_hours: acc.driving_hours + day.stats.driving_minutes / 60,
    }),
    { spots: 0, driving_km: 0, driving_hours: 0 }
  );

  return (
    <div className="space-y-1">
      <h3 className="text-sm font-medium text-gray-500 mb-3">Your Trip</h3>

      {/* Trip summary stats */}
      {showStats && (
        <div className="mb-4 rounded-lg bg-gray-50 p-3 dark:bg-slate-800">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {totalStats.spots}
              </div>
              <div className="text-xs text-gray-500">Spots</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {Math.round(totalStats.driving_km)}
              </div>
              <div className="text-xs text-gray-500">km</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {totalStats.driving_hours.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">hrs</div>
            </div>
          </div>
        </div>
      )}

      {/* Day list */}
      {days.map((day) => (
        <button
          key={day.day_number}
          onClick={() => onSelectDay(day.day_number)}
          className={cn(
            'w-full text-left px-3 py-2.5 rounded-lg transition-colors',
            selectedDay === day.day_number
              ? 'bg-blue-50 border border-blue-200 text-blue-900 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-100'
              : 'hover:bg-gray-100 text-gray-700 dark:hover:bg-slate-800 dark:text-gray-300'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">Day {day.day_number}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">{day.day_of_week}</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {day.title}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {day.date}
          </div>

          {/* Day stats */}
          {showStats && (
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {day.stats.spots_count}
              </span>
              <span className="flex items-center gap-1">
                <Car className="h-3 w-3" />
                {Math.round(day.stats.driving_km)} km
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {Math.round(day.stats.driving_minutes / 60)}h
              </span>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
