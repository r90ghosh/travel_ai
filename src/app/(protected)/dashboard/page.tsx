import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'Dashboard | Travel AI',
  description: 'View and manage your trips.',
};

const DESTINATION_FLAGS: Record<string, string> = {
  iceland: '🇮🇸',
  japan: '🇯🇵',
  italy: '🇮🇹',
  peru: '🇵🇪',
};

const DESTINATION_NAMES: Record<string, string> = {
  iceland: 'Iceland',
  japan: 'Japan',
  italy: 'Italy',
  peru: 'Peru',
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: trips } = await supabase
    .from('trips')
    .select('*')
    .eq('created_by', user!.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="container max-w-4xl mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Your Trips
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Welcome back, {user!.email}
            </p>
          </div>
          <Button asChild>
            <Link href="/plan">Create New Trip</Link>
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="container max-w-4xl mx-auto px-4 py-8">
        {!trips || trips.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <svg
                className="h-12 w-12 text-slate-400 mx-auto mb-4"
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
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                You haven&apos;t created any trips yet.
              </p>
              <Button asChild>
                <Link href="/plan">Plan Your First Trip</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {trips.map((trip) => (
              <Link key={trip.id} href={`/trip/${trip.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        {DESTINATION_FLAGS[trip.destination_slug] || '🌍'}{' '}
                        {trip.title || `${DESTINATION_NAMES[trip.destination_slug] || trip.destination_slug} Adventure`}
                      </CardTitle>
                      <Badge variant={trip.status === 'active' ? 'default' : 'secondary'}>
                        {trip.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {new Date(trip.start_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      -{' '}
                      {new Date(trip.end_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      {' • '}
                      {trip.duration_days} days
                      {' • '}
                      {trip.traveler_count} {trip.traveler_count === 1 ? 'traveler' : 'travelers'}
                      {' • '}
                      {trip.pacing} pace
                    </p>
                    {trip.anchors && trip.anchors.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {trip.anchors.map((anchor: string) => (
                          <Badge key={anchor} variant="outline" className="text-xs">
                            {anchor.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-3">
                      Created {new Date(trip.created_at).toLocaleDateString()}
                      {trip.active_version > 0 && ` • Version ${trip.active_version}`}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
