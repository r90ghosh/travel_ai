'use client';

import { UtensilsCrossed, Coffee, Sun, Moon } from 'lucide-react';
import type { MealType } from '@/types';

interface MealCardProps {
  mealType: MealType;
  suggestion?: string;
  duration?: number;
}

const MEAL_CONFIG: Record<MealType, { icon: React.ReactNode; label: string; bgColor: string; iconColor: string }> = {
  breakfast: {
    icon: <Coffee className="h-4 w-4" />,
    label: 'Breakfast',
    bgColor: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  lunch: {
    icon: <Sun className="h-4 w-4" />,
    label: 'Lunch',
    bgColor: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  dinner: {
    icon: <Moon className="h-4 w-4" />,
    label: 'Dinner',
    bgColor: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
};

/**
 * Simple meal card showing meal type and optional suggestion
 */
export function MealCard({ mealType, suggestion, duration }: MealCardProps) {
  const config = MEAL_CONFIG[mealType] || {
    icon: <UtensilsCrossed className="h-4 w-4" />,
    label: mealType,
    bgColor: 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700',
    iconColor: 'text-slate-600 dark:text-slate-400',
  };

  return (
    <div className={`rounded-lg border p-3 ${config.bgColor}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-slate-700 ${config.iconColor}`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-slate-900 dark:text-white capitalize">
              {config.label}
            </h4>
            {duration && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ~{duration} min
              </span>
            )}
          </div>
          {suggestion && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {suggestion}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default MealCard;
