import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateItinerary } from '@/lib/itinerary/generator';

export async function POST(request: Request) {
  try {
    const { tripId, claimToken } = await request.json();

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
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Check access
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Server-side access check
    const hasAccess =
      (user && trip.created_by === user.id) || // Owner
      (claimToken && trip.claim_token === claimToken); // Valid claim token

    if (!hasAccess) {
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

    // Generate new itinerary
    const result = await generateItinerary(tripId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}
