'use client';

import Link from 'next/link';

interface SignupPromptProps {
  message?: string;
  className?: string;
}

/**
 * Prompt shown to anonymous users to encourage signup
 * Displayed after creating a trip without authentication
 */
export function SignupPrompt({
  message = 'Create an account to save your trip and collaborate with others.',
  className = '',
}: SignupPromptProps) {
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
          <p className="text-sm text-blue-800 dark:text-blue-200">{message}</p>
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
