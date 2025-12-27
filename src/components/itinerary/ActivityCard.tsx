'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  ExternalLink,
  MessageSquare,
  Building2,
  Calendar,
  Shirt,
  Lightbulb,
  Star,
} from 'lucide-react';
import type { Activity, ActivityLabels } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface ActivityCardProps {
  activity: Activity & { labels?: ActivityLabels };
  duration?: number;
  onComment?: () => void;
  defaultExpanded?: boolean;
}

/**
 * Displays a bookable activity card with operator, price, and booking info
 * - Collapsed: name, operator, duration, price range
 * - Expanded: full description, why_recommended, what_to_wear, tips, booking link
 */
export function ActivityCard({
  activity,
  duration,
  onComment,
  defaultExpanded = false,
}: ActivityCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const displayDuration = duration || activity.duration_hrs * 60;
  const priceRange = `$${activity.price_low_usd}-$${activity.price_high_usd}`;

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="rounded-lg border border-green-200 bg-white shadow-sm dark:border-green-800 dark:bg-slate-800">
        {/* Collapsed header - always visible */}
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 text-left hover:bg-green-50/50 dark:hover:bg-green-900/10 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-slate-900 dark:text-white truncate">
                    {activity.name}
                  </h4>
                  {activity.labels?.iceland_factor === 'only_here' && (
                    <Star className="h-4 w-4 text-green-500 flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-sm text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {activity.operator}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-sm text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {formatDuration(displayDuration)}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                    {priceRange}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-2">
                {activity.book_ahead_days > 0 && (
                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700">
                    <Calendar className="h-3 w-3 mr-1" />
                    Book {activity.book_ahead_days}d ahead
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
          <div className="px-4 pb-4 border-t border-green-100 dark:border-green-900">
            {/* Description */}
            <p className="mt-4 text-sm text-slate-700 dark:text-slate-300">
              {activity.description}
            </p>

            {/* Why recommended */}
            {activity.why_recommended && (
              <div className="mt-4 rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                <div className="flex items-start gap-2">
                  <Star className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-green-800 dark:text-green-200">Why we recommend it</p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      {activity.why_recommended}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* What to wear */}
            {activity.what_to_wear && (
              <div className="mt-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                <div className="flex items-start gap-2">
                  <Shirt className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-blue-800 dark:text-blue-200">What to wear</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      {activity.what_to_wear}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tips */}
            {activity.tips && (
              <div className="mt-3 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-200">Tips</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      {activity.tips}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Labels */}
            {activity.labels && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                <Badge className={getPhysicalLevelColor(activity.labels.physical_level)}>
                  {activity.labels.physical_level}
                </Badge>
                {activity.labels.activity_types?.slice(0, 2).map((type) => (
                  <Badge key={type} variant="secondary" className="text-xs">
                    {type}
                  </Badge>
                ))}
                {activity.labels.seasonality !== 'year_round' && (
                  <Badge variant="outline" className="text-xs">
                    {activity.labels.seasonality.replace('_', ' ')}
                  </Badge>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex items-center gap-2 pt-3 border-t border-green-100 dark:border-green-900">
              {activity.booking_url && (
                <Button
                  variant="default"
                  size="sm"
                  asChild
                  className="text-xs h-8 bg-green-600 hover:bg-green-700"
                >
                  <a
                    href={activity.booking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                    Book Now
                  </a>
                </Button>
              )}
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

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export default ActivityCard;
