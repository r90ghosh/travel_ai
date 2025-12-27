'use client';

import { ChevronDown, ChevronUp, MapPin, Car, Clock, Home, MessageSquare } from 'lucide-react';
import type { ItineraryDay, HydratedItineraryDay } from '@/types';
import { TimelineItem } from './TimelineItem';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DayViewProps {
  day: ItineraryDay | HydratedItineraryDay;
  isExpanded?: boolean;
  onToggle?: () => void;
  onComment?: (targetType: 'day' | 'spot' | 'activity', targetId?: string) => void;
}

/**
 * Displays a single day of the itinerary with its timeline items
 */
export function DayView({ day, isExpanded = true, onToggle, onComment }: DayViewProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      {/* Day header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-100">
              Day {day.day_number}
            </Badge>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {day.day_of_week}, {day.date}
            </span>
          </div>
          <h3 className="mt-1.5 text-lg font-semibold text-slate-900 dark:text-white">
            {day.title}
          </h3>
          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {day.stats.spots_count} spots
            </span>
            <span className="flex items-center gap-1">
              <Car className="h-3.5 w-3.5" />
              {Math.round(day.stats.driving_km)} km
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              ~{Math.round(day.stats.driving_minutes / 60)}h driving
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          {onComment && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onComment('day', `day-${day.day_number}`);
              }}
              className="text-xs h-8"
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1" />
              Comment
            </Button>
          )}
          {onToggle && (
            isExpanded ? (
              <ChevronUp className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )
          )}
        </div>
      </button>

      {/* Timeline */}
      {isExpanded && (
        <div className="border-t border-slate-100 p-4 dark:border-slate-700">
          <div className="space-y-4">
            {day.timeline.map((item) => (
              <TimelineItem
                key={item.id}
                item={item}
                onComment={onComment ? (id) => {
                  const targetType = item.type === 'activity' ? 'activity' : 'spot';
                  onComment(targetType, id || item.id);
                } : undefined}
              />
            ))}
          </div>

          {/* Accommodation */}
          {day.accommodation && (
            <div className="mt-6 rounded-lg bg-indigo-50 p-4 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900">
                  <Home className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                    Stay tonight
                  </h4>
                  <p className="mt-1 font-medium text-slate-900 dark:text-white">
                    {day.accommodation.area}
                  </p>
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
