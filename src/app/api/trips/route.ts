import { createClient, createClientWithClaimToken } from '@/lib/supabase/server';
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
  console.log('[API /api/trips] POST request received');

  try {
    const supabase = await createClient();

    // Check if user is logged in (optional)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log('[API /api/trips] User:', user ? user.id : 'anonymous');

    const body = await request.json();
    console.log('[API /api/trips] Request body:', body);

    const validated = createTripSchema.parse(body);
    console.log('[API /api/trips] Validated data:', validated);

    // Generate claim token for anonymous users
    const claimToken = user ? null : generateClaimToken();
    console.log('[API /api/trips] Claim token:', claimToken ? 'generated' : 'null (authenticated user)');

    // For anonymous users, use a client with the claim token header
    // so the SELECT after INSERT works with RLS
    const insertClient = claimToken
      ? await createClientWithClaimToken(claimToken)
      : supabase;

    const insertData = {
      ...validated,
      created_by: user?.id || null,
      claim_token: claimToken,
      status: 'active',
      regenerations_used: 0,
      active_version: 0, // No version yet
    };
    console.log('[API /api/trips] Inserting:', insertData);

    const { data: trip, error } = await insertClient
      .from('trips')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[API /api/trips] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[API /api/trips] Trip created successfully:', trip?.id);
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
