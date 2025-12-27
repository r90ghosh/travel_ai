import { NextRequest, NextResponse } from 'next/server';
// import { createServerClient } from '@/lib/supabase/server';
// import { findCacheMatch } from '@/lib/itinerary/cache-matcher';
// import { generateItinerary } from '@/lib/itinerary/generator';
import type { GeneratedItinerary, TripFormData, ApiResponse } from '@/types';

interface GenerateRequest extends TripFormData {
  trip_id?: string; // If provided, this is for an existing trip
}

interface GenerateResponse {
  itinerary: GeneratedItinerary;
  source: 'cache' | 'differential' | 'full';
  cache_hit?: boolean;
}

/**
 * POST /api/itinerary/generate
 * Generate a new itinerary based on trip parameters
 * Uses cache-first strategy with differential generation
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateRequest;

    // TODO: Validate request body
    // TODO: Calculate season from dates
    // TODO: Try to find cache match
    // TODO: If exact match, return cached itinerary
    // TODO: If partial match, use differential generation
    // TODO: If no match, do full generation
    // TODO: Store new/updated cache entry

    return NextResponse.json<ApiResponse<GenerateResponse>>({
      data: null,
      error: 'Not implemented',
    }, { status: 501 });
  } catch (error) {
    return NextResponse.json<ApiResponse<GenerateResponse>>({
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
