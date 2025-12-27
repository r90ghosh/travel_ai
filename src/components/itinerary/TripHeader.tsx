'use client';

import Link from 'next/link';
import { Compass, Share2, RefreshCw, Calendar, Users, Zap, MapPin, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  multi_gen: 'Multi-gen',
};

const PACING_ICONS: Record<string, string> = {
  relaxed: '🌿',
  balanced: '⚖️',
  packed: '🚀',
};

export function TripHeader({ trip, itinerary, onShare, onRegenerate }: TripHeaderProps) {
  const destinationName = DESTINATION_NAMES[trip.destination_slug] || trip.destination_slug;

  return (
    <header className="relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-30" />

      <div className="relative">
        {/* Top navigation */}
        <div className="border-b border-amber-200/50 dark:border-slate-700/50 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/30 transition-shadow">
                <Compass className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg text-slate-800 dark:text-white">Travel Planner</span>
            </Link>

            <div className="flex items-center gap-3">
              {onShare && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onShare}
                  className="bg-white/80 hover:bg-white border-amber-200 text-slate-700 hover:text-slate-900 shadow-sm"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              )}
              {onRegenerate && (
                <Button
                  size="sm"
                  onClick={onRegenerate}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-orange-500/25"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Hero content */}
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Destination badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-amber-200/50 dark:border-slate-700 shadow-sm mb-4">
            <span className="text-lg">🇮🇸</span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{destinationName}</span>
          </div>

          {/* Trip title */}
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
            {trip.title || `Your ${destinationName} Adventure`}
          </h1>

          {/* Trip metadata */}
          <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-400 mb-8">
            <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <Calendar className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium">{trip.duration_days} days</span>
              <span className="text-slate-400">·</span>
              <span className="text-sm">{trip.start_date}</span>
            </div>

            <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <Users className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium">{TRAVELER_LABELS[trip.travelers]}</span>
              <span className="text-slate-400">({trip.traveler_count})</span>
            </div>

            <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <span className="text-base">{PACING_ICONS[trip.pacing]}</span>
              <span className="text-sm font-medium capitalize">{trip.pacing}</span>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 border border-amber-100 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {itinerary.summary.total_destinations}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Regions</div>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 border border-amber-100 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                  <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {itinerary.summary.total_driving_km}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Kilometers</div>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 border border-amber-100 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                  <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {itinerary.summary.total_driving_hours}h
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Drive time</div>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 border border-amber-100 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                  <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-slate-900 dark:text-white">
                      ${itinerary.summary.estimated_cost.low.toLocaleString()}
                    </span>
                    <BudgetVarianceBadge variance={itinerary.summary.estimated_cost.variance_percent ?? 0} />
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Est. budget</div>
                </div>
              </div>
            </div>
          </div>

          {/* Anchor badges */}
          <div className="flex flex-wrap gap-2 mt-6">
            <span className="text-sm text-slate-500 dark:text-slate-400 mr-2">Must-see:</span>
            {trip.anchors.map((anchor) => (
              <span
                key={anchor}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-800 dark:text-amber-200 border border-amber-200/50 dark:border-amber-700/50"
              >
                {anchor === 'waterfalls' && '💧'}
                {anchor === 'glaciers' && '🏔️'}
                {anchor === 'northern_lights' && '🌌'}
                {anchor === 'volcanic' && '🌋'}
                {anchor === 'wildlife' && '🦭'}
                {anchor === 'hot_springs' && '♨️'}
                <span className="ml-1.5 capitalize">{anchor.replace(/_/g, ' ')}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

function BudgetVarianceBadge({ variance }: { variance: number }) {
  if (variance <= 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
        {Math.abs(variance)}% under
      </span>
    );
  }

  if (variance <= 15) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
        +{variance}%
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
      +{variance}%
    </span>
  );
}
