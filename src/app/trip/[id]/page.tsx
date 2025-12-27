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
    setLoading(true);
    setError(null);

    try {
      // Get trip
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

      if (tripError || !tripData) {
        setError('Trip not found');
        setLoading(false);
        return;
      }

      // Check access
      const { data: { user } } = await supabase.auth.getUser();
      const storedToken = getTokenForTrip(tripId);

      if (!canAccessTrip(tripData, user?.id || null, urlToken || storedToken)) {
        setError('You do not have access to this trip');
        setLoading(false);
        return;
      }

      setTrip(tripData as Trip);

      // Load or generate itinerary
      if (tripData.active_version > 0) {
        await loadItinerary(tripData.active_version);
      } else {
        await generateItinerary();
      }

    } catch {
      setError('Failed to load trip');
    }

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
    setGenerating(true);

    try {
      const token = urlToken || getTokenForTrip(tripId);
      const response = await fetch('/api/itinerary/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId, claimToken: token }),
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const result = await response.json();
      setItinerary(result.itinerary);

      // Reload trip to get updated active_version
      const { data: updatedTrip } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();
      if (updatedTrip) setTrip(updatedTrip as Trip);

    } catch {
      setError('Failed to generate itinerary');
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
    <div className="min-h-screen bg-gray-50">
      {/* Banner for anonymous users */}
      {!user && isOwner && (
        <div className="bg-blue-50 border-b border-blue-100 py-2 px-4 text-center text-sm">
          <span className="text-blue-800">
            This trip isn&apos;t saved to an account yet.{' '}
            <button
              onClick={() => setShowSignupPrompt('share')}
              className="font-medium underline hover:no-underline"
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

      <div className="container max-w-7xl py-6">
        <Tabs defaultValue="itinerary">
          <TabsList>
            <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
            <TabsTrigger value="map">Map</TabsTrigger>
            <TabsTrigger value="prepare">Prepare</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
          </TabsList>

          <TabsContent value="itinerary" className="mt-6">
            <div className="flex gap-6">
              {/* Day selector sidebar */}
              <div className="w-48 shrink-0">
                <DaySelector
                  days={itinerary.days}
                  selectedDay={selectedDay}
                  onSelectDay={setSelectedDay}
                />
              </div>

              {/* Day content */}
              <div className="flex-1">
                {selectedDayData && (
                  <DayView
                    day={selectedDayData}
                    onComment={() => requireAuth('comment')}
                  />
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="map" className="mt-6">
            <div className="h-[600px]">
              <TripMap
                itinerary={itinerary}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
              />
            </div>
          </TabsContent>

          <TabsContent value="prepare" className="mt-6">
            <PrepareTab itinerary={itinerary} />
          </TabsContent>

          <TabsContent value="budget" className="mt-6">
            <BudgetTab itinerary={itinerary} trip={trip} />
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
    <div className="container max-w-7xl py-12">
      <Skeleton className="h-32 w-full mb-6" />
      <div className="flex gap-6">
        <Skeleton className="h-96 w-48" />
        <Skeleton className="h-96 flex-1" />
      </div>
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-4">Budget Breakdown</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">
            ${estimated_cost.low.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">Low estimate</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">
            ${estimated_cost.high.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">High estimate</div>
        </div>
      </div>

      <p className="text-sm text-gray-600">
        Estimates for {trip.traveler_count} {trip.traveler_count === 1 ? 'person' : 'people'} over {trip.duration_days} days.
        Based on {trip.budget_tier} tier accommodations and activities.
      </p>

      <p className="text-gray-500 text-sm mt-4">
        Detailed budget breakdown coming soon
      </p>
    </div>
  );
}
