import Anthropic from '@anthropic-ai/sdk';

export type CommentIntentType =
  | 'remove'
  | 'add'
  | 'extend'
  | 'shorten'
  | 'swap'
  | 'move'
  | 'question'
  | 'preference'
  | 'unclear';

export interface CommentIntent {
  intent: CommentIntentType;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  affects_routing?: boolean;
  estimated_time_impact_minutes?: number | null;
  suggested_entity?: string;
}

interface ClassifyOptions {
  comment: string;
  targetType: 'spot' | 'drive' | 'activity' | 'meal' | 'day' | 'trip';
  targetContext?: string;
}

const anthropic = new Anthropic();

/**
 * Classifies a comment's intent using Claude AI
 * Falls back to heuristics if API call fails
 */
export async function classifyComment(options: ClassifyOptions): Promise<CommentIntent> {
  const { comment, targetType, targetContext } = options;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `Classify this travel itinerary feedback comment.

Target: ${targetType}${targetContext ? ` - ${targetContext}` : ''}
Comment: "${comment}"

Classify the intent as one of:
- remove: User wants to remove/skip this item
- add: User wants to add something new
- extend: User wants more time here
- shorten: User wants less time here
- swap: User wants to replace with something else
- move: User wants to change when this happens
- question: User is asking a question
- preference: User is expressing a like/dislike
- unclear: Cannot determine intent

Respond with JSON only:
{
  "intent": "...",
  "confidence": "high|medium|low",
  "reasoning": "brief explanation",
  "affects_routing": true/false,
  "estimated_time_impact_minutes": number or null,
  "suggested_entity": "mentioned place/activity or null"
}`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      // Extract JSON from response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          intent: parsed.intent || 'unclear',
          confidence: parsed.confidence || 'low',
          reasoning: parsed.reasoning || '',
          affects_routing: parsed.affects_routing ?? false,
          estimated_time_impact_minutes: parsed.estimated_time_impact_minutes ?? null,
          suggested_entity: parsed.suggested_entity ?? undefined,
        };
      }
    }

    // Fall back to heuristics if parsing fails
    return classifyWithHeuristics(options);
  } catch (error) {
    console.error('Claude classification failed, using heuristics:', error);
    return classifyWithHeuristics(options);
  }
}

/**
 * Fallback heuristic classification when AI is not available
 */
function classifyWithHeuristics(options: ClassifyOptions): CommentIntent {
  const content = options.comment.toLowerCase();

  let intent: CommentIntentType = 'unclear';
  let confidence: 'high' | 'medium' | 'low' = 'low';
  let affectsRouting = false;
  let timeImpact: number | null = null;

  // Remove patterns
  if (
    content.includes('remove') ||
    content.includes('skip') ||
    content.includes("don't want") ||
    content.includes('take out') ||
    content.includes('delete')
  ) {
    intent = 'remove';
    confidence = 'high';
    affectsRouting = true;
    timeImpact = -60;
  }
  // Add patterns
  else if (
    content.includes('add') ||
    content.includes('include') ||
    content.includes('want to see') ||
    content.includes('can we go to')
  ) {
    intent = 'add';
    confidence = 'medium';
    affectsRouting = true;
    timeImpact = 60;
  }
  // Extend patterns
  else if (
    content.includes('more time') ||
    content.includes('longer') ||
    content.includes('extend') ||
    content.includes('stay longer')
  ) {
    intent = 'extend';
    confidence = 'high';
    affectsRouting = false;
    timeImpact = 30;
  }
  // Shorten patterns
  else if (
    content.includes('less time') ||
    content.includes('shorter') ||
    content.includes('quick stop') ||
    content.includes("don't need that long")
  ) {
    intent = 'shorten';
    confidence = 'high';
    affectsRouting = false;
    timeImpact = -30;
  }
  // Swap patterns
  else if (
    content.includes('instead') ||
    content.includes('rather') ||
    content.includes('swap') ||
    content.includes('replace')
  ) {
    intent = 'swap';
    confidence = 'medium';
    affectsRouting = true;
    timeImpact = 0;
  }
  // Move patterns
  else if (
    content.includes('move') ||
    content.includes('earlier') ||
    content.includes('later') ||
    content.includes('different day')
  ) {
    intent = 'move';
    confidence = 'medium';
    affectsRouting = true;
    timeImpact = 0;
  }
  // Question patterns
  else if (content.includes('?')) {
    intent = 'question';
    confidence = 'high';
    affectsRouting = false;
    timeImpact = null;
  }
  // Preference patterns
  else if (
    content.includes('prefer') ||
    content.includes('like') ||
    content.includes('love') ||
    content.includes('excited')
  ) {
    intent = 'preference';
    confidence = 'low';
    affectsRouting = false;
    timeImpact = null;
  }

  return {
    intent,
    confidence,
    reasoning: 'Classified using keyword matching',
    affects_routing: affectsRouting,
    estimated_time_impact_minutes: timeImpact,
  };
}

/**
 * Batch classify multiple comments
 */
export async function classifyComments(
  comments: { id: string; comment: string; targetType: 'spot' | 'drive' | 'activity' | 'meal' | 'day' | 'trip'; targetContext?: string }[]
): Promise<Map<string, CommentIntent>> {
  const results = new Map<string, CommentIntent>();

  // Process in parallel with concurrency limit
  const batchSize = 5;
  for (let i = 0; i < comments.length; i += batchSize) {
    const batch = comments.slice(i, i + batchSize);
    const promises = batch.map(async (c) => {
      const intent = await classifyComment({
        comment: c.comment,
        targetType: c.targetType,
        targetContext: c.targetContext,
      });
      return { id: c.id, intent };
    });

    const batchResults = await Promise.all(promises);
    for (const { id, intent } of batchResults) {
      results.set(id, intent);
    }
  }

  return results;
}
