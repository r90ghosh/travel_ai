'use client';

import { Car, ArrowRight, Clock, Navigation, AlertTriangle, Fuel, Signal, SignalZero, Wifi } from 'lucide-react';
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
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
      {/* Main route info */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
          <Car className="h-4 w-4 text-slate-600 dark:text-slate-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900 dark:text-white">
            <span className="truncate">{route.from_name}</span>
            <ArrowRight className="h-3 w-3 flex-shrink-0 text-slate-400" />
            <span className="truncate">{route.to_name}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Navigation className="h-3 w-3" />
              {route.distance_km} km
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(route.drive_minutes)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <RoadTypeBadge type={route.road_type} />
          <CoverageBadge coverage={route.cell_coverage} />
        </div>
      </div>

      {/* Additional details */}
      {showDetails && (
        <>
          {/* Hazards */}
          {route.hazards && route.hazards !== 'none' && route.hazards.toLowerCase() !== 'none' && (
            <div className="mt-2.5 flex items-start gap-2 rounded-md bg-amber-50 p-2 dark:bg-amber-900/20">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-200">
                {route.hazards}
              </p>
            </div>
          )}

          {/* Gas stations */}
          {route.gas_stations && route.gas_stations !== 'None' && route.gas_stations.toLowerCase() !== 'none' && (
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Fuel className="h-3 w-3" />
              <span>{route.gas_stations}</span>
            </div>
          )}

          {/* Notes */}
          {route.notes && route.notes !== 'N/A' && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 italic">
              {route.notes}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function RoadTypeBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; className: string }> = {
    paved: {
      label: 'Paved',
      className: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200',
    },
    gravel: {
      label: 'Gravel',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-200',
    },
    f_road: {
      label: 'F-Road',
      className: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200',
    },
    mixed: {
      label: 'Mixed',
      className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 border-orange-200',
    },
  };

  const { label, className } = config[type] || config.paved;

  return (
    <Badge variant="outline" className={`text-xs ${className}`}>
      {label}
    </Badge>
  );
}

function CoverageBadge({ coverage }: { coverage: string }) {
  const config: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
    good: {
      icon: <Wifi className="h-3 w-3" />,
      label: 'Good signal',
      className: 'text-green-600 dark:text-green-400',
    },
    spotty: {
      icon: <Signal className="h-3 w-3" />,
      label: 'Spotty signal',
      className: 'text-yellow-600 dark:text-yellow-400',
    },
    none: {
      icon: <SignalZero className="h-3 w-3" />,
      label: 'No signal',
      className: 'text-red-600 dark:text-red-400',
    },
  };

  const { icon, label, className } = config[coverage] || config.good;

  return (
    <span className={`flex items-center ${className}`} title={label}>
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
