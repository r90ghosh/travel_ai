import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { detectConflicts } from '@/lib/comments/conflict-detector';
import { regenerateItinerary } from '@/lib/itinerary/regenerator';

const MAX_FREE_REGENERATIONS = 3;

/**
 * POST /api/itinerary/regenerate
 * Regenerate itinerary based on pending comments
 * Creates a new version that addresses the specified comments
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tripId } = await request.json();

    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID required' }, { status: 400 });
    }

    // Get trip and verify ownership
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    if (trip.created_by !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check regeneration limit for free users
    const regenerationsUsed = trip.regenerations_used || 0;
    if (regenerationsUsed >= MAX_FREE_REGENERATIONS) {
      return NextResponse.json(
        {
          error: 'Regeneration limit reached',
          upgrade: true,
          message: 'You have used all 3 free regenerations. Upgrade to continue refining your itinerary.'
        },
        { status: 403 }
      );
    }

    // Check for conflicts
    const conflicts = await detectConflicts(tripId);
    if (conflicts.length > 0) {
      return NextResponse.json(
        {
          error: 'Conflicts must be resolved first',
          conflicts,
          message: 'Please resolve conflicting feedback before regenerating.'
        },
        { status: 400 }
      );
    }

    // Check for pending comments
    const { data: pendingComments } = await supabase
      .from('comments')
      .select('id')
      .eq('trip_id', tripId)
      .eq('status', 'pending');

    if (!pendingComments || pendingComments.length === 0) {
      return NextResponse.json(
        { error: 'No pending comments to apply' },
        { status: 400 }
      );
    }

    // Perform regeneration
    const result = await regenerateItinerary(tripId, user.id);

    return NextResponse.json({
      success: true,
      itinerary: result.itinerary,
      version: result.version,
      changesMade: result.changesMade,
      regenerationsRemaining: MAX_FREE_REGENERATIONS - (regenerationsUsed + 1),
    });
  } catch (error) {
    console.error('Regeneration error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
