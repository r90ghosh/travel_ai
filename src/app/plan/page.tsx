import Link from 'next/link';
import { TripForm } from '@/components/forms/TripForm';
import { Mountain } from 'lucide-react';

export const metadata = {
  title: 'Plan Your Trip | Travel Planner',
  description: 'Create a personalized travel itinerary with AI-powered recommendations.',
};

export default function PlanPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Mountain className="h-6 w-6 text-emerald-600" />
            <span className="font-semibold text-slate-900 dark:text-white">
              Travel Planner
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <TripForm />
        </div>
      </main>
    </div>
  );
}
