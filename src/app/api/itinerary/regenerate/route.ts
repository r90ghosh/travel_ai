import { NextRequest, NextResponse } from 'next/server';
// import { createServerClient } from '@/lib/supabase/server';
// import { mergeComments } from '@/lib/itinerary/merger';
import type { ItineraryVersion, ApiResponse } from '@/types';

interface RegenerateRequest {
  trip_id: string;
  comment_ids: string[]; // Comments to address in this regeneration
  mode: 'all' | 'selected'; // Apply all pending comments or just selected ones
}

/**
 * POST /api/itinerary/regenerate
 * Regenerate itinerary based on pending comments
 * Creates a new version that addresses the specified comments
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RegenerateRequest;

    // TODO: Validate request body
    // TODO: Check authorization
    // TODO: Fetch current itinerary version
    // TODO: Fetch and classify comments
    // TODO: Detect conflicts between comments
    // TODO: Call merger to generate new version
    // TODO: Store new itinerary version
    // TODO: Mark comments as addressed

    return NextResponse.json<ApiResponse<ItineraryVersion>>({
      data: null,
      error: 'Not implemented',
    }, { status: 501 });
  } catch (error) {
    return NextResponse.json<ApiResponse<ItineraryVersion>>({
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
