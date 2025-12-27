import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/trips/claim
 * Claim an anonymous trip for the authenticated user
 * Called after signup/login to transfer trips created before authentication
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Must be logged in to claim trip' }, { status: 401 });
  }

  const { tripId, claimToken } = await request.json();

  if (!tripId || !claimToken) {
    return NextResponse.json({ error: 'Trip ID and claim token required' }, { status: 400 });
  }

  // Verify token matches and trip is unclaimed
  const { data: trip, error: fetchError } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .eq('claim_token', claimToken)
    .is('created_by', null)
    .single();

  if (fetchError || !trip) {
    return NextResponse.json({ error: 'Invalid claim token or trip already claimed' }, { status: 400 });
  }

  // Claim the trip
  const { error: updateError } = await supabase
    .from('trips')
    .update({
      created_by: user.id,
      // Keep claim_token for now (could clear it)
    })
    .eq('id', tripId);

  if (updateError) {
    return NextResponse.json({ error: 'Failed to claim trip' }, { status: 500 });
  }

  return NextResponse.json({ success: true, tripId });
}
