import type { Trip, GeneratedItinerary, GenerationTask } from '@/types';
import decisionEngineRules from '@/data/iceland/decision_engine_rules.json';
import spots from '@/data/iceland/spots.json';
import spotLabels from '@/data/iceland/spot_labels.json';
import activities from '@/data/iceland/activities.json';
import activityLabels from '@/data/iceland/activity_labels.json';
import routes from '@/data/iceland/routes.json';

// Filter spots by season
function filterSpotsBySeason(season: string): typeof spots {
  return spots.filter(spot => {
    const label = spotLabels.find(l => l.spot_id === spot.spot_id);
    if (!label) return true;
    if (label.seasonality === 'year_round') return true;
    if (label.seasonality === 'summer_only' && season === 'summer') return true;
    if (label.seasonality === 'winter_only' && season === 'winter') return true;
    return false;
  });
}

// Filter activities by season
function filterActivitiesBySeason(season: string): typeof activities {
  return activities.filter(activity => {
    const label = activityLabels.find(l => l.activity_id === activity.activity_id);
    if (!label) return true;
    if (label.seasonality === 'year_round') return true;
    if (label.seasonality === 'summer_only' && season === 'summer') return true;
    if (label.seasonality === 'winter_only' && season === 'winter') return true;
    return false;
  });
}

// Get relevant rules for this trip's pacing and traveler type
function getRelevantRules(trip: Trip) {
  const pacingRules = decisionEngineRules.pacing_rules[trip.pacing as keyof typeof decisionEngineRules.pacing_rules];
  const travelerAdjustments = decisionEngineRules.traveler_adjustments[trip.travelers as keyof typeof decisionEngineRules.traveler_adjustments] || {};
  const energyRules = decisionEngineRules.energy_management;
  const varietyRules = decisionEngineRules.variety_rules;
  const routingRules = decisionEngineRules.routing_rules;
  const anchorRules = decisionEngineRules.anchor_rules;
  const mealTiming = decisionEngineRules.meal_timing[trip.pacing as keyof typeof decisionEngineRules.meal_timing];

  return {
    pacing: pacingRules,
    traveler: travelerAdjustments,
    energy: energyRules,
    variety: varietyRules,
    routing: routingRules,
    anchors: anchorRules,
    meals: mealTiming,
  };
}

// Build output schema for AI
const OUTPUT_SCHEMA = `{
  "days": [
    {
      "day_number": 1,
      "date": "2025-08-01",
      "day_of_week": "Friday",
      "title": "Arrival + Golden Circle",
      "region": "golden_circle",
      "stats": {
        "driving_minutes": 180,
        "driving_km": 150,
        "spots_count": 3,
        "activities_count": 1
      },
      "timeline": [
        {
          "id": "unique_id",
          "time": "09:00",
          "end_time": "10:30",
          "type": "spot",
          "spot_id": "thingvellir",  // MUST match spot_id from spots.json
          "duration_minutes": 90,
          "notes": "Optional specific notes"
        },
        {
          "id": "unique_id",
          "time": "10:30",
          "end_time": "11:15",
          "type": "drive",
          "route_id": "thingvellir_to_geysir",  // MUST match segment_id from routes.json
          "duration_minutes": 45
        },
        {
          "id": "unique_id",
          "time": "13:00",
          "end_time": "13:45",
          "type": "meal",
          "meal_type": "lunch",
          "meal_suggestion": "Friðheimar tomato farm",
          "duration_minutes": 45
        },
        {
          "id": "unique_id",
          "time": "15:00",
          "end_time": "18:00",
          "type": "activity",
          "activity_id": "glacier_hike_solheimar",  // MUST match activity_id from activities.json
          "duration_minutes": 180
        }
      ],
      "accommodation": {
        "area": "Selfoss",
        "suggestion": "Guesthouses in Selfoss area"
      }
    }
  ],
  "anchor_fulfillment": [
    {
      "anchor": "waterfalls",
      "fulfilled_by": [
        { "type": "spot", "id": "gullfoss", "day": 1 },
        { "type": "spot", "id": "skogafoss", "day": 2 }
      ],
      "backup": [
        { "type": "spot", "id": "seljalandsfoss", "day": 2 }
      ]
    }
  ],
  "warnings": [
    "Book glacier hike 2-3 days in advance",
    "Blue Lagoon requires advance booking"
  ],
  "booking_reminders": [
    { "item_id": "glacier_hike_solheimar", "message": "Book glacier hike", "days_ahead": 3 }
  ]
}`;

