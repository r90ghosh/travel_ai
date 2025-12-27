'use client';

import { useEffect, useRef } from 'react';
import type { HydratedItineraryDay } from '@/types';

interface TripMapProps {
  days: HydratedItineraryDay[];
  activeDay?: number;
  onSpotClick?: (spotId: string) => void;
}

/**
 * Interactive map showing the trip route
 * Uses Mapbox GL JS for rendering
 */
export function TripMap({ days, activeDay, onSpotClick }: TripMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    // TODO: Initialize Mapbox map
    // TODO: Add route lines for each day
    // TODO: Add markers for spots
    // TODO: Handle day filtering
    // TODO: Cleanup on unmount

    return () => {
      // Cleanup
    };
  }, [days, activeDay]);

  return (
    <div className="relative h-full w-full">
      <div
        ref={mapContainerRef}
        className="h-full w-full rounded-lg bg-slate-100 dark:bg-slate-700"
      />

      {/* Day filter buttons */}
      <div className="absolute left-2 top-2 flex flex-wrap gap-1">
        <button
          className={`rounded px-2 py-1 text-xs font-medium ${
            activeDay === undefined
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-200'
          }`}
        >
          All
        </button>
        {days.map((day) => (
          <button
            key={day.day_number}
            className={`rounded px-2 py-1 text-xs font-medium ${
              activeDay === day.day_number
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-200'
            }`}
          >
            Day {day.day_number}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 rounded bg-white p-2 text-xs dark:bg-slate-800">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-500" /> Spot
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-500" /> Activity
        </div>
        <div className="flex items-center gap-1">
          <span className="h-0.5 w-4 bg-slate-400" /> Route
        </div>
      </div>

      {/* Placeholder for when map is loading */}
      {!mapRef.current && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Loading map...
          </p>
        </div>
      )}
    </div>
  );
}

export default TripMap;
