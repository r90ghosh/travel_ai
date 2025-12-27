'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, MapPin, MessageSquare, ArrowRightLeft, X, Lightbulb, AlertTriangle, Star } from 'lucide-react';
import type { Spot, SpotLabels } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface SpotCardProps {
  spot: Spot & { labels?: SpotLabels };
  duration: number;
  onComment?: () => void;
  onSwap?: () => void;
  onRemove?: () => void;
  defaultExpanded?: boolean;
}

/**
 * Displays a spot/destination card with collapsible details
 * - Collapsed: name, duration, one-line teaser
 * - Expanded: full description, why_this_spot, pro_tip, skip_if, labels
 */
export function SpotCard({
  spot,
  duration,
  onComment,
  onSwap,
  onRemove,
  defaultExpanded = false,
}: SpotCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Get teaser (first sentence of description)
  const teaser = spot.description.split('.')[0] + '.';

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        {/* Collapsed header - always visible */}
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-slate-900 dark:text-white truncate">
                    {spot.name}
                  </h4>
                  {spot.labels?.iceland_factor === 'only_here' && (
                    <Star className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-sm text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {spot.region}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {duration} min
                  </span>
                </div>
                {!isExpanded && (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-1">
                    {teaser}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-2">
                {spot.cost && spot.cost !== 'Free' && (
                  <Badge variant="secondary" className="text-xs">
                    {spot.cost}
                  </Badge>
                )}
                {spot.booking_required && (
                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                    Book ahead
                  </Badge>
                )}
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </div>
            </div>
          </button>
        </CollapsibleTrigger>

        {/* Expanded content */}
        <CollapsibleContent>
          <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700">
            {/* Full description */}
            <p className="mt-4 text-sm text-slate-700 dark:text-slate-300">
              {spot.description}
            </p>

            {/* Why this spot */}
            {spot.why_this_spot && (
              <div className="mt-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                <div className="flex items-start gap-2">
                  <Star className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-blue-800 dark:text-blue-200">Why this spot</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      {spot.why_this_spot}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Pro tip */}
            {spot.pro_tip && (
              <div className="mt-3 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-200">Pro tip</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      {spot.pro_tip}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Skip if */}
            {spot.skip_if && (
              <div className="mt-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-900/50">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Skip if</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {spot.skip_if}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Best time */}
            {spot.best_time && (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-medium">Best time:</span> {spot.best_time}
              </p>
            )}

            {/* Labels */}
            {spot.labels && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                <Badge className={getPhysicalLevelColor(spot.labels.physical_level)}>
                  {spot.labels.physical_level}
                </Badge>
                {spot.labels.iceland_factor && (
                  <Badge variant="outline" className="text-blue-600 border-blue-300 dark:text-blue-400 dark:border-blue-700">
                    {formatIcelandFactor(spot.labels.iceland_factor)}
                  </Badge>
                )}
                {spot.labels.activity_types?.slice(0, 2).map((type) => (
                  <Badge key={type} variant="secondary" className="text-xs">
                    {type}
                  </Badge>
                ))}
                {spot.labels.seasonality !== 'year_round' && (
                  <Badge variant="outline" className="text-xs">
                    {spot.labels.seasonality.replace('_', ' ')}
                  </Badge>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onComment?.();
                }}
                className="text-xs h-8"
              >
                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                Comment
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSwap?.();
                }}
                className="text-xs h-8"
              >
                <ArrowRightLeft className="h-3.5 w-3.5 mr-1" />
                Swap
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove?.();
                }}
                className="text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function getPhysicalLevelColor(level: string): string {
  switch (level) {
    case 'easy':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-100';
    case 'moderate':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 hover:bg-yellow-100';
    case 'challenging':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 hover:bg-orange-100';
    case 'strenuous':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-100';
    default:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-100';
  }
}

function formatIcelandFactor(factor: string): string {
  const labels: Record<string, string> = {
    only_here: 'Only in Iceland',
    world_class: 'World Class',
    iconic_iceland: 'Iconic Iceland',
    local_character: 'Local Character',
    scenic_filler: 'Scenic',
  };
  return labels[factor] || factor.replace(/_/g, ' ');
}

export default SpotCard;
