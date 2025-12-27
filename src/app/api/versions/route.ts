import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cherryPickVersions } from '@/lib/itinerary/cherry-pick';
import type { ItineraryVersion } from '@/types';

/**
 * GET /api/versions
 * List all versions for a trip
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tripId = searchParams.get('trip_id');

  if (!tripId) {
    return NextResponse.json({ error: 'trip_id is required' }, { status: 400 });
  }

  const supabase = await createClient();

  // Verify trip exists and user has access
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id, created_by')
    .eq('id', tripId)
    .single();

  if (tripError || !trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  // Get all versions
  const { data: versions, error } = await supabase
    .from('itinerary_versions')
    .select('*')
    .eq('trip_id', tripId)
    .order('version', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: versions,
    error: null,
  });
}

/**
 * POST /api/versions
 * Create a new version (cherry-pick or restore)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tripId, action, daySelections, restoreFromVersion } = body;

    if (!tripId) {
      return NextResponse.json({ error: 'tripId is required' }, { status: 400 });
    }

    // Verify trip ownership
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

    let newVersion: ItineraryVersion;

    if (action === 'cherry_pick') {
      // Cherry-pick from multiple versions
      if (!daySelections || Object.keys(daySelections).length === 0) {
        return NextResponse.json({ error: 'daySelections is required for cherry-pick' }, { status: 400 });
      }

      newVersion = await cherryPickVersions(tripId, daySelections, user.id);
    } else if (action === 'restore') {
      // Restore from a previous version
      if (!restoreFromVersion) {
        return NextResponse.json({ error: 'restoreFromVersion is required' }, { status: 400 });
      }

      // Get the version to restore
      const { data: sourceVersion, error: sourceError } = await supabase
        .from('itinerary_versions')
        .select('*')
        .eq('trip_id', tripId)
        .eq('version', restoreFromVersion)
        .single();

      if (sourceError || !sourceVersion) {
        return NextResponse.json({ error: 'Source version not found' }, { status: 404 });
      }

      const nextVersion = trip.active_version + 1;

      // Create new version from old data
      const { data: savedVersion, error: saveError } = await supabase
        .from('itinerary_versions')
        .insert({
          trip_id: tripId,
          version: nextVersion,
          data: sourceVersion.data,
          source_type: 'cherry_pick', // Using cherry_pick as restore type
          parent_version: restoreFromVersion,
          modification_summary: 'Restored from Version ' + restoreFromVersion,
          created_by: user.id,
        })
        .select()
        .single();

      if (saveError) {
        return NextResponse.json({ error: 'Failed to save version' }, { status: 500 });
      }

      // Update trip active version
      await supabase
        .from('trips')
        .update({ active_version: nextVersion })
        .eq('id', tripId);

      newVersion = savedVersion;
    } else {
      return NextResponse.json({ error: 'Invalid action. Use "cherry_pick" or "restore"' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      version: newVersion,
    });
  } catch (error) {
    console.error('Version creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
