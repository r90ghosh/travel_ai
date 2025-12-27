import { NextRequest, NextResponse } from 'next/server';
// import { classifyComment } from '@/lib/ai/classify-comment';
import type { CommentIntent, ApiResponse } from '@/types';

interface ClassifyRequest {
  content: string;
  target_type: string;
  target_id?: string;
  selected_text?: string;
  itinerary_context?: {
    day_number: number;
    current_items: string[];
  };
}

/**
 * POST /api/comments/classify
 * Classify a comment's intent using AI
 * Can be called before submitting to preview how the comment will be interpreted
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ClassifyRequest;

    if (!body.content) {
      return NextResponse.json<ApiResponse<CommentIntent>>({
        data: null,
        error: 'content is required',
      }, { status: 400 });
    }

    // TODO: Call AI to classify the comment
    // TODO: Return intent with confidence and details

    // Mock response for development
    const mockIntent: CommentIntent = {
      action: 'unclear',
      confidence: 'low',
      details: 'Classification not yet implemented',
      affects_routing: false,
      estimated_time_impact_minutes: null,
      suggested_resolution: null,
    };

    return NextResponse.json<ApiResponse<CommentIntent>>({
      data: mockIntent,
      error: null,
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<CommentIntent>>({
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
