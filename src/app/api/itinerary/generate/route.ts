import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateItinerary } from '@/lib/itinerary/generator';

export async function POST(request: Request) {
  console.log('[API /api/itinerary/generate] POST request received');

  try {
    const { tripId, claimToken } = await request.json();
    console.log('[API /api/itinerary/generate] tripId:', tripId, 'claimToken:', claimToken ? 'present' : 'missing');

    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();

    if (tripError || !trip) {
      console.error('[API /api/itinerary/generate] Trip not found:', tripError);
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    console.log('[API /api/itinerary/generate] Trip found:', trip.id, 'active_version:', trip.active_version);

    // Check access
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Server-side access check
    const hasAccess =
      (user && trip.created_by === user.id) || // Owner
      (claimToken && trip.claim_token === claimToken); // Valid claim token

    console.log('[API /api/itinerary/generate] Access check:', {
      userId: user?.id,
      tripCreatedBy: trip.created_by,
      claimTokenMatch: claimToken === trip.claim_token,
      hasAccess
    });

    if (!hasAccess) {
      console.error('[API /api/itinerary/generate] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if already has an active version
    if (trip.active_version > 0) {
      // Return existing itinerary
      const { data: version } = await supabase
        .from('itinerary_versions')
        .select('*')
        .eq('trip_id', tripId)
        .eq('version', trip.active_version)
        .single();

      if (version) {
        return NextResponse.json({
          itinerary: version.data,
          version,
          source: 'existing',
        });
      }
    }

    // Generate new itinerary (pass claim token for anonymous trips)
    console.log('[API /api/itinerary/generate] Starting generation...');
    const result = await generateItinerary(tripId, claimToken || undefined);
    console.log('[API /api/itinerary/generate] Generation complete, source:', result.source);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API /api/itinerary/generate] Generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}
