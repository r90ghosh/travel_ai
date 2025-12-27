import type { Comment, CommentIntent } from '@/types';
import { createClient } from '@/lib/supabase/server';

export interface Conflict {
  comment1_id: string;
  comment2_id: string;
  reason: string;
  suggestion: string;
}

/**
 * Detects conflicts between pending comments before regeneration
 * Updates comments with conflict references in the database
 */
export async function detectConflicts(tripId: string): Promise<Conflict[]> {
  const supabase = await createClient();

  // Get all pending comments with intents
  const { data: comments } = await supabase
    .from('comments')
    .select('*')
    .eq('trip_id', tripId)
    .eq('status', 'pending')
    .not('intent', 'is', null);

  if (!comments || comments.length < 2) return [];

  const conflicts: Conflict[] = [];

  // Check each pair of comments
  for (let i = 0; i < comments.length; i++) {
    for (let j = i + 1; j < comments.length; j++) {
      const c1 = comments[i] as Comment;
      const c2 = comments[j] as Comment;
      const conflict = checkConflict(c1, c2);
      if (conflict) {
        conflicts.push(conflict);
      }
    }
  }

  // Update comments with conflict references
  for (const conflict of conflicts) {
    // Get current conflicts for comment1
    const { data: c1Data } = await supabase
      .from('comments')
      .select('conflicts_with')
      .eq('id', conflict.comment1_id)
      .single();

    const c1Conflicts = c1Data?.conflicts_with || [];
    if (!c1Conflicts.includes(conflict.comment2_id)) {
      await supabase
        .from('comments')
        .update({ conflicts_with: [...c1Conflicts, conflict.comment2_id] })
        .eq('id', conflict.comment1_id);
    }

    // Get current conflicts for comment2
    const { data: c2Data } = await supabase
      .from('comments')
      .select('conflicts_with')
      .eq('id', conflict.comment2_id)
      .single();

    const c2Conflicts = c2Data?.conflicts_with || [];
    if (!c2Conflicts.includes(conflict.comment1_id)) {
      await supabase
        .from('comments')
        .update({ conflicts_with: [...c2Conflicts, conflict.comment1_id] })
        .eq('id', conflict.comment2_id);
    }
  }

  return conflicts;
}

/**
 * Clear conflict references for a comment (called when comment is resolved/deleted)
 */
export async function clearConflicts(commentId: string): Promise<void> {
  const supabase = await createClient();

  // Get comments that reference this one
  const { data: conflictingComments } = await supabase
    .from('comments')
    .select('id, conflicts_with')
    .contains('conflicts_with', [commentId]);

  // Remove this comment from their conflicts_with arrays
  for (const comment of conflictingComments || []) {
    const updated = (comment.conflicts_with || []).filter(
      (id: string) => id !== commentId
    );
    await supabase
      .from('comments')
      .update({ conflicts_with: updated })
      .eq('id', comment.id);
  }

  // Clear this comment's conflicts_with
  await supabase
    .from('comments')
    .update({ conflicts_with: [] })
    .eq('id', commentId);
}

/**
 * Check if two comments conflict with each other
 */
function checkConflict(c1: Comment, c2: Comment): Conflict | null {
  const i1 = c1.intent as CommentIntent;
  const i2 = c2.intent as CommentIntent;

  if (!i1 || !i2) return null;

  // Same target, opposing actions
  if (c1.target_id === c2.target_id && c1.target_id !== null) {
    // Extend vs shorten
    if (
      (i1.action === 'extend' && i2.action === 'shorten') ||
      (i1.action === 'shorten' && i2.action === 'extend')
    ) {
      return {
        comment1_id: c1.id,
        comment2_id: c2.id,
        reason: 'One wants to extend time, other wants to shorten',
        suggestion: 'Discuss and agree on duration, then delete one comment',
      };
    }

    // Remove vs extend
    if (
      (i1.action === 'remove' && i2.action === 'extend') ||
      (i2.action === 'remove' && i1.action === 'extend')
    ) {
      return {
        comment1_id: c1.id,
        comment2_id: c2.id,
        reason: 'One wants to remove, other wants more time here',
        suggestion: 'Decide whether to keep or remove this stop',
      };
    }

    // Remove vs add (for same location)
    if (
      (i1.action === 'remove' && i2.action === 'add') ||
      (i2.action === 'remove' && i1.action === 'add')
    ) {
      return {
        comment1_id: c1.id,
        comment2_id: c2.id,
        reason: 'Conflicting add/remove for the same item',
        suggestion: 'Clarify whether this item should be included',
      };
    }

    // Both want to swap but with different alternatives
    if (i1.action === 'swap' && i2.action === 'swap') {
      return {
        comment1_id: c1.id,
        comment2_id: c2.id,
        reason: 'Multiple swap suggestions for the same item',
        suggestion: 'Choose one alternative or find a compromise',
      };
    }
  }

  // Time/routing conflicts on same day
  if (
    c1.target_type === 'day' &&
    c2.target_type === 'day' &&
    c1.target_id === c2.target_id
  ) {
    // Add activity vs reduce driving
    if (
      i1.action === 'add' &&
      i2.details?.toLowerCase().includes('less driving')
    ) {
      return {
        comment1_id: c1.id,
        comment2_id: c2.id,
        reason: 'Adding activity may conflict with "less driving" preference',
        suggestion: 'Check if addition fits within driving budget',
      };
    }

    if (
      i2.action === 'add' &&
      i1.details?.toLowerCase().includes('less driving')
    ) {
      return {
        comment1_id: c1.id,
        comment2_id: c2.id,
        reason: 'Adding activity may conflict with "less driving" preference',
        suggestion: 'Check if addition fits within driving budget',
      };
    }

    // Multiple adds that may overcrowd the day
    if (i1.action === 'add' && i2.action === 'add') {
      const totalTime =
        (i1.estimated_time_impact_minutes || 60) +
        (i2.estimated_time_impact_minutes || 60);
      if (totalTime > 180) {
        return {
          comment1_id: c1.id,
          comment2_id: c2.id,
          reason: 'Multiple additions may overcrowd this day',
          suggestion: 'Consider spreading activities across days or prioritizing',
        };
      }
    }
  }

  // Move conflicts - same item being moved to different places
  if (
    c1.target_id === c2.target_id &&
    i1.action === 'move' &&
    i2.action === 'move'
  ) {
    return {
      comment1_id: c1.id,
      comment2_id: c2.id,
      reason: 'Conflicting move suggestions for the same item',
      suggestion: 'Agree on the best time/day for this activity',
    };
  }

  return null;
}

/**
 * Get all conflicts for a trip without updating the database
 */
export async function getConflicts(tripId: string): Promise<Conflict[]> {
  const supabase = await createClient();

  const { data: comments } = await supabase
    .from('comments')
    .select('*')
    .eq('trip_id', tripId)
    .eq('status', 'pending')
    .not('intent', 'is', null);

  if (!comments || comments.length < 2) return [];

  const conflicts: Conflict[] = [];

  for (let i = 0; i < comments.length; i++) {
    for (let j = i + 1; j < comments.length; j++) {
      const c1 = comments[i] as Comment;
      const c2 = comments[j] as Comment;
      const conflict = checkConflict(c1, c2);
      if (conflict) {
        conflicts.push(conflict);
      }
    }
  }

  return conflicts;
}
