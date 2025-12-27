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
  Sparkles,
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
      <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30 shadow-sm hover:shadow-md transition-shadow dark:border-emerald-900/50 dark:from-slate-800 dark:to-emerald-900/10">
        {/* Collapsed header - always visible */}
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 text-left">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-slate-900 dark:text-white">
                    {activity.name}
                  </h4>
                  {activity.labels?.iceland_factor === 'only_here' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 text-xs font-medium">
                      <Sparkles className="h-3 w-3" />
                      Unique
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-emerald-500" />
                    {activity.operator}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-sm text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-emerald-500" />
                    {formatDuration(displayDuration)}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                    {priceRange}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activity.book_ahead_days > 0 && (
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0 text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    Book {activity.book_ahead_days}d ahead
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
            {/* Description */}
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {activity.description}
            </p>

            {/* Why recommended */}
            {activity.why_recommended && (
              <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 p-4 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-800/50">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                    <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1">Why we recommend it</p>
                    <p className="text-sm text-emerald-800 dark:text-emerald-200">
                      {activity.why_recommended}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* What to wear */}
            {activity.what_to_wear && (
              <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/50">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                    <Shirt className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">What to wear</p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {activity.what_to_wear}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tips */}
            {activity.tips && (
              <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 p-4 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100 dark:border-amber-800/50">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                    <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">Tips</p>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      {activity.tips}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Labels */}
            {activity.labels && (
              <div className="flex flex-wrap gap-2 pt-2">
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
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
              {activity.booking_url && (
                <Button
                  size="sm"
                  asChild
                  className="text-xs h-8 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                >
                  <a
                    href={activity.booking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    Book Now
                  </a>
                </Button>
              )}
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

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export default ActivityCard;
