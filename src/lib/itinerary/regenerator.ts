import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import type { GeneratedItinerary, Comment, CommentIntent, ItineraryVersion } from '@/types';

const anthropic = new Anthropic();

interface RegenerationResult {
  itinerary: GeneratedItinerary;
  version: ItineraryVersion;
  changesMade: string[];
}

/**
 * Regenerates an itinerary by applying pending comments
 * Creates a new version and marks comments as addressed
 */
export async function regenerateItinerary(
  tripId: string,
  userId: string
): Promise<RegenerationResult> {
  const supabase = await createClient();

  // Get current trip
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  if (tripError || !trip) {
    throw new Error('Trip not found');
  }

  // Get current itinerary version
  const { data: currentVersion, error: versionError } = await supabase
    .from('itinerary_versions')
    .select('*')
    .eq('trip_id', tripId)
    .eq('version', trip.active_version)
    .single();

  if (versionError || !currentVersion) {
    throw new Error('Current itinerary version not found');
  }

  // Get pending comments
  const { data: comments, error: commentsError } = await supabase
    .from('comments')
    .select('*')
    .eq('trip_id', tripId)
    .eq('status', 'pending');

  if (commentsError) {
    throw new Error('Failed to fetch comments');
  }

  if (!comments || comments.length === 0) {
    throw new Error('No pending comments to apply');
  }

  // Build regeneration prompt
  const prompt = buildRegenerationPrompt(
    currentVersion.data as GeneratedItinerary,
    comments as Comment[],
    trip
  );

  // Call Claude to regenerate
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 12000,
    messages: [{ role: 'user', content: prompt }],
  });

  // Parse response
  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response format');
  }

  // Extract JSON from response
  const jsonMatch = content.text.match(/```json\n?([\s\S]*?)\n?```/) ||
                   content.text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('Failed to parse regenerated itinerary');
  }

  const jsonStr = jsonMatch[1] || jsonMatch[0];
  const regeneratedData = JSON.parse(jsonStr);

  const newItinerary = regeneratedData.itinerary || regeneratedData;
  const changesMade = regeneratedData.changes_made || generateSummary(comments);
  const newVersion = trip.active_version + 1;

  // Save new version
  const { data: savedVersion, error: saveError } = await supabase
    .from('itinerary_versions')
    .insert({
      trip_id: tripId,
      version: newVersion,
      data: newItinerary,
      source_type: 'regeneration',
      parent_version: trip.active_version,
      source_comment_ids: comments.map((c) => c.id),
      modification_summary: Array.isArray(changesMade) ? changesMade.join('; ') : changesMade,
      created_by: userId,
    })
    .select()
    .single();

  if (saveError) {
    throw new Error('Failed to save new itinerary version');
  }

  // Update trip with new active version and increment regeneration count
  const { error: updateTripError } = await supabase
    .from('trips')
    .update({
      active_version: newVersion,
      regenerations_used: (trip.regenerations_used || 0) + 1,
    })
    .eq('id', tripId);

  if (updateTripError) {
    throw new Error('Failed to update trip');
  }

  // Mark comments as addressed
  const { error: updateCommentsError } = await supabase
    .from('comments')
    .update({
      status: 'addressed',
      addressed_in_version: newVersion,
    })
    .in(
      'id',
      comments.map((c) => c.id)
    );

  if (updateCommentsError) {
    console.error('Failed to update comment status:', updateCommentsError);
  }

  return {
    itinerary: newItinerary,
    version: savedVersion,
    changesMade: Array.isArray(changesMade) ? changesMade : [changesMade],
  };
}

/**
 * Build the prompt for Claude to regenerate the itinerary
 */
function buildRegenerationPrompt(
  current: GeneratedItinerary,
  comments: Comment[],
  trip: Record<string, unknown>
): string {
  const commentSummary = comments
    .map((c) => {
      const intent = c.intent as CommentIntent | null;
      return `- Target: ${c.target_type}${c.target_id ? `/${c.target_id}` : ''}
  Comment: "${c.content}"
  Intent: ${intent?.action || 'unclear'} (${intent?.confidence || 'low'} confidence)
  ${intent?.details ? `Details: ${intent.details}` : ''}`;
    })
    .join('\n');

  return `# Task: Regenerate travel itinerary based on user feedback

## Current Itinerary
\`\`\`json
${JSON.stringify(current, null, 2)}
\`\`\`

## User Feedback to Apply
${commentSummary}

## Trip Context
- Destination: ${trip.destination_slug}
- Duration: ${trip.duration_days} days
- Travelers: ${trip.traveler_count}
- Pacing: ${trip.pacing}
- Anchors: ${(trip.anchors as string[])?.join(', ') || 'None specified'}

## Instructions
1. Apply each piece of feedback to the itinerary:
   - "remove": Remove the specified item/activity
   - "add": Add the requested item, finding appropriate slot
   - "extend": Increase time allocated for the item
   - "shorten": Decrease time allocated for the item
   - "swap": Replace with alternative while maintaining flow
   - "move": Relocate to different time/day
   - "preference": Note preference for future consideration
   - "question": Address by adjusting if clear action needed

2. Maintain these constraints:
   - No backtracking (route should flow logically)
   - Keep within ${trip.pacing} pacing limits
   - Preserve anchor fulfillment where possible
   - Ensure realistic driving times between stops
   - Maintain meal times at appropriate hours

3. For each change made, note what was modified

## Output Format
Return a JSON object with:
\`\`\`json
{
  "itinerary": { ... the complete updated itinerary using same schema ... },
  "changes_made": [
    "Removed X from Day Y",
    "Added Z to Day W at 2:00 PM",
    ...
  ]
}
\`\`\`

Return ONLY the JSON, no additional text.`;
}

/**
 * Generate a summary of changes from comments
 */
function generateSummary(comments: Comment[]): string[] {
  return comments.map((c) => {
    const intent = c.intent as CommentIntent | null;
    const action = intent?.action || 'noted';
    const target = (c.target_type === 'general' || c.target_type === 'trip') ? 'itinerary' : `${c.target_type} ${c.target_id || ''}`;
    return `${action}: ${target} - ${c.content.slice(0, 50)}${c.content.length > 50 ? '...' : ''}`;
  });
}
