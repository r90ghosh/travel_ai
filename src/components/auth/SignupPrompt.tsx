'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SignupPromptProps {
  trigger?: 'comment' | 'share' | 'regenerate' | null;
  tripId?: string;
  onClose?: () => void;
  onSuccess?: () => void;
  message?: string;
  className?: string;
}

const TRIGGER_MESSAGES: Record<string, { title: string; description: string }> = {
  comment: {
    title: 'Sign up to add comments',
    description: 'Create an account to leave comments and collaborate with your travel companions.',
  },
  share: {
    title: 'Sign up to share your trip',
    description: 'Create an account to share your itinerary and collaborate with others.',
  },
  regenerate: {
    title: 'Sign up to regenerate',
    description: 'Create an account to regenerate your itinerary and save all versions.',
  },
};

/**
 * Prompt shown to anonymous users to encourage signup
 * Can be displayed as inline or modal
 */
export function SignupPrompt({
  trigger,
  tripId,
  onClose,
  onSuccess,
  message,
  className = '',
}: SignupPromptProps) {
  const triggerInfo = trigger ? TRIGGER_MESSAGES[trigger] : null;
  const title = triggerInfo?.title || 'Create an account';
  const description = triggerInfo?.description || message || 'Create an account to save your trip and collaborate with others.';

  // Modal mode (when trigger is provided)
  if (trigger && onClose) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>

            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="mt-2 text-sm text-gray-600">{description}</p>

            <div className="mt-6 space-y-3">
              <Link
                href={tripId ? `/signup?redirect=/trip/${tripId}&claim=true` : '/signup'}
                className="block w-full"
              >
                <Button className="w-full">Sign up free</Button>
              </Link>
              <Link
                href={tripId ? `/login?redirect=/trip/${tripId}` : '/login'}
                className="block w-full"
              >
                <Button variant="outline" className="w-full">
                  Log in
                </Button>
              </Link>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              Your trip will be saved to your account
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Inline mode
  return (
    <div className={`rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-blue-600 dark:text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm text-blue-800 dark:text-blue-200">{description}</p>
          <div className="mt-3 flex gap-3">
            <Link
              href="/signup"
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Sign up free
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupPrompt;
