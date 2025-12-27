import { NextRequest, NextResponse } from 'next/server';
// import { createServerClient } from '@/lib/supabase/server';
import type { Trip, TripFormData, ApiResponse } from '@/types';

/**
 * GET /api/trips
 * List trips for authenticated user or by claim tokens
 */
export async function GET(request: NextRequest) {
  // const supabase = createServerClient();

  // TODO: Get user session
  // TODO: If authenticated, get user's trips
  // TODO: If not authenticated, check for claim tokens in request

  return NextResponse.json<ApiResponse<Trip[]>>({
    data: [],
    error: null,
  });
}

/**
 * POST /api/trips
 * Create a new trip (works for both authenticated and anonymous users)
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TripFormData & { claim_token?: string };

    // TODO: Validate request body
    // TODO: If authenticated, set created_by to user id
    // TODO: If anonymous, ensure claim_token is provided
    // TODO: Generate itinerary
    // TODO: Create trip and first itinerary version in Supabase

    return NextResponse.json<ApiResponse<Trip>>({
      data: null,
      error: 'Not implemented',
    }, { status: 501 });
  } catch (error) {
    return NextResponse.json<ApiResponse<Trip>>({
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
