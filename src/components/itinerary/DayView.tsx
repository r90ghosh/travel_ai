'use client';

import { ChevronDown, ChevronUp, MapPin, Car, Clock, Home, MessageSquare, Sunrise, Sun, Sunset } from 'lucide-react';
import type { ItineraryDay, HydratedItineraryDay } from '@/types';
import { TimelineItem } from './TimelineItem';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DayViewProps {
  day: ItineraryDay | HydratedItineraryDay;
  isExpanded?: boolean;
  onToggle?: () => void;
  onComment?: (targetType: 'day' | 'spot' | 'activity', targetId?: string) => void;
}

const DAY_COLORS = [
  { bg: 'from-blue-500 to-blue-600', light: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
  { bg: 'from-emerald-500 to-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600' },
  { bg: 'from-amber-500 to-amber-600', light: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600' },
  { bg: 'from-rose-500 to-rose-600', light: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-600' },
  { bg: 'from-purple-500 to-purple-600', light: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600' },
  { bg: 'from-cyan-500 to-cyan-600', light: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-600' },
  { bg: 'from-orange-500 to-orange-600', light: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600' },
  { bg: 'from-pink-500 to-pink-600', light: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-600' },
  { bg: 'from-indigo-500 to-indigo-600', light: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600' },
  { bg: 'from-teal-500 to-teal-600', light: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-600' },
];

function getTimeOfDay(time: string): 'morning' | 'afternoon' | 'evening' {
  const hour = parseInt(time.split(':')[0], 10);
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

/**
 * Displays a single day of the itinerary with its timeline items
 */
export function DayView({ day, isExpanded = true, onToggle, onComment }: DayViewProps) {
  const colors = DAY_COLORS[(day.day_number - 1) % DAY_COLORS.length];

  // Group timeline items by time of day
  const morningItems = day.timeline.filter(item => getTimeOfDay(item.time) === 'morning');
  const afternoonItems = day.timeline.filter(item => getTimeOfDay(item.time) === 'afternoon');
  const eveningItems = day.timeline.filter(item => getTimeOfDay(item.time) === 'evening');

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
      {/* Day header */}
      <div className={cn('p-6', colors.light, 'dark:bg-slate-800/50')}>
        <div className="flex items-start gap-4">
          {/* Day number badge */}
          <div className={cn(
            'flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-2xl shadow-lg',
            colors.bg
          )}>
            {day.day_number}
          </div>

          {/* Day info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('text-sm font-semibold', colors.text)}>
                {day.day_of_week}
              </span>
              <span className="text-slate-400 dark:text-slate-500">·</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {day.date}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
              {day.title}
            </h2>

            {/* Stats pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-700 text-sm text-slate-600 dark:text-slate-300 shadow-sm">
                <MapPin className="h-3.5 w-3.5 text-blue-500" />
                {day.stats.spots_count} spots
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-700 text-sm text-slate-600 dark:text-slate-300 shadow-sm">
                <Car className="h-3.5 w-3.5 text-emerald-500" />
                {Math.round(day.stats.driving_km)} km
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-700 text-sm text-slate-600 dark:text-slate-300 shadow-sm">
                <Clock className="h-3.5 w-3.5 text-purple-500" />
                ~{Math.round(day.stats.driving_minutes / 60)}h drive
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {onComment && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onComment('day', `day-${day.day_number}`)}
                className="bg-white/80 hover:bg-white border-slate-200 text-slate-600 shadow-sm"
              >
                <MessageSquare className="h-4 w-4 mr-1.5" />
                Comment
              </Button>
            )}
            {onToggle && (
              <button
                onClick={onToggle}
                className="p-2 rounded-xl bg-white/80 hover:bg-white border border-slate-200 shadow-sm transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-slate-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-500" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      {isExpanded && (
        <div className="p-6 pt-4">
          {/* Morning section */}
          {morningItems.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Sunrise className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Morning</span>
              </div>
              <div className="space-y-1">
                {morningItems.map((item) => (
                  <TimelineItem
                    key={item.id}
                    item={item}
                    dayColor={colors}
                    onComment={onComment ? (id) => {
                      const targetType = item.type === 'activity' ? 'activity' : 'spot';
                      onComment(targetType, id || item.id);
                    } : undefined}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Afternoon section */}
          {afternoonItems.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <Sun className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Afternoon</span>
              </div>
              <div className="space-y-1">
                {afternoonItems.map((item) => (
                  <TimelineItem
                    key={item.id}
                    item={item}
                    dayColor={colors}
                    onComment={onComment ? (id) => {
                      const targetType = item.type === 'activity' ? 'activity' : 'spot';
                      onComment(targetType, id || item.id);
                    } : undefined}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Evening section */}
          {eveningItems.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <Sunset className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Evening</span>
              </div>
              <div className="space-y-1">
                {eveningItems.map((item) => (
                  <TimelineItem
                    key={item.id}
                    item={item}
                    dayColor={colors}
                    onComment={onComment ? (id) => {
                      const targetType = item.type === 'activity' ? 'activity' : 'spot';
                      onComment(targetType, id || item.id);
                    } : undefined}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Accommodation */}
          {day.accommodation && (
            <div className="mt-6 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-5 border border-indigo-100 dark:border-indigo-800/50">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                  <Home className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-1">
                    Tonight&apos;s Stay
                  </div>
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {day.accommodation.area}
                  </h4>
                  {day.accommodation.suggestion && (
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {day.accommodation.suggestion}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DayView;
