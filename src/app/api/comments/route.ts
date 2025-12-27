import { NextRequest, NextResponse } from 'next/server';
// import { createServerClient } from '@/lib/supabase/server';
// import { classifyComment } from '@/lib/ai/classify-comment';
import type { Comment, ApiResponse } from '@/types';

/**
 * GET /api/comments
 * Get comments for a trip
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tripId = searchParams.get('trip_id');
  const version = searchParams.get('version');
  const status = searchParams.get('status');

  if (!tripId) {
    return NextResponse.json<ApiResponse<Comment[]>>({
      data: null,
      error: 'trip_id is required',
    }, { status: 400 });
  }

  // TODO: Check authorization
  // TODO: Fetch comments from Supabase with filters
  // TODO: Group into threads if requested

  return NextResponse.json<ApiResponse<Comment[]>>({
    data: [],
    error: null,
  });
}

/**
 * POST /api/comments
 * Create a new comment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Omit<Comment, 'id' | 'created_at' | 'updated_at' | 'intent'>;

    // TODO: Validate request body
    // TODO: Check authorization
    // TODO: Classify comment intent using AI
    // TODO: Detect conflicts with other pending comments
    // TODO: Store comment in Supabase

    return NextResponse.json<ApiResponse<Comment>>({
      data: null,
      error: 'Not implemented',
    }, { status: 501 });
  } catch (error) {
    return NextResponse.json<ApiResponse<Comment>>({
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
