import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Comment, ApiResponse } from '@/types';

/**
 * GET /api/comments
 * Get comments for a trip, optionally filtered by version, status, or target
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tripId = searchParams.get('trip_id');
  const version = searchParams.get('version');
  const status = searchParams.get('status');
  const targetType = searchParams.get('target_type');
  const targetId = searchParams.get('target_id');

  if (!tripId) {
    return NextResponse.json<ApiResponse<Comment[]>>({
      data: null,
      error: 'trip_id is required',
    }, { status: 400 });
  }

  const supabase = await createClient();

  // Verify user has access to this trip
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id, created_by, share_token')
    .eq('id', tripId)
    .single();

  if (tripError || !trip) {
    return NextResponse.json<ApiResponse<Comment[]>>({
      data: null,
      error: 'Trip not found',
    }, { status: 404 });
  }

  // Build query
  let query = supabase
    .from('comments')
    .select(`
      *,
      user:users!user_id(email)
    `)
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });

  if (version) {
    query = query.eq('version', parseInt(version, 10));
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (targetType) {
    query = query.eq('target_type', targetType);
  }

  if (targetId) {
    query = query.eq('target_id', targetId);
  }

  const { data: comments, error } = await query;

  if (error) {
    return NextResponse.json<ApiResponse<Comment[]>>({
      data: null,
      error: error.message,
    }, { status: 500 });
  }

  // Add user email to comments
  const enrichedComments = comments?.map(comment => ({
    ...comment,
    user_email: (comment.user as { email?: string })?.email || null,
  })) || [];

  return NextResponse.json<ApiResponse<Comment[]>>({
    data: enrichedComments,
    error: null,
  });
}

/**
 * POST /api/comments
 * Create a new comment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trip_id, version, target_type, target_id, content, selected_text, parent_id } = body;

    if (!trip_id || !content) {
      return NextResponse.json<ApiResponse<Comment>>({
        data: null,
        error: 'trip_id and content are required',
      }, { status: 400 });
    }

    const supabase = await createClient();

    // Get user if authenticated
    const { data: { user } } = await supabase.auth.getUser();

    // Verify trip exists and user has access
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, created_by, claim_token')
      .eq('id', trip_id)
      .single();

    if (tripError || !trip) {
      return NextResponse.json<ApiResponse<Comment>>({
        data: null,
        error: 'Trip not found',
      }, { status: 404 });
    }

    // Create comment
    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        trip_id,
        version: version || 0,
        target_type: target_type || 'trip',
        target_id: target_id || trip_id,
        content,
        selected_text: selected_text || null,
        parent_id: parent_id || null,
        user_id: user?.id || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json<ApiResponse<Comment>>({
        data: null,
        error: error.message,
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<Comment>>({
      data: comment,
      error: null,
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<Comment>>({
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * DELETE /api/comments
 * Delete a comment (only by owner)
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const commentId = searchParams.get('id');

  if (!commentId) {
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: 'Comment ID is required',
    }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: 'Must be logged in to delete comments',
    }, { status: 401 });
  }

  // Verify ownership
  const { data: comment, error: fetchError } = await supabase
    .from('comments')
    .select('id, user_id')
    .eq('id', commentId)
    .single();

  if (fetchError || !comment) {
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: 'Comment not found',
    }, { status: 404 });
  }

  if (comment.user_id !== user.id) {
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: 'Not authorized to delete this comment',
    }, { status: 403 });
  }

  // Soft delete by updating status
  const { error } = await supabase
    .from('comments')
    .update({ status: 'deleted' })
    .eq('id', commentId);

  if (error) {
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: error.message,
    }, { status: 500 });
  }

  return NextResponse.json<ApiResponse<null>>({
    data: null,
    error: null,
  });
}

/**
 * PATCH /api/comments
 * Update a comment status (resolve, address)
 */
export async function PATCH(request: NextRequest) {
  try {
    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json<ApiResponse<Comment>>({
        data: null,
        error: 'Comment ID and status are required',
      }, { status: 400 });
    }

    const validStatuses = ['pending', 'addressed', 'resolved', 'deleted'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json<ApiResponse<Comment>>({
        data: null,
        error: 'Invalid status',
      }, { status: 400 });
    }

    const supabase = await createClient();

    // Update comment
    const { data: comment, error } = await supabase
      .from('comments')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json<ApiResponse<Comment>>({
        data: null,
        error: error.message,
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<Comment>>({
      data: comment,
      error: null,
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<Comment>>({
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
