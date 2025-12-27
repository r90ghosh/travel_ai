'use client';

import type { Spot, SpotLabels } from '@/types';

interface SpotCardProps {
  spot: Spot & { labels?: SpotLabels };
  duration: number;
  onComment?: () => void;
}

/**
 * Displays a spot/destination card with details and actions
 */
export function SpotCard({ spot, duration, onComment }: SpotCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-white">
            {spot.name}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {spot.region} • {duration} min
          </p>
        </div>
        <div className="flex items-center gap-1">
          {spot.cost && (
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
              {spot.cost}
            </span>
          )}
          {spot.booking_required && (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300">
              Book ahead
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
        {spot.description}
      </p>

      {/* Labels */}
      {spot.labels && (
        <div className="mt-3 flex flex-wrap gap-1">
          <span className={`rounded-full px-2 py-0.5 text-xs ${getPhysicalLevelColor(spot.labels.physical_level)}`}>
            {spot.labels.physical_level}
          </span>
          {spot.labels.iceland_factor && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {formatIcelandFactor(spot.labels.iceland_factor)}
            </span>
          )}
        </div>
      )}

      {/* Pro tip */}
      {spot.pro_tip && (
        <div className="mt-3 rounded bg-amber-50 p-2 dark:bg-amber-900/20">
          <p className="text-xs text-amber-800 dark:text-amber-200">
            <span className="font-medium">Pro tip:</span> {spot.pro_tip}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
        <button
          onClick={onComment}
          className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          💬 Comment
        </button>
        <button className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
          🔄 Swap
        </button>
        <button className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
          ❌ Remove
        </button>
      </div>
    </div>
  );
}

function getPhysicalLevelColor(level: string): string {
  switch (level) {
    case 'easy':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'moderate':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'challenging':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'strenuous':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
  }
}

function formatIcelandFactor(factor: string): string {
  return factor.replace(/_/g, ' ');
}

export default SpotCard;
