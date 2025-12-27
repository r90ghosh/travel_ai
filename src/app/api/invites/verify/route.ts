import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/invites/verify
 * Verify an invite token and return invite details
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const tripId = searchParams.get('trip');

  if (!token || !tripId) {
    return NextResponse.json({ error: 'Missing token or trip ID' }, { status: 400 });
  }

  const supabase = await createClient();

  // Find the collaborator invite
  const { data: collaborator, error } = await supabase
    .from('collaborators')
    .select(`
      id,
      email,
      role,
      status,
      trip:trips!trip_id(
        id,
        title,
        created_by
      )
    `)
    .eq('trip_id', tripId)
    .eq('invite_token', token)
    .eq('status', 'pending')
    .single();

  if (error || !collaborator) {
    return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 });
  }

  // Get inviter name - trip comes as array from join
  const tripData = collaborator.trip as unknown as { id: string; title: string; created_by: string } | null;

  if (!tripData) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  const { data: inviter } = await supabase
    .from('users')
    .select('email')
    .eq('id', tripData.created_by)
    .single();

  return NextResponse.json({
    tripId: tripData.id,
    tripTitle: tripData.title || 'Untitled Trip',
    inviterName: inviter?.email || 'Someone',
    role: collaborator.role,
    email: collaborator.email,
  });
}
