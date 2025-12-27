'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { GeneratedItinerary, ItineraryDay, HydratedItineraryDay } from '@/types';
import { getSpotById, getActivityById } from '@/lib/data-hydrator';

// Set Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface TripMapProps {
  itinerary?: GeneratedItinerary;
  days?: (ItineraryDay | HydratedItineraryDay)[];
  selectedDay?: number | null;
  activeDay?: number;
  onSelectDay?: (day: number) => void;
  onSpotClick?: (spotId: string) => void;
}

// Day colors for markers and route lines
const DAY_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
  '#14B8A6', '#F43F5E', '#A855F7', '#22C55E'
];

/**
 * Interactive Mapbox map showing the itinerary route
 * - Displays markers for each spot/activity
 * - Color-coded by day
 * - Filter to show specific day or all days
 */
export function TripMap({
  itinerary,
  days: propDays,
  selectedDay,
  activeDay,
  onSelectDay,
  onSpotClick,
}: TripMapProps) {
  const days = propDays || itinerary?.days || [];
  const currentDay = selectedDay ?? activeDay ?? null;

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Check for token
    if (!mapboxgl.accessToken) {
      setMapError('Mapbox token not configured');
      return;
    }

    try {
      // Initialize map centered on Iceland
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: [-19.0, 64.5],
        zoom: 5.5,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => setLoaded(true));

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setMapError('Failed to load map');
      });
    } catch (error) {
      console.error('Failed to initialize map:', error);
      setMapError('Failed to initialize map');
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update markers when data or selection changes
  useEffect(() => {
    if (!loaded || !map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Determine which days to show
    const daysToShow = currentDay && currentDay > 0
      ? days.filter(d => d.day_number === currentDay)
      : days;

    // Collect all coordinates for bounds calculation
    const allCoords: [number, number][] = [];

    // Add markers for each day
    daysToShow.forEach(day => {
      const color = DAY_COLORS[(day.day_number - 1) % DAY_COLORS.length];

      day.timeline.forEach((item) => {
        let coords: [number, number] | null = null;
        let name = '';
        let spotId: string | undefined;

        if (item.spot_id) {
          const spot = getSpotById(item.spot_id);
          if (spot) {
            coords = [spot.lng, spot.lat];
            name = spot.name;
            spotId = item.spot_id;
          }
        } else if (item.activity_id) {
          const activity = getActivityById(item.activity_id);
          if (activity && activity.near_spot_id) {
            // Get coords from linked spot
            const nearSpot = getSpotById(activity.near_spot_id);
            if (nearSpot) {
              coords = [nearSpot.lng, nearSpot.lat];
              name = activity.name;
            }
          }
        }

        if (coords && map.current) {
          allCoords.push(coords);

          // Create popup
          const popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div class="p-1">
                <div class="text-xs font-medium text-gray-500">Day ${day.day_number}</div>
                <div class="font-semibold">${name}</div>
                <div class="text-xs text-gray-500">${item.time}</div>
              </div>
            `);

          // Create marker
          const marker = new mapboxgl.Marker({ color })
            .setLngLat(coords)
            .setPopup(popup)
            .addTo(map.current);

          // Handle clicks
          marker.getElement().addEventListener('click', () => {
            onSelectDay?.(day.day_number);
            if (spotId) {
              onSpotClick?.(spotId);
            }
          });

          markersRef.current.push(marker);
        }
      });
    });

    // Fit bounds to show all markers
    if (allCoords.length > 0 && map.current) {
      const bounds = new mapboxgl.LngLatBounds();
      allCoords.forEach(coord => bounds.extend(coord));

      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 10,
        duration: 500,
      });
    }

    // TODO: Draw route polylines between points using Mapbox Directions API

  }, [loaded, days, currentDay, onSelectDay, onSpotClick]);

  // Show error state
  if (mapError) {
    return (
      <div className="relative h-full w-full rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <div className="text-center p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{mapError}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Set NEXT_PUBLIC_MAPBOX_TOKEN in your environment
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div
        ref={mapContainer}
        className="h-full w-full rounded-lg bg-slate-100 dark:bg-slate-700"
      />

      {/* Day filter buttons */}
      <div className="absolute top-4 left-4 bg-white dark:bg-slate-800 rounded-lg shadow-md p-2 flex gap-1 flex-wrap max-w-xs">
        <button
          onClick={() => onSelectDay?.(0)}
          className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
            !currentDay || currentDay === 0
              ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-800'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
          }`}
        >
          All
        </button>
        {days.map(day => (
          <button
            key={day.day_number}
            onClick={() => onSelectDay?.(day.day_number)}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
              currentDay === day.day_number
                ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-800'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
            }`}
            style={{
              borderLeft: `3px solid ${DAY_COLORS[(day.day_number - 1) % DAY_COLORS.length]}`
            }}
          >
            D{day.day_number}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-slate-800 rounded-lg shadow-md p-3 text-xs">
        <div className="font-medium mb-2 text-slate-700 dark:text-slate-200">Legend</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-blue-500" />
            <span className="text-slate-600 dark:text-slate-300">Spot</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-green-500" />
            <span className="text-slate-600 dark:text-slate-300">Activity</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-0.5 w-4 bg-slate-400" />
            <span className="text-slate-600 dark:text-slate-300">Route</span>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {!loaded && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 dark:bg-slate-700/80 rounded-lg">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Loading map...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default TripMap;
