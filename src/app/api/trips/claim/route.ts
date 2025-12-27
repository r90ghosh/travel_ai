import { NextRequest, NextResponse } from 'next/server';
// import { createServerClient } from '@/lib/supabase/server';
import type { Trip, ApiResponse } from '@/types';

/**
 * POST /api/trips/claim
 * Claim anonymous trips for the authenticated user
 * Called after signup/login to transfer trips created before authentication
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { tokens: string[] };

    if (!body.tokens || !Array.isArray(body.tokens) || body.tokens.length === 0) {
      return NextResponse.json<ApiResponse<Trip[]>>({
        data: null,
        error: 'No tokens provided',
      }, { status: 400 });
    }

    // TODO: Get authenticated user
    // TODO: Call claim_trips_for_user RPC function
    // TODO: Return claimed trips

    return NextResponse.json<ApiResponse<Trip[]>>({
      data: null,
      error: 'Not implemented',
    }, { status: 501 });
  } catch (error) {
    return NextResponse.json<ApiResponse<Trip[]>>({
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
