'use client';

import { UtensilsCrossed, Coffee, Sun, Moon, Clock } from 'lucide-react';
import type { MealType } from '@/types';

interface MealCardProps {
  mealType: MealType;
  suggestion?: string;
  duration?: number;
}

const MEAL_CONFIG: Record<MealType, {
  icon: React.ReactNode;
  label: string;
  gradient: string;
  iconBg: string;
  iconColor: string;
  border: string;
}> = {
  breakfast: {
    icon: <Coffee className="h-5 w-5" />,
    label: 'Breakfast',
    gradient: 'from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20',
    iconBg: 'bg-gradient-to-br from-amber-400 to-yellow-500',
    iconColor: 'text-white',
    border: 'border-amber-100 dark:border-amber-800/50',
  },
  lunch: {
    icon: <Sun className="h-5 w-5" />,
    label: 'Lunch',
    gradient: 'from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',
    iconBg: 'bg-gradient-to-br from-orange-400 to-amber-500',
    iconColor: 'text-white',
    border: 'border-orange-100 dark:border-orange-800/50',
  },
  dinner: {
    icon: <Moon className="h-5 w-5" />,
    label: 'Dinner',
    gradient: 'from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20',
    iconBg: 'bg-gradient-to-br from-indigo-400 to-purple-500',
    iconColor: 'text-white',
    border: 'border-indigo-100 dark:border-indigo-800/50',
  },
};

/**
 * Simple meal card showing meal type and optional suggestion
 */
export function MealCard({ mealType, suggestion, duration }: MealCardProps) {
  const config = MEAL_CONFIG[mealType] || {
    icon: <UtensilsCrossed className="h-5 w-5" />,
    label: mealType,
    gradient: 'from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900',
    iconBg: 'bg-gradient-to-br from-slate-400 to-slate-500',
    iconColor: 'text-white',
    border: 'border-slate-200 dark:border-slate-700',
  };

  return (
    <div className={`rounded-xl border bg-gradient-to-r p-4 shadow-sm ${config.gradient} ${config.border}`}>
      <div className="flex items-start gap-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-lg ${config.iconBg} ${config.iconColor}`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-900 dark:text-white capitalize">
              {config.label}
            </h4>
            {duration && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 px-2 py-1 rounded-full">
                <Clock className="h-3 w-3" />
                ~{duration} min
              </span>
            )}
          </div>
          {suggestion && (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {suggestion}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default MealCard;
