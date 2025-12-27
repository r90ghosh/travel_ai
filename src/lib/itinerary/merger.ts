import type {
  GeneratedItinerary,
  ItineraryVersion,
  Comment,
  CommentIntent,
  Modification,
} from '@/types';

interface MergeResult {
  itinerary: GeneratedItinerary;
  modifications: Modification[];
  summary: string;
  addressedCommentIds: string[];
}

/**
 * Merges comments into an itinerary to create a new version
 */
export async function mergeComments(
  currentItinerary: GeneratedItinerary,
  comments: Comment[],
  options: { mode: 'all' | 'selected' }
): Promise<MergeResult> {
  // TODO: Group comments by target (day, spot, etc.)
  // TODO: Detect and resolve conflicts
  // TODO: Apply modifications in order of priority
  // TODO: Generate modification summary

  throw new Error('Not implemented');
}

/**
 * Applies a single comment's intent to the itinerary
 */
export async function applyCommentIntent(
  itinerary: GeneratedItinerary,
  comment: Comment
): Promise<{ itinerary: GeneratedItinerary; modification: Modification }> {
  if (!comment.intent) {
    throw new Error('Comment has no classified intent');
  }

  const intent = comment.intent;

  switch (intent.action) {
    case 'remove':
      return removeItem(itinerary, comment);
    case 'add':
      return addItem(itinerary, comment);
    case 'extend':
      return extendItem(itinerary, comment);
    case 'shorten':
      return shortenItem(itinerary, comment);
    case 'swap':
      return swapItem(itinerary, comment);
    case 'move':
      return moveItem(itinerary, comment);
    default:
      throw new Error(`Unknown action: ${intent.action}`);
  }
}

/**
 * Removes an item from the itinerary
 */
async function removeItem(
  itinerary: GeneratedItinerary,
  comment: Comment
): Promise<{ itinerary: GeneratedItinerary; modification: Modification }> {
  // TODO: Find and remove the target item
  // TODO: Adjust timing of subsequent items
  // TODO: Add free time if gap is too large

  throw new Error('Not implemented');
}

/**
 * Adds a new item to the itinerary
 */
async function addItem(
  itinerary: GeneratedItinerary,
  comment: Comment
): Promise<{ itinerary: GeneratedItinerary; modification: Modification }> {
  // TODO: Parse what to add from comment content/intent
  // TODO: Find appropriate spot in timeline
  // TODO: Insert and adjust surrounding items

  throw new Error('Not implemented');
}

/**
 * Extends time at a location
 */
async function extendItem(
  itinerary: GeneratedItinerary,
  comment: Comment
): Promise<{ itinerary: GeneratedItinerary; modification: Modification }> {
  // TODO: Find the target item
  // TODO: Increase duration
  // TODO: Adjust subsequent items or remove if needed

  throw new Error('Not implemented');
}

/**
 * Shortens time at a location
 */
async function shortenItem(
  itinerary: GeneratedItinerary,
  comment: Comment
): Promise<{ itinerary: GeneratedItinerary; modification: Modification }> {
  // TODO: Find the target item
  // TODO: Decrease duration
  // TODO: Adjust subsequent items

  throw new Error('Not implemented');
}

/**
 * Swaps one item for another
 */
async function swapItem(
  itinerary: GeneratedItinerary,
  comment: Comment
): Promise<{ itinerary: GeneratedItinerary; modification: Modification }> {
  // TODO: Find the target item
  // TODO: Determine replacement from comment/suggestions
  // TODO: Replace item, adjusting timing if needed

  throw new Error('Not implemented');
}

/**
 * Moves an item to a different day/time
 */
async function moveItem(
  itinerary: GeneratedItinerary,
  comment: Comment
): Promise<{ itinerary: GeneratedItinerary; modification: Modification }> {
  // TODO: Find the target item
  // TODO: Remove from current position
  // TODO: Insert at new position
  // TODO: Adjust both locations

  throw new Error('Not implemented');
}

/**
 * Detects conflicts between pending comments
 */
export function detectConflicts(comments: Comment[]): Map<string, string[]> {
  const conflicts = new Map<string, string[]>();

  for (let i = 0; i < comments.length; i++) {
    for (let j = i + 1; j < comments.length; j++) {
      if (areConflicting(comments[i], comments[j])) {
        // Add to conflicts map
        const existing = conflicts.get(comments[i].id) || [];
        existing.push(comments[j].id);
        conflicts.set(comments[i].id, existing);
      }
    }
  }

  return conflicts;
}

/**
 * Checks if two comments conflict with each other
 */
function areConflicting(a: Comment, b: Comment): boolean {
  // Same target?
  if (a.target_type !== b.target_type || a.target_id !== b.target_id) {
    return false;
  }

  // Conflicting actions?
  const aAction = a.intent?.action;
  const bAction = b.intent?.action;

  // Remove vs Add/Extend conflicts
  if (aAction === 'remove' && ['add', 'extend'].includes(bAction || '')) {
    return true;
  }
  if (bAction === 'remove' && ['add', 'extend'].includes(aAction || '')) {
    return true;
  }

  // Extend vs Shorten conflicts
  if ((aAction === 'extend' && bAction === 'shorten') ||
      (aAction === 'shorten' && bAction === 'extend')) {
    return true;
  }

  return false;
}

/**
 * Generates a human-readable summary of modifications
 */
export function generateModificationSummary(modifications: Modification[]): string {
  if (modifications.length === 0) {
    return 'No changes made';
  }

  const parts = modifications.map((mod) => {
    switch (mod.type) {
      case 'add':
        return `Added ${mod.target_id}`;
      case 'remove':
        return `Removed ${mod.target_id}`;
      case 'extend':
        return `Extended time at ${mod.target_id}`;
      case 'shorten':
        return `Shortened time at ${mod.target_id}`;
      case 'swap':
        return `Swapped ${mod.target_id}`;
      case 'move':
        return `Moved ${mod.target_id}`;
      default:
        return mod.description;
    }
  });

  return parts.join('; ');
}
