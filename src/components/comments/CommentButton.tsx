'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CommentButtonProps {
  commentCount?: number;
  hasUnresolved?: boolean;
  onClick: () => void;
  className?: string;
  position?: 'left' | 'right';
}

/**
 * Small hover button that appears on itinerary items
 * Shows comment count badge when comments exist
 * Highlights when there are unresolved comments
 */
export function CommentButton({
  commentCount = 0,
  hasUnresolved = false,
  onClick,
  className = '',
  position = 'right',
}: CommentButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'group relative flex items-center justify-center rounded-full transition-all duration-200',
        'h-8 w-8 hover:h-8 hover:w-auto hover:px-2',
        'bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700',
        'hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600',
        hasUnresolved && 'border-amber-400 dark:border-amber-500',
        position === 'left' ? '-left-4' : '-right-4',
        className
      )}
      aria-label={`${commentCount} comment${commentCount !== 1 ? 's' : ''}`}
    >
      {/* Comment icon */}
      <svg
        className={cn(
          'h-4 w-4 flex-shrink-0 transition-colors',
          hasUnresolved
            ? 'text-amber-500 dark:text-amber-400'
            : 'text-slate-400 group-hover:text-blue-500 dark:text-slate-500 dark:group-hover:text-blue-400'
        )}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
        />
      </svg>

      {/* Comment count */}
      {commentCount > 0 && (
        <span
          className={cn(
            'ml-1 text-xs font-medium transition-all',
            isHovered ? 'opacity-100 w-auto' : 'opacity-0 w-0',
            hasUnresolved
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-slate-600 dark:text-slate-300'
          )}
        >
          {commentCount}
        </span>
      )}

      {/* Unresolved indicator dot */}
      {hasUnresolved && commentCount > 0 && (
        <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-400 dark:bg-amber-500 animate-pulse" />
      )}

      {/* Badge for non-hovered state with comments */}
      {commentCount > 0 && !isHovered && (
        <span
          className={cn(
            'absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold',
            hasUnresolved
              ? 'bg-amber-400 text-amber-900'
              : 'bg-blue-500 text-white'
          )}
        >
          {commentCount > 9 ? '9+' : commentCount}
        </span>
      )}
    </button>
  );
}

export default CommentButton;
