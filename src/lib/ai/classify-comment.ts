import type { CommentIntent, CommentAction, ConfidenceLevel } from '@/types';

interface ClassifyOptions {
  content: string;
  targetType: string;
  targetId?: string;
  selectedText?: string;
  itineraryContext?: {
    dayNumber: number;
    currentItems: string[];
  };
}

/**
 * Classifies a comment's intent using AI
 */
export async function classifyComment(options: ClassifyOptions): Promise<CommentIntent> {
  // TODO: Call Claude API with classification prompt
  // TODO: Parse response into CommentIntent
  // TODO: Handle errors and edge cases

  // For now, use heuristic classification
  return classifyWithHeuristics(options);
}

/**
 * Fallback heuristic classification when AI is not available
 */
function classifyWithHeuristics(options: ClassifyOptions): CommentIntent {
  const content = options.content.toLowerCase();

  // Detect action keywords
  let action: CommentAction = 'unclear';
  let confidence: ConfidenceLevel = 'low';
  let affectsRouting = false;
  let timeImpact: number | null = null;

  // Remove patterns
  if (
    content.includes('remove') ||
    content.includes('skip') ||
    content.includes('don\'t want') ||
    content.includes('take out') ||
    content.includes('delete')
  ) {
    action = 'remove';
    confidence = 'high';
    affectsRouting = true;
    timeImpact = -60; // Assume 1 hour saved
  }

  // Add patterns
  else if (
    content.includes('add') ||
    content.includes('include') ||
    content.includes('want to see') ||
    content.includes('can we go to')
  ) {
    action = 'add';
    confidence = 'medium';
    affectsRouting = true;
    timeImpact = 60; // Assume 1 hour added
  }

  // Extend patterns
  else if (
    content.includes('more time') ||
    content.includes('longer') ||
    content.includes('extend') ||
    content.includes('stay longer')
  ) {
    action = 'extend';
    confidence = 'high';
    affectsRouting = false;
    timeImpact = 30;
  }

  // Shorten patterns
  else if (
    content.includes('less time') ||
    content.includes('shorter') ||
    content.includes('quick stop') ||
    content.includes('don\'t need that long')
  ) {
    action = 'shorten';
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
    action = 'swap';
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
    action = 'move';
    confidence = 'medium';
    affectsRouting = true;
    timeImpact = 0;
  }

  // Question patterns
  else if (content.includes('?')) {
    action = 'question';
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
    action = 'preference';
    confidence = 'low';
    affectsRouting = false;
    timeImpact = null;
  }

  return {
    action,
    confidence,
    details: `Classified based on keyword matching`,
    affects_routing: affectsRouting,
    estimated_time_impact_minutes: timeImpact,
    suggested_resolution: getSuggestedResolution(action, options),
  };
}

/**
 * Generates a suggested resolution for the comment
 */
function getSuggestedResolution(action: CommentAction, options: ClassifyOptions): string | null {
  switch (action) {
    case 'remove':
      return `Remove ${options.targetId || 'this item'} from the itinerary`;
    case 'add':
      return `Add the requested item to day ${options.itineraryContext?.dayNumber || 'TBD'}`;
    case 'extend':
      return `Extend time at ${options.targetId || 'this location'} by 30-60 minutes`;
    case 'shorten':
      return `Reduce time at ${options.targetId || 'this location'}`;
    case 'swap':
      return `Replace ${options.targetId || 'this item'} with an alternative`;
    case 'move':
      return `Move ${options.targetId || 'this item'} to a different time/day`;
    case 'question':
      return null; // Questions don't need automatic resolution
    case 'preference':
      return null; // Preferences are informational
    default:
      return null;
  }
}

/**
 * Batch classify multiple comments
 */
export async function classifyComments(
  comments: { id: string; content: string; targetType: string; targetId?: string }[]
): Promise<Map<string, CommentIntent>> {
  const results = new Map<string, CommentIntent>();

  // TODO: Batch API call for efficiency

  for (const comment of comments) {
    const intent = await classifyComment({
      content: comment.content,
      targetType: comment.targetType,
      targetId: comment.targetId,
    });
    results.set(comment.id, intent);
  }

  return results;
}