// Full generation prompt (no cache match)
export function buildFullGenerationPrompt(trip: Trip, season: string): string {
  const rules = getRelevantRules(trip);
  const availableSpots = filterSpotsBySeason(season);
  const availableActivities = filterActivitiesBySeason(season);

  return `
# Task: Generate a complete ${trip.duration_days}-day Iceland itinerary

## Trip Parameters
- Dates: ${trip.start_date} to ${trip.end_date} (${trip.duration_days} days)
- Season: ${season}
- Travelers: ${trip.travelers} (${trip.traveler_count} people)
- Pacing: ${trip.pacing}
- Must-experience anchors: ${trip.anchors.join(', ')}
- Budget tier: ${trip.budget_tier}

## CRITICAL RULES - YOU MUST FOLLOW THESE

### Pacing Rules (${trip.pacing})
${JSON.stringify(rules.pacing, null, 2)}

### Traveler Adjustments (${trip.travelers})
${JSON.stringify(rules.traveler, null, 2)}

### Energy Management
- Strenuous activities: morning only (before 14:00)
- After glacier/water activities: schedule warm activity next
- Follow the daily energy curve: high energy morning → moderate midday → easy evening

### Routing Rules
- NO BACKTRACKING: Day's route must flow in one direction
- One region focus per day (70%+ of stops in same region)
- Max ${rules.pacing.inter_spot_max_minutes} minutes between consecutive spots
- Hotel should be within ${rules.pacing.accommodation_proximity_last_activity_minutes} min of last activity

### Variety Rules
- Max 2 waterfalls per day
- Max 1 glacier activity per day
- No more than 2 "scenic viewpoint" type spots in a row
- After 3 "looking" spots, include a "doing" activity

### Anchor Fulfillment
- Each anchor MUST have at least 2 experiences fulfilling it
- Include a backup option for weather-critical anchors
- Distribute anchors across the trip (don't cluster in first days)

### Meal Timing (${trip.pacing})
${JSON.stringify(rules.meals, null, 2)}

## AVAILABLE DATA - USE ONLY THESE IDs

### Spots (use spot_id field)
${JSON.stringify(availableSpots.map(s => ({
  spot_id: s.spot_id,
  name: s.name,
  region: s.region,
  duration: s.duration_min_hrs + '-' + s.duration_max_hrs + ' hrs',
  fulfills_anchors: s.fulfills_anchors
})), null, 2)}

### Activities (use activity_id field)
${JSON.stringify(availableActivities.map(a => ({
  activity_id: a.activity_id,
  name: a.name,
  duration_hrs: a.duration_hrs,
  fulfills_anchors: a.fulfills_anchors,
  book_ahead_days: a.book_ahead_days
})), null, 2)}

### Routes (use segment_id field for route_id)
${JSON.stringify(routes.map(r => ({
  segment_id: r.segment_id,
  from: r.from_name,
  to: r.to_name,
  drive_min: r.drive_min,
  distance_km: r.distance_km
})), null, 2)}

## OUTPUT FORMAT
Return ONLY valid JSON matching this schema (no markdown, no explanation):
${OUTPUT_SCHEMA}

## IMPORTANT
1. ONLY use spot_id, activity_id, segment_id values from the lists above
2. Generate a unique "id" for each timeline item (use format: "day1_item1", "day1_item2", etc.)
3. Times must be realistic and account for driving between locations
4. First day should account for airport arrival time
5. Last day should account for departure
6. Verify total driving time per day is within pacing limits
`;
}

// Differential generation prompt (extending from cache)
export function buildDifferentialPrompt(
  trip: Trip,
  season: string,
  baseItinerary: GeneratedItinerary,
  tasks: GenerationTask[]
): string {
  const rules = getRelevantRules(trip);
  const availableSpots = filterSpotsBySeason(season);
  const availableActivities = filterActivitiesBySeason(season);

  const taskDescriptions = tasks.map(task => {
    switch (task.type) {
      case 'extend_days':
        return `EXTEND: Add ${task.details.add_days} more days (days ${(task.details.from_days as number) + 1} to ${task.details.to_days})`;
      case 'add_anchor':
        return `ADD ANCHORS: Include experiences for: ${(task.details.anchors as string[]).join(', ')}`;
      case 'adjust_pacing':
        return `ADJUST PACING: Modify from ${task.details.from} to ${task.details.to} pace`;
      default:
        return '';
    }
  }).join('\n');

  return `
# Task: Modify an existing Iceland itinerary

## Base Itinerary (DO NOT regenerate this - modify it)
${JSON.stringify(baseItinerary, null, 2)}

## Required Modifications
${taskDescriptions}

## Target Trip Parameters
- Duration: ${trip.duration_days} days (base is ${baseItinerary.days.length} days)
- Pacing: ${trip.pacing}
- Required anchors: ${trip.anchors.join(', ')}
- Missing anchors to add: ${(tasks.find(t => t.type === 'add_anchor')?.details.anchors as string[] | undefined)?.join(', ') || 'none'}

## Rules
${JSON.stringify(rules.pacing, null, 2)}

## Available Spots & Activities
${JSON.stringify(availableSpots.map(s => ({ spot_id: s.spot_id, name: s.name, region: s.region, fulfills_anchors: s.fulfills_anchors })), null, 2)}

${JSON.stringify(availableActivities.map(a => ({ activity_id: a.activity_id, name: a.name, fulfills_anchors: a.fulfills_anchors })), null, 2)}

## Output Format
Return JSON with:
{
  "modifications": [
    {
      "day_number": 3,
      "action": "insert" | "replace" | "remove",
      "index": 2,  // Position in timeline
      "item": { ...timeline item if insert/replace... }
    }
  ],
  "new_days": [
    { ...full day objects for extended days... }
  ],
  "updated_anchor_fulfillment": [...],
  "updated_warnings": [...],
  "updated_booking_reminders": [...]
}
`;
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

export { OUTPUT_SCHEMA, getRelevantRules, filterSpotsBySeason, filterActivitiesBySeason };
