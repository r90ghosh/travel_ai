import Link from 'next/link';

export const metadata = {
  title: 'Dashboard | Travel AI',
  description: 'View and manage your trips.',
};

export default function DashboardPage() {
  // TODO: Fetch user's trips from Supabase
  // TODO: Add authentication check (middleware or server-side)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            My Trips
          </h1>
          <Link
            href="/plan"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + New Trip
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {/* Empty state */}
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white p-12 dark:border-slate-600 dark:bg-slate-800">
          <svg
            className="h-12 w-12 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 6h6M9 10h6m-6 4h6m2 5H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V17a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">
            No trips yet
          </h3>
          <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
            Get started by creating your first trip.
          </p>
          <Link
            href="/plan"
            className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create your first trip
          </Link>
        </div>

        {/* Trip cards grid (shown when user has trips) */}
        {/* TODO: Map over trips and render TripCard components */}
        {/*
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
        */}
      </main>
    </div>
  );
}
