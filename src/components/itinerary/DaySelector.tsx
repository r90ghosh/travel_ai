'use client';

import { MapPin, Car, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ItineraryDay, HydratedItineraryDay } from '@/types';
import { useRef } from 'react';

interface DaySelectorProps {
  days: (ItineraryDay | HydratedItineraryDay)[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
  variant?: 'horizontal' | 'vertical';
}

const DAY_COLORS = [
  'from-blue-500 to-blue-600',
  'from-emerald-500 to-emerald-600',
  'from-amber-500 to-amber-600',
  'from-rose-500 to-rose-600',
  'from-purple-500 to-purple-600',
  'from-cyan-500 to-cyan-600',
  'from-orange-500 to-orange-600',
  'from-pink-500 to-pink-600',
  'from-indigo-500 to-indigo-600',
  'from-teal-500 to-teal-600',
];

export function DaySelector({ days, selectedDay, onSelectDay, variant = 'horizontal' }: DaySelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (variant === 'vertical') {
    return (
      <div className="space-y-2">
        {days.map((day) => {
          const colorClass = DAY_COLORS[(day.day_number - 1) % DAY_COLORS.length];
          const isSelected = selectedDay === day.day_number;

          return (
            <button
              key={day.day_number}
              onClick={() => onSelectDay(day.day_number)}
              className={cn(
                'w-full text-left p-4 rounded-xl transition-all duration-200',
                isSelected
                  ? 'bg-white dark:bg-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 ring-2 ring-amber-400/50'
                  : 'bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg shadow-lg',
                  colorClass
                )}>
                  {day.day_number}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {day.day_of_week}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {day.date}
                    </span>
                  </div>
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                    {day.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
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
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // Horizontal variant (default)
  return (
    <div className="relative">
      {/* Scroll buttons */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/90 dark:bg-slate-800/90 shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors"
      >
        <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-300" />
      </button>
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/90 dark:bg-slate-800/90 shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors"
      >
        <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-300" />
      </button>

      {/* Scrollable day cards */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-8 py-2 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {days.map((day) => {
          const colorClass = DAY_COLORS[(day.day_number - 1) % DAY_COLORS.length];
          const isSelected = selectedDay === day.day_number;

          return (
            <button
              key={day.day_number}
              onClick={() => onSelectDay(day.day_number)}
              className={cn(
                'flex-shrink-0 w-36 p-4 rounded-2xl transition-all duration-200 text-left',
                isSelected
                  ? 'bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 ring-2 ring-amber-400 scale-105'
                  : 'bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg hover:scale-102'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold mb-3 shadow-lg',
                colorClass
              )}>
                {day.day_number}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                {day.day_of_week}
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-2 min-h-[2.5rem]">
                {day.title}
              </h4>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                <span className="flex items-center gap-0.5">
                  <MapPin className="h-3 w-3" />
                  {day.stats.spots_count}
                </span>
                <span>·</span>
                <span>{Math.round(day.stats.driving_km)}km</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
