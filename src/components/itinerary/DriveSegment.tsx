'use client';

import type { RouteSegment } from '@/types';

interface DriveSegmentProps {
  route: RouteSegment;
}

/**
 * Displays a driving segment between destinations
 */
export function DriveSegment({ route }: DriveSegmentProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <span className="text-lg">🚗</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {route.from_name} → {route.to_name}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {route.distance_km} km • {formatDuration(route.drive_minutes)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <RoadTypeBadge type={route.road_type} />
          <CoverageBadge coverage={route.cell_coverage} />
        </div>
      </div>

      {/* Hazards or notes */}
      {(route.hazards && route.hazards !== 'none') && (
        <div className="mt-2 rounded bg-amber-50 p-2 dark:bg-amber-900/20">
          <p className="text-xs text-amber-800 dark:text-amber-200">
            ⚠️ {route.hazards}
          </p>
        </div>
      )}

      {route.gas_stations && route.gas_stations !== 'None' && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          ⛽ {route.gas_stations}
        </p>
      )}
    </div>
  );
}

function RoadTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    paved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    gravel: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    f_road: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    mixed: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  };

  return (
    <span className={`rounded px-1.5 py-0.5 text-xs ${colors[type] || colors.paved}`}>
      {type.replace('_', '-')}
    </span>
  );
}

function CoverageBadge({ coverage }: { coverage: string }) {
  const icons: Record<string, string> = {
    good: '📶',
    spotty: '📵',
    none: '❌',
  };

  return (
    <span className="text-xs" title={`Cell coverage: ${coverage}`}>
      {icons[coverage] || icons.good}
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
