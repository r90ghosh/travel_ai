import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/invites/accept
 * Accept an invite and link the user to the collaborator record
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Must be logged in to accept invite' }, { status: 401 });
  }

  const { token, tripId } = await request.json();

  if (!token || !tripId) {
    return NextResponse.json({ error: 'Missing token or trip ID' }, { status: 400 });
  }

  // Find and validate the invite
  const { data: collaborator, error: fetchError } = await supabase
    .from('collaborators')
    .select('id, email, status')
    .eq('trip_id', tripId)
    .eq('invite_token', token)
    .eq('status', 'pending')
    .single();

  if (fetchError || !collaborator) {
    return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 });
  }

  // Update the collaborator record
  const { error: updateError } = await supabase
    .from('collaborators')
    .update({
      user_id: user.id,
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    })
    .eq('id', collaborator.id);

  if (updateError) {
    return NextResponse.json({ error: 'Failed to accept invite' }, { status: 500 });
  }

  return NextResponse.json({ success: true, tripId });
}
