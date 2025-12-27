import { notFound } from 'next/navigation';

interface TripPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

export async function generateMetadata({ params }: TripPageProps) {
  const { id } = await params;
  // TODO: Fetch trip title for metadata
  return {
    title: `Trip ${id} | Travel AI`,
    description: 'View your personalized Iceland itinerary.',
  };
}

export default async function TripPage({ params, searchParams }: TripPageProps) {
  const { id } = await params;
  const { token } = await searchParams;

  // TODO: Fetch trip data from Supabase
  // If no user session and no valid token, show signup prompt
  // If trip not found, show 404

  if (!id) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Your Iceland Adventure
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Trip ID: {id}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* TODO: Add version switcher, share button, etc */}
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Itinerary timeline */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Itinerary
              </h2>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Loading itinerary...
              </p>
              {/* TODO: Render DayView components */}
            </div>
          </div>

          {/* Map sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Route Map
              </h2>
              <div className="mt-4 aspect-square rounded-lg bg-slate-100 dark:bg-slate-700">
                {/* TODO: Render TripMap component */}
                <p className="flex h-full items-center justify-center text-sm text-slate-500">
                  Map loading...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signup prompt for anonymous users */}
      {token && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="container mx-auto flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Create an account to save your trip and collaborate with others.
            </p>
            <a
              href="/signup"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Sign up free
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
