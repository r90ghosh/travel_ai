import { createClient } from '@/lib/supabase/server';
import { generateClaimToken } from '@/lib/trip-token';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const createTripSchema = z.object({
  destination_slug: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  travelers: z.enum(['solo', 'couple', 'friends', 'family', 'multi_gen']),
  traveler_count: z.number().min(1).max(20),
  pacing: z.enum(['relaxed', 'balanced', 'packed']),
  anchors: z.array(z.string()).min(1).max(3),
  budget_tier: z.enum(['budget', 'moderate', 'comfort', 'luxury']),
});

/**
 * POST /api/trips
 * Create a new trip (works for both authenticated and anonymous users)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check if user is logged in (optional)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const validated = createTripSchema.parse(body);

    // Generate claim token for anonymous users
    const claimToken = user ? null : generateClaimToken();

    const { data: trip, error } = await supabase
      .from('trips')
      .insert({
        ...validated,
        created_by: user?.id || null,
        claim_token: claimToken,
        status: 'active',
        regenerations_used: 0,
        active_version: 0, // No version yet
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      trip,
      claim_token: claimToken, // Return so client can store it
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/trips
 * List user's trips (requires auth)
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: trips, error } = await supabase
    .from('trips')
    .select('*')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ trips });
}
