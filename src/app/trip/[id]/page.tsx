'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { canAccessTrip, getTokenForTrip, storeClaimToken } from '@/lib/trip-token';
import type { Trip, GeneratedItinerary } from '@/types';
import { DaySelector } from '@/components/itinerary/DaySelector';
import { DayView } from '@/components/itinerary/DayView';
import { TripHeader } from '@/components/itinerary/TripHeader';
import { TripMap } from '@/components/itinerary/TripMap';
import { SignupPrompt } from '@/components/auth/SignupPrompt';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TripPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const tripId = params.id as string;
  const urlToken = searchParams.get('token');

  const [trip, setTrip] = useState<Trip | null>(null);
  const [itinerary, setItinerary] = useState<GeneratedItinerary | null>(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [showSignupPrompt, setShowSignupPrompt] = useState<'comment' | 'share' | 'regenerate' | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadTrip();
    checkUser();

    // Store token from URL if present
    if (urlToken) {
      storeClaimToken(tripId, urlToken);
    }
  }, [tripId, urlToken]);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  }

  async function loadTrip() {
    console.log('[TripPage] loadTrip started for tripId:', tripId);
    setLoading(true);
    setError(null);

    try {
      // Get trip
      console.log('[TripPage] Fetching trip data...');
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

      console.log('[TripPage] Trip fetch result:', { tripData, tripError });

      if (tripError || !tripData) {
        console.error('[TripPage] Trip not found:', tripError);
        setError('Trip not found');
        setLoading(false);
        return;
      }

      // Check access
      const { data: { user } } = await supabase.auth.getUser();
      const storedToken = getTokenForTrip(tripId);
      console.log('[TripPage] Access check:', {
        userId: user?.id,
        storedToken,
        urlToken,
        tripCreatedBy: tripData.created_by,
        tripClaimToken: tripData.claim_token
      });

      if (!canAccessTrip(tripData, user?.id || null, urlToken || storedToken)) {
        console.error('[TripPage] Access denied');
        setError('You do not have access to this trip');
        setLoading(false);
        return;
      }

      console.log('[TripPage] Access granted, setting trip data');
      setTrip(tripData as Trip);

      // Load or generate itinerary
      if (tripData.active_version > 0) {
        console.log('[TripPage] Loading existing itinerary version:', tripData.active_version);
        await loadItinerary(tripData.active_version);
      } else {
        console.log('[TripPage] No active version, triggering generation');
        await generateItinerary();
      }

    } catch (err) {
      console.error('[TripPage] Error loading trip:', err);
      setError('Failed to load trip');
    }

    console.log('[TripPage] loadTrip completed');
    setLoading(false);
  }

  async function loadItinerary(version: number) {
    const { data: versionData } = await supabase
      .from('itinerary_versions')
      .select('*')
      .eq('trip_id', tripId)
      .eq('version', version)
      .single();

    if (versionData) {
      setItinerary(versionData.data as GeneratedItinerary);
    }
  }

  async function generateItinerary() {
    console.log('[TripPage] generateItinerary started');
    setGenerating(true);

    try {
      const token = urlToken || getTokenForTrip(tripId);
      console.log('[TripPage] Calling generate API with token:', token ? 'present' : 'missing');

      const response = await fetch('/api/itinerary/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId, claimToken: token }),
      });

      console.log('[TripPage] Generate API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[TripPage] Generation failed:', errorData);
        throw new Error(errorData.error || 'Generation failed');
      }

      const result = await response.json();
      console.log('[TripPage] Generation successful, source:', result.source);
      setItinerary(result.itinerary);

      // Reload trip to get updated active_version
      const { data: updatedTrip } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();
      if (updatedTrip) setTrip(updatedTrip as Trip);

    } catch (err) {
      console.error('[TripPage] Generate error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate itinerary');
    }

    setGenerating(false);
  }

  // Check if user can perform action (logged in and is owner/collaborator)
  function requireAuth(action: 'comment' | 'share' | 'regenerate'): boolean {
    if (!user) {
      setShowSignupPrompt(action);
      return false;
    }
    // TODO: Check if user is owner or collaborator
    return true;
  }

  if (loading) {
    return <TripPageSkeleton />;
  }

  if (error) {
    return (
      <div className="container max-w-4xl py-12">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (generating) {
    return <GeneratingState trip={trip!} />;
  }

  if (!trip || !itinerary) {
    return null;
  }

  const isOwner = user?.id === trip.created_by || getTokenForTrip(tripId) === trip.claim_token;
  const selectedDayData = itinerary.days.find(d => d.day_number === selectedDay);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      {/* Banner for anonymous users */}
      {!user && isOwner && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 py-3 px-4 text-center text-sm shadow-lg">
          <span className="text-white font-medium">
            This trip isn&apos;t saved to an account yet.{' '}
            <button
              onClick={() => setShowSignupPrompt('share')}
              className="underline hover:no-underline font-semibold"
            >
              Sign up to save it
            </button>
          </span>
        </div>
      )}

      <TripHeader
        trip={trip}
        itinerary={itinerary}
        onShare={() => requireAuth('share')}
        onRegenerate={() => requireAuth('regenerate')}
      />

      <div className="max-w-6xl mx-auto px-6 py-8">
        <Tabs defaultValue="itinerary" className="w-full">
          <TabsList className="inline-flex h-12 items-center justify-center rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-1.5 text-slate-600 dark:text-slate-400 shadow-sm border border-slate-200/50 dark:border-slate-700/50 mb-8">
            <TabsTrigger
              value="itinerary"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-6 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              Itinerary
            </TabsTrigger>
            <TabsTrigger
              value="map"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-6 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              Map
            </TabsTrigger>
            <TabsTrigger
              value="prepare"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-6 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              Prepare
            </TabsTrigger>
            <TabsTrigger
              value="budget"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-6 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              Budget
            </TabsTrigger>
          </TabsList>

          <TabsContent value="itinerary" className="mt-0">
            {/* Horizontal day selector */}
            <div className="mb-8">
              <DaySelector
                days={itinerary.days}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
                variant="horizontal"
              />
            </div>

            {/* Day content - centered */}
            <div className="max-w-4xl mx-auto">
              {selectedDayData && (
                <DayView
                  day={selectedDayData}
                  onComment={() => requireAuth('comment')}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="map" className="mt-0">
            <div className="h-[700px] rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700">
              <TripMap
                itinerary={itinerary}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
              />
            </div>
          </TabsContent>

          <TabsContent value="prepare" className="mt-0">
            <div className="max-w-4xl mx-auto">
              <PrepareTab itinerary={itinerary} />
            </div>
          </TabsContent>

          <TabsContent value="budget" className="mt-0">
            <div className="max-w-4xl mx-auto">
              <BudgetTab itinerary={itinerary} trip={trip} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Signup prompt modal */}
      {showSignupPrompt && (
        <SignupPrompt
          trigger={showSignupPrompt}
          tripId={tripId}
          onClose={() => setShowSignupPrompt(null)}
          onSuccess={() => {
            setShowSignupPrompt(null);
            checkUser();
            loadTrip();
          }}
        />
      )}
    </div>
  );
}

