import type { TripFormData, GeneratedItinerary, Spot, Activity, RouteSegment } from '@/types';

/**
 * System prompt for itinerary generation
 */
export function getItineraryGenerationSystemPrompt(): string {
  return `You are an expert travel planner specializing in Iceland. Your role is to create detailed, practical day-by-day itineraries.

Key principles:
1. Respect driving times - Iceland's roads can be slow and weather-dependent
2. Balance popular attractions with hidden gems
3. Consider seasonal constraints (daylight hours, road closures, weather)
4. Group nearby attractions efficiently
5. Include practical details like parking, timing, and tips

Output format: Respond with valid JSON matching the GeneratedItinerary schema.`;
}

/**
 * User prompt for full itinerary generation
 */
export function getItineraryGenerationPrompt(
  request: TripFormData,
  season: string,
  spots: Spot[],
  activities: Activity[],
  routes: RouteSegment[]
): string {
  const duration = calculateDuration(request.start_date, request.end_date);

  return `Generate a ${duration}-day Iceland itinerary for the following trip:

**Trip Details:**
- Start Date: ${request.start_date}
- End Date: ${request.end_date}
- Pacing: ${request.pacing}
- Must-see experiences: ${request.anchors.join(', ') || 'None specified'}
- Starting/Ending: Reykjavik

**Season Context:**
- Season: ${season}
- ${getSeasonalNotes(season)}

**Available Spots (${spots.length} total):**
${formatSpotsForPrompt(spots)}

**Available Activities (${activities.length} total):**
${formatActivitiesForPrompt(activities)}

**Route Information:**
${formatRoutesForPrompt(routes)}

**Requirements:**
1. Each day should have 3-5 main stops depending on pacing preference
2. Include driving times between locations
3. Start and end in Reykjavik
4. Fulfill all anchor experiences if possible
5. Balance driving with sightseeing time
6. Include meals and rest stops

Generate a complete itinerary in JSON format following the GeneratedItinerary schema.`;
}

/**
 * Prompt for extending an existing itinerary
 */
export function getExtendItineraryPrompt(
  baseItinerary: GeneratedItinerary,
  daysToAdd: number,
  availableSpots: Spot[],
  availableActivities: Activity[]
): string {
  const lastDay = baseItinerary.days[baseItinerary.days.length - 1];
  const lastSpot = lastDay.timeline[lastDay.timeline.length - 1];

  return `Extend this Iceland itinerary by ${daysToAdd} more days.

**Current Itinerary Ends:**
- Day ${lastDay.day_number}: ${lastDay.title}
- Final location: ${lastSpot?.spot_id || 'Unknown'}
- Spots already visited: ${getAllVisitedSpots(baseItinerary).join(', ')}

**Available Unvisited Spots:**
${formatSpotsForPrompt(availableSpots.filter(s => !getAllVisitedSpots(baseItinerary).includes(s.id)))}

**Available Activities:**
${formatActivitiesForPrompt(availableActivities)}

Generate ${daysToAdd} additional days that:
1. Continue logically from where the trip left off
2. Return to Reykjavik by the final day
3. Maintain the same pacing as the existing itinerary
4. Avoid revisiting spots already seen

Return only the new days in JSON format.`;
}

/**
 * Prompt for adding anchor experiences
 */
export function getAddAnchorPrompt(
  itinerary: GeneratedItinerary,
  anchors: string[],
  spots: Spot[],
  activities: Activity[]
): string {
  return `Modify this itinerary to include the following must-see experiences: ${anchors.join(', ')}

**Current Itinerary:**
${formatItinerarySummary(itinerary)}

**Spots that could fulfill these anchors:**
${formatSpotsForPrompt(spots.filter(s =>
  anchors.some(a => s.fulfills_anchors?.includes(a))
))}

**Activities that could fulfill these anchors:**
${formatActivitiesForPrompt(activities.filter(a =>
  anchors.some(anchor => a.fulfills_anchors?.includes(anchor))
))}

Determine:
1. Which day(s) to insert the anchor experiences
2. What adjustments are needed (removing/shortening other stops)
3. How to maintain logical routing

Return the modified itinerary with changes highlighted.`;
}

