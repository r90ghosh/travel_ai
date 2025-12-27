import { TripForm } from '@/components/forms/TripForm';

export const metadata = {
  title: 'Plan Your Trip | Travel AI',
  description: 'Create a personalized Iceland itinerary with AI-powered recommendations.',
};

export default function PlanPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Plan Your Trip
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Tell us about your trip and we&apos;ll create a personalized itinerary.
          </p>

          <div className="mt-8">
            <TripForm />
          </div>
        </div>
      </div>
    </div>
  );
}
