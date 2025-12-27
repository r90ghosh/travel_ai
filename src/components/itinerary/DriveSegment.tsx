'use client';

import { Car, ArrowRight, Clock, Navigation, AlertTriangle, Fuel, Signal, SignalZero, Wifi, Route } from 'lucide-react';
import type { RouteSegment } from '@/types';
import { Badge } from '@/components/ui/badge';

interface DriveSegmentProps {
  route: RouteSegment;
  showDetails?: boolean;
}

/**
 * Displays a driving segment between destinations
 * Shows distance, duration, road type, cell coverage, hazards, and gas stations
 */
export function DriveSegment({ route, showDetails = true }: DriveSegmentProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100/50 p-4 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900/50 shadow-sm">
      {/* Main route info */}
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 shadow-lg">
          <Car className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
            <span className="truncate">{route.from_name}</span>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700">
              <Route className="h-3 w-3 text-slate-500" />
              <ArrowRight className="h-3 w-3 text-slate-400" />
            </div>
            <span className="truncate">{route.to_name}</span>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 shadow-sm">
              <Navigation className="h-3 w-3 text-blue-500" />
              {route.distance_km} km
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 shadow-sm">
              <Clock className="h-3 w-3 text-purple-500" />
              {formatDuration(route.drive_minutes)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <RoadTypeBadge type={route.road_type} />
          <CoverageBadge coverage={route.cell_coverage} />
        </div>
      </div>

      {/* Additional details */}
      {showDetails && (
        <div className="mt-3 space-y-2">
          {/* Hazards */}
          {route.hazards && route.hazards !== 'none' && route.hazards.toLowerCase() !== 'none' && (
            <div className="flex items-start gap-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 p-3 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100 dark:border-amber-800/50">
              <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                {route.hazards}
              </p>
            </div>
          )}

          {/* Gas stations */}
          {route.gas_stations && route.gas_stations !== 'None' && route.gas_stations.toLowerCase() !== 'none' && (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
              <Fuel className="h-3.5 w-3.5 text-emerald-500" />
              <span>{route.gas_stations}</span>
            </div>
          )}

          {/* Notes */}
          {route.notes && route.notes !== 'N/A' && (
            <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-white/50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
              {route.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function RoadTypeBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; className: string }> = {
    paved: {
      label: 'Paved',
      className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-0',
    },
    gravel: {
      label: 'Gravel',
      className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-0',
    },
    f_road: {
      label: 'F-Road',
      className: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border-0',
    },
    mixed: {
      label: 'Mixed',
      className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 border-0',
    },
  };

  const { label, className } = config[type] || config.paved;

  return (
    <Badge className={`text-xs font-medium ${className}`}>
      {label}
    </Badge>
  );
}

function CoverageBadge({ coverage }: { coverage: string }) {
  const config: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
    good: {
      icon: <Wifi className="h-3.5 w-3.5" />,
      label: 'Good signal',
      className: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30',
    },
    spotty: {
      icon: <Signal className="h-3.5 w-3.5" />,
      label: 'Spotty signal',
      className: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30',
    },
    none: {
      icon: <SignalZero className="h-3.5 w-3.5" />,
      label: 'No signal',
      className: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30',
    },
  };

  const { icon, label, className } = config[coverage] || config.good;

  return (
    <span className={`flex items-center p-2 rounded-lg ${className}`} title={label}>
      {icon}
    </span>
  );
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export default DriveSegment;