/**
 * System prompt for comment classification
 */
export function getCommentClassificationSystemPrompt(): string {
  return `You are an AI assistant that classifies user comments on travel itineraries.

Your job is to:
1. Identify the user's intent (add, remove, swap, extend, shorten, move, question, preference)
2. Assess confidence level (high, medium, low)
3. Determine if the change affects routing
4. Estimate time impact in minutes

Respond with JSON matching the CommentIntent schema.`;
}

/**
 * User prompt for comment classification
 */
export function getCommentClassificationPrompt(
  content: string,
  targetType: string,
  targetId: string | undefined,
  context: { dayNumber?: number; currentItems?: string[] }
): string {
  return `Classify this user comment on a travel itinerary:

**Comment:** "${content}"
**Target Type:** ${targetType}
**Target ID:** ${targetId || 'Not specified'}
**Context:** Day ${context.dayNumber || 'unknown'}, Current items: ${context.currentItems?.join(', ') || 'none'}

Determine:
1. action: What does the user want to do? (add, remove, swap, extend, shorten, move, question, preference, unclear)
2. confidence: How certain are you? (high, medium, low)
3. details: Brief explanation of your classification
4. affects_routing: Would this change require recalculating the route?
5. estimated_time_impact_minutes: How much time would this add/remove? (null if unknown)
6. suggested_resolution: What action should be taken?

Respond with valid JSON.`;
}

/**
 * Prompt for resolving conflicting comments
 */
export function getConflictResolutionPrompt(
  comments: Array<{ id: string; content: string; intent: string }>,
  targetId: string
): string {
  return `The following comments on "${targetId}" conflict with each other:

${comments.map((c, i) => `${i + 1}. "${c.content}" (Intent: ${c.intent})`).join('\n')}

Analyze these conflicts and suggest:
1. Which comment should take priority and why
2. If there's a way to satisfy both/all comments
3. What questions to ask the user to resolve the conflict

Respond with a resolution strategy in JSON format.`;
}

// Helper functions

function calculateDuration(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

function getSeasonalNotes(season: string): string {
  switch (season) {
    case 'summer':
      return 'Long daylight hours (nearly 24h in June). Highland roads (F-roads) may be open. Midnight sun possible.';
    case 'winter':
      return 'Short daylight hours (4-6h). Many highland roads closed. Northern lights visible. Weather unpredictable.';
    case 'spring':
      return 'Increasing daylight. Some roads still closed. Puffins arriving. Waterfalls at peak flow.';
    case 'fall':
      return 'Decreasing daylight. Northern lights season begins. Fall colors. Roads may close unexpectedly.';
    default:
      return '';
  }
}

function formatSpotsForPrompt(spots: Spot[]): string {
  return spots
    .slice(0, 20) // Limit to avoid token overflow
    .map(s => `- ${s.id}: ${s.name} (${s.region}) - ~${s.duration_min_hrs}-${s.duration_max_hrs}h`)
    .join('\n');
}

function formatActivitiesForPrompt(activities: Activity[]): string {
  return activities
    .slice(0, 15)
    .map(a => `- ${a.id}: ${a.name} - ${a.duration_hrs}h, $${a.price_low_usd || 'Free'}`)
    .join('\n');
}

function formatRoutesForPrompt(routes: RouteSegment[]): string {
  return routes
    .slice(0, 15)
    .map(r => `- ${r.from_name} → ${r.to_name}: ${r.drive_minutes}min via ${r.road_type}`)
    .join('\n');
}

function formatItinerarySummary(itinerary: GeneratedItinerary): string {
  return itinerary.days
    .map(d => `Day ${d.day_number}: ${d.title} - ${d.timeline.length} stops`)
    .join('\n');
}

function getAllVisitedSpots(itinerary: GeneratedItinerary): string[] {
  const spots: string[] = [];
  for (const day of itinerary.days) {
    for (const item of day.timeline) {
      if (item.spot_id) {
        spots.push(item.spot_id);
      }
    }
  }
  return spots;
}
