import { NextRequest, NextResponse } from 'next/server';
import { classifyComment, type CommentIntent } from '@/lib/ai/classify-comment';
import { createClient } from '@/lib/supabase/server';

interface ClassifyRequest {
  comment: string;
  targetType: 'spot' | 'drive' | 'activity' | 'meal' | 'day' | 'trip';
  targetContext?: string;
  commentId?: string; // Optional: update existing comment with intent
}

/**
 * POST /api/comments/classify
 * Classify a comment's intent using Claude AI
 * Can be called before submitting to preview how the comment will be interpreted
 * If commentId is provided, updates the comment's intent in the database
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ClassifyRequest;

    if (!body.comment) {
      return NextResponse.json({
        data: null,
        error: 'comment is required',
      }, { status: 400 });
    }

    // Classify the comment using Claude
    const intent = await classifyComment({
      comment: body.comment,
      targetType: body.targetType || 'trip',
      targetContext: body.targetContext,
    });

    // If commentId provided, update the comment in the database
    if (body.commentId) {
      const supabase = await createClient();

      await supabase
        .from('comments')
        .update({ intent })
        .eq('id', body.commentId);
    }

    return NextResponse.json<{ data: CommentIntent; error: null }>({
      data: intent,
      error: null,
    });
  } catch (error) {
    console.error('Classification error:', error);
    return NextResponse.json({
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
