import { NextRequest, NextResponse } from 'next/server';
// import { createServerClient } from '@/lib/supabase/server';
import type { Trip, ApiResponse } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/trips/[id]
 * Get a specific trip with its current itinerary version
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const claimToken = request.headers.get('x-claim-token');

  // TODO: Fetch trip from Supabase
  // TODO: Check authorization (user owns trip, is collaborator, or has claim token)
  // TODO: Return trip with hydrated itinerary data

  return NextResponse.json<ApiResponse<Trip>>({
    data: null,
    error: 'Not implemented',
  }, { status: 501 });
}

/**
 * PATCH /api/trips/[id]
 * Update trip details (not itinerary)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await request.json();

    // TODO: Validate request body
    // TODO: Check authorization
    // TODO: Update trip in Supabase

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

/**
 * DELETE /api/trips/[id]
 * Delete a trip and all associated data
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  // TODO: Check authorization
  // TODO: Delete trip (cascade will handle related data)

  return NextResponse.json<ApiResponse<null>>({
    data: null,
    error: 'Not implemented',
  }, { status: 501 });
}
