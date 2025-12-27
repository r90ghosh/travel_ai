'use client';

import { cn } from '@/lib/utils';
import type { ItineraryDay } from '@/types';

interface DaySelectorProps {
  days: ItineraryDay[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
}

export function DaySelector({ days, selectedDay, onSelectDay }: DaySelectorProps) {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-medium text-gray-500 mb-3">Your Trip</h3>
      {days.map((day) => (
        <button
          key={day.day_number}
          onClick={() => onSelectDay(day.day_number)}
          className={cn(
            'w-full text-left px-3 py-2 rounded-lg transition-colors',
            selectedDay === day.day_number
              ? 'bg-blue-50 border border-blue-200 text-blue-900'
              : 'hover:bg-gray-100 text-gray-700'
          )}
        >
          <div className="font-medium text-sm">Day {day.day_number}</div>
          <div className="text-xs text-gray-500 truncate">{day.title}</div>
          <div className="text-xs text-gray-400 mt-0.5">
            {day.date} &middot; {day.day_of_week}
          </div>
        </button>
      ))}
    </div>
  );
}
