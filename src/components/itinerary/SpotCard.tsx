'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, MapPin, MessageSquare, ArrowRightLeft, X, Lightbulb, AlertTriangle, Sparkles, DollarSign } from 'lucide-react';
import type { Spot, SpotLabels } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ImageLightbox } from '@/components/ui/image-lightbox';
import { getSpotImageUrl } from '@/lib/images';

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
  const teaser = spot.description?.split('.')[0] + '.' || '';

  // Get image URL for this spot
  const imageUrl = getSpotImageUrl(spot.id, spot.name, spot.region);

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/30 shadow-sm hover:shadow-md transition-shadow dark:border-blue-900/50 dark:from-slate-800 dark:to-blue-900/10">
        {/* Collapsed header - always visible */}
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 text-left">
            <div className="flex items-start justify-between gap-3">
              {/* Thumbnail image */}
              <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <ImageLightbox
                  src={imageUrl}
                  alt={spot.name}
                  fallbackName={spot.name}
                  thumbnailClassName="w-16 h-16 rounded-lg overflow-hidden"
                  searchQuery={`${spot.region} ${spot.name}`}
                  searchType="spot"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-slate-900 dark:text-white">
                    {spot.name}
                  </h4>
                  {spot.labels?.iceland_factor === 'only_here' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 text-xs font-medium">
                      <Sparkles className="h-3 w-3" />
                      Unique
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-blue-500" />
                    {spot.region}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-blue-500" />
                    {duration} min
                  </span>
                  {spot.cost && spot.cost !== 'Free' && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                      {spot.cost}
                    </span>
                  )}
                </div>
                {!isExpanded && teaser && (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-1">
                    {teaser}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {spot.booking_required && (
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0 text-xs">
                    Book ahead
                  </Badge>
                )}
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  )}
                </div>
              </div>
            </div>
          </button>
        </CollapsibleTrigger>

        {/* Expanded content */}
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            {/* Full description */}
            {spot.description && (
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {spot.description}
              </p>
            )}

            {/* Why this spot */}
            {spot.why_this_spot && (
              <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/50">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                    <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Why this spot</p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {spot.why_this_spot}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Pro tip */}
            {spot.pro_tip && (
              <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 p-4 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100 dark:border-amber-800/50">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                    <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">Pro tip</p>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      {spot.pro_tip}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Skip if */}
            {spot.skip_if && (
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700">
                    <AlertTriangle className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Skip if</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {spot.skip_if}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Best time */}
            {spot.best_time && (
              <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
                <span className="font-semibold">Best time:</span> {spot.best_time}
              </p>
            )}

            {/* Labels */}
            {spot.labels && (
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge className={getPhysicalLevelColor(spot.labels.physical_level)}>
                  {spot.labels.physical_level}
                </Badge>
                {spot.labels.iceland_factor && (
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0">
                    {formatIcelandFactor(spot.labels.iceland_factor)}
                  </Badge>
                )}
                {spot.labels.activity_types?.slice(0, 2).map((type) => (
                  <Badge key={type} variant="secondary" className="text-xs">
                    {type}
                  </Badge>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
              {onComment && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onComment();
                  }}
                  className="text-xs h-8 text-slate-600 hover:text-slate-900"
                >
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                  Comment
                </Button>
              )}
              {onSwap && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSwap();
                  }}
                  className="text-xs h-8 text-slate-600 hover:text-slate-900"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />
                  Swap
                </Button>
              )}
              {onRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  className="text-xs h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-3.5 w-3.5 mr-1.5" />
                  Remove
                </Button>
              )}
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
      return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0';
    case 'moderate':
      return 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-0';
    case 'challenging':
      return 'bg-orange-100 text-orange-700 hover:bg-orange-100 border-0';
    case 'strenuous':
      return 'bg-red-100 text-red-700 hover:bg-red-100 border-0';
    default:
      return 'bg-slate-100 text-slate-700 hover:bg-slate-100 border-0';
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