// Loading skeleton
function TripPageSkeleton() {
  return (
    <div className="container max-w-2xl py-24 text-center">
      <div className="mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto flex items-center justify-center">
          <span className="h-8 w-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      </div>
      <h1 className="text-xl font-semibold mb-2 text-gray-700">Loading Trip...</h1>
      <p className="text-gray-500">Fetching your trip details</p>
    </div>
  );
}

// Generation in progress state
function GeneratingState({ trip }: { trip: Trip }) {
  return (
    <div className="container max-w-2xl py-24 text-center">
      <div className="animate-pulse mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto flex items-center justify-center">
          <span className="text-2xl">&#10024;</span>
        </div>
      </div>
      <h1 className="text-2xl font-semibold mb-2">Generating Your Itinerary</h1>
      <p className="text-gray-600 mb-8">
        Creating a personalized {trip.duration_days}-day adventure...
      </p>
      <div className="space-y-2 text-sm text-gray-500">
        <p>&#10003; Analyzing your preferences</p>
        <p>&#10003; Finding the best routes</p>
        <p className="animate-pulse">&rarr; Building your day-by-day plan...</p>
      </div>
    </div>
  );
}

// Placeholder components - implement these next
function PrepareTab({ itinerary }: { itinerary: GeneratedItinerary }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-4">Prepare for Your Trip</h2>
      <p className="text-gray-600">Packing list and practical info coming soon</p>

      {itinerary.warnings.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium mb-2">Important Notes</h3>
          <ul className="space-y-2">
            {itinerary.warnings.map((warning, idx) => (
              <li key={idx} className="text-sm text-amber-700 bg-amber-50 p-2 rounded">
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {itinerary.booking_reminders.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium mb-2">Booking Reminders</h3>
          <ul className="space-y-2">
            {itinerary.booking_reminders.map((reminder, idx) => (
              <li key={idx} className="text-sm text-blue-700 bg-blue-50 p-2 rounded">
                {reminder.message} ({reminder.days_ahead} days ahead)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function BudgetTab({ itinerary, trip }: { itinerary: GeneratedItinerary; trip: Trip }) {
  const { estimated_cost } = itinerary.summary;
  const variance = estimated_cost.variance_percent ?? 0;

  // Determine variance color and message
  const getVarianceStyle = (v: number) => {
    if (v <= 0) return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: '✓' };
    if (v <= 15) return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: '!' };
    return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: '⚠' };
  };

  const varianceStyle = getVarianceStyle(variance);
  const varianceText = variance <= 0
    ? `${Math.abs(variance)}% under budget`
    : `${variance}% over budget`;

  return (
    <div className="space-y-6">
      {/* Variance Banner */}
      <div className={`rounded-xl p-4 ${varianceStyle.bg} border ${varianceStyle.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`text-2xl`}>{varianceStyle.icon}</span>
            <div>
              <p className={`font-semibold ${varianceStyle.color}`}>
                {variance <= 0 ? 'Within Budget' : variance <= 15 ? 'Slightly Over Budget' : 'Over Budget'}
              </p>
              <p className={`text-sm ${varianceStyle.color} opacity-80`}>
                {varianceText}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Expected range</p>
            <p className="font-medium text-slate-700">
              ${estimated_cost.expected_low?.toLocaleString()} - ${estimated_cost.expected_high?.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Total Estimate */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Estimated Total</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50">
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              ${estimated_cost.low.toLocaleString()}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Low estimate</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800/50">
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              ${estimated_cost.high.toLocaleString()}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">High estimate</div>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Total for {trip.traveler_count} {trip.traveler_count === 1 ? 'person' : 'people'} over {trip.duration_days} days.
          Based on <span className="capitalize font-medium">{trip.budget_tier}</span> tier.
        </p>
      </div>

      {/* Breakdown */}
      {estimated_cost.breakdown && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Cost Breakdown</h2>
          <div className="space-y-4">
            <BreakdownRow
              label="Accommodation"
              low={estimated_cost.breakdown.accommodation.low}
              high={estimated_cost.breakdown.accommodation.high}
              icon="🏨"
              color="bg-indigo-500"
            />
            <BreakdownRow
              label="Meals"
              low={estimated_cost.breakdown.meals.low}
              high={estimated_cost.breakdown.meals.high}
              icon="🍽️"
              color="bg-orange-500"
            />
            <BreakdownRow
              label="Activities"
              low={estimated_cost.breakdown.activities.low}
              high={estimated_cost.breakdown.activities.high}
              icon="🎯"
              color="bg-emerald-500"
            />
            <BreakdownRow
              label="Transport"
              low={estimated_cost.breakdown.transport.low}
              high={estimated_cost.breakdown.transport.high}
              icon="🚗"
              color="bg-blue-500"
            />
          </div>
        </div>
      )}

      {/* Per Person Note */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          <span className="font-medium">Note:</span> Estimates include accommodation, meals, activities, car rental, and fuel.
          Actual costs may vary based on specific choices and seasonal pricing.
        </p>
      </div>
    </div>
  );
}

function BreakdownRow({ label, low, high, icon, color }: {
  label: string;
  low: number;
  high: number;
  icon: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3 flex-1">
        <span className="text-xl">{icon}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              ${low.toLocaleString()} - ${high.toLocaleString()}
            </span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${color} rounded-full`}
              style={{ width: `${Math.min((high / 2000) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
