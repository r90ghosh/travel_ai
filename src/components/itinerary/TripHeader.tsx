'use client';

import Link from 'next/link';
import { Mountain, Share2, RefreshCw, Calendar, Users, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Trip, GeneratedItinerary } from '@/types';

interface TripHeaderProps {
  trip: Trip;
  itinerary: GeneratedItinerary;
  onShare?: () => void;
  onRegenerate?: () => void;
}

const DESTINATION_NAMES: Record<string, string> = {
  iceland: 'Iceland',
  japan: 'Japan',
  italy: 'Italy',
  peru: 'Peru',
};

const TRAVELER_LABELS: Record<string, string> = {
  solo: 'Solo',
  couple: 'Couple',
  friends: 'Friends',
  family: 'Family',
  multi_gen: 'Multi-generational',
};

const PACING_LABELS: Record<string, string> = {
  relaxed: 'Relaxed',
  balanced: 'Balanced',
  packed: 'Packed',
};

export function TripHeader({ trip, itinerary, onShare, onRegenerate }: TripHeaderProps) {
  const destinationName = DESTINATION_NAMES[trip.destination_slug] || trip.destination_slug;

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container max-w-7xl py-6">
        {/* Top row: Logo + Actions */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="flex items-center gap-2">
            <Mountain className="h-6 w-6 text-emerald-600" />
            <span className="font-semibold text-gray-900">Travel Planner</span>
          </Link>

          <div className="flex items-center gap-2">
            {onShare && (
              <Button variant="outline" size="sm" onClick={onShare}>
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
            )}
            {onRegenerate && (
              <Button variant="outline" size="sm" onClick={onRegenerate}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Regenerate
              </Button>
            )}
          </div>
        </div>

        {/* Trip title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {trip.title || `Your ${destinationName} Adventure`}
        </h1>

        {/* Trip metadata badges */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>
              {trip.duration_days} days &middot; {trip.start_date} to {trip.end_date}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>
              {TRAVELER_LABELS[trip.travelers]} ({trip.traveler_count})
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Gauge className="h-4 w-4" />
            <span>{PACING_LABELS[trip.pacing]} pace</span>
          </div>
        </div>

        {/* Summary stats */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {itinerary.summary.total_destinations}
            </div>
            <div className="text-xs text-gray-500">Regions</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {itinerary.summary.total_driving_km} km
            </div>
            <div className="text-xs text-gray-500">Total Driving</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {itinerary.summary.total_driving_hours}h
            </div>
            <div className="text-xs text-gray-500">Drive Time</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              ${itinerary.summary.estimated_cost.low.toLocaleString()}-
              ${itinerary.summary.estimated_cost.high.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Est. Cost</div>
          </div>

          {/* Anchor badges */}
          <div className="ml-auto flex gap-2">
            {trip.anchors.map((anchor) => (
              <Badge key={anchor} variant="secondary">
                {anchor.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
