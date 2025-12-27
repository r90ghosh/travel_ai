import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import type { Trip, GeneratedItinerary, ItineraryVersion, ItinerarySummary } from '@/types';
import { findBestCacheMatch } from './cache-matcher';
import { buildFullGenerationPrompt, buildDifferentialPrompt } from '@/lib/ai/prompts';
import { mergeItinerary } from './merger';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

function getSeason(startDate: string): 'summer' | 'winter' | 'shoulder' {
  const month = new Date(startDate).getMonth() + 1;
  if ([6, 7, 8].includes(month)) return 'summer';
  if ([11, 12, 1, 2, 3].includes(month)) return 'winter';
  return 'shoulder';
}

export async function generateItinerary(tripId: string): Promise<{
  itinerary: GeneratedItinerary;
  version: ItineraryVersion;
  source: 'cache_exact' | 'cache_differential' | 'full_generation';
}> {
  const supabase = await createClient();

  // Get trip data
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  if (tripError || !trip) {
    throw new Error('Trip not found');
  }

  const season = getSeason(trip.start_date);

  // Step 1: Check cache for similar itinerary
  const cacheMatch = await findBestCacheMatch(trip as Trip);

  let itinerary: GeneratedItinerary;
  let sourceType: ItineraryVersion['source_type'];
  let baseCacheId: string | null = null;
  let tokenCost = 0;

  if (cacheMatch && cacheMatch.match_type === 'exact') {
    // Exact match - just personalize dates
    console.log('Using exact cache match');
    itinerary = personalizeDates(cacheMatch.cache_entry.itinerary_data, trip as Trip);
    sourceType = 'base';
    baseCacheId = cacheMatch.cache_entry.id;

    // Increment usage counter
    await supabase
      .from('itinerary_cache')
      .update({ times_used: cacheMatch.cache_entry.times_used + 1 })
      .eq('id', cacheMatch.cache_entry.id);

  } else if (cacheMatch && cacheMatch.match_score >= 60) {
    // Differential generation
    console.log('Using differential generation from cache');
    const prompt = buildDifferentialPrompt(
      trip as Trip,
      season,
      cacheMatch.cache_entry.itinerary_data,
      cacheMatch.generation_tasks
    );

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });

    tokenCost = (response.usage.input_tokens + response.usage.output_tokens) / 1000 * 0.015; // Rough cost estimate

    const contentBlock = response.content[0];
    if (contentBlock.type !== 'text') {
      throw new Error('Unexpected response type from AI');
    }
    const aiOutput = JSON.parse(contentBlock.text);
    itinerary = mergeItinerary(cacheMatch.cache_entry.itinerary_data, aiOutput, trip as Trip);
    sourceType = 'differential';
    baseCacheId = cacheMatch.cache_entry.id;

  } else {
    // Full generation
    console.log('Full generation (no suitable cache match)');
    const prompt = buildFullGenerationPrompt(trip as Trip, season);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 12000,
      messages: [{ role: 'user', content: prompt }],
    });

    tokenCost = (response.usage.input_tokens + response.usage.output_tokens) / 1000 * 0.015;

    const contentBlock = response.content[0];
    if (contentBlock.type !== 'text') {
      throw new Error('Unexpected response type from AI');
    }
    itinerary = JSON.parse(contentBlock.text);
    itinerary.trip_id = tripId;
    itinerary.version = 1;
    itinerary.generated_at = new Date().toISOString();
    sourceType = 'base';
  }

  // Add summary if not present
  if (!itinerary.summary) {
    itinerary.summary = calculateSummary(itinerary);
  }

  // Step 2: Save to itinerary_versions
  const { data: version, error: versionError } = await supabase
    .from('itinerary_versions')
    .insert({
      trip_id: tripId,
      version: 1,
      data: itinerary,
      source_type: sourceType,
      base_itinerary_id: baseCacheId,
      generation_cost: tokenCost,
      created_by: trip.created_by,
    })
    .select()
    .single();

  if (versionError) {
    throw new Error('Failed to save itinerary version');
  }

  // Step 3: Update trip with active version
  await supabase
    .from('trips')
    .update({ active_version: 1, regenerations_used: 1 })
    .eq('id', tripId);

  // Step 4: Cache this generation for future use
  await cacheItinerary(trip as Trip, itinerary, season);

  return {
    itinerary,
    version: version as ItineraryVersion,
    source: sourceType === 'base' ? (cacheMatch ? 'cache_exact' : 'full_generation') : 'cache_differential',
  };
}

// Personalize dates in cached itinerary
function personalizeDates(itinerary: GeneratedItinerary, trip: Trip): GeneratedItinerary {
  const startDate = new Date(trip.start_date);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return {
    ...itinerary,
    trip_id: trip.id,
    generated_at: new Date().toISOString(),
    days: itinerary.days.map((day, index) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + index);
      return {
        ...day,
        date: date.toISOString().split('T')[0],
        day_of_week: days[date.getDay()],
      };
    }),
  };
}

// Calculate summary from itinerary
function calculateSummary(itinerary: GeneratedItinerary): ItinerarySummary {
  let totalDrivingKm = 0;
  let totalDrivingMinutes = 0;
  const regions = new Set<string>();

  itinerary.days.forEach(day => {
    totalDrivingKm += day.stats.driving_km;
    totalDrivingMinutes += day.stats.driving_minutes;
    regions.add(day.region);
  });

  return {
    total_destinations: regions.size,
    total_driving_km: totalDrivingKm,
    total_driving_hours: Math.round(totalDrivingMinutes / 60 * 10) / 10,
    accommodation_stops: itinerary.days.length,
    estimated_cost: { low: 3000, high: 5000, currency: 'USD' }, // TODO: Calculate properly
  };
}

// Cache the generated itinerary
async function cacheItinerary(trip: Trip, itinerary: GeneratedItinerary, season: string) {
  const supabase = await createClient();

  const spotIds = itinerary.days.flatMap(d =>
    d.timeline.filter(t => t.spot_id).map(t => t.spot_id!)
  );
  const activityIds = itinerary.days.flatMap(d =>
    d.timeline.filter(t => t.activity_id).map(t => t.activity_id!)
  );
  const regions = [...new Set(itinerary.days.map(d => d.region))];
  const totalDriving = itinerary.days.reduce((sum, d) => sum + d.stats.driving_minutes, 0);

  const durationBucket = trip.duration_days <= 5 ? '3-5' :
                         trip.duration_days <= 8 ? '6-8' :
                         trip.duration_days <= 11 ? '9-11' :
                         trip.duration_days <= 14 ? '12-14' : '15+';

  await supabase.from('itinerary_cache').insert({
    destination_slug: trip.destination_slug,
    duration_days: trip.duration_days,
    duration_bucket: durationBucket,
    pacing: trip.pacing,
    anchors: trip.anchors,
    anchors_key: [...trip.anchors].sort().join(','),
    season,
    traveler_type: trip.travelers,
    regions_covered: regions,
    spot_ids: spotIds,
    activity_ids: activityIds,
    total_driving_minutes: totalDriving,
    itinerary_data: itinerary,
    quality_score: 50, // Default score
    times_used: 1,
  });
}

/**
 * Validates that an itinerary is logically consistent
 */
export function validateItinerary(itinerary: GeneratedItinerary): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check that days are sequential
  for (let i = 0; i < itinerary.days.length; i++) {
    if (itinerary.days[i].day_number !== i + 1) {
      errors.push(`Day ${i + 1} has incorrect day_number`);
    }
  }

  // Check that timeline items have valid times
  for (const day of itinerary.days) {
    let lastEndTime = '00:00';
    for (const item of day.timeline) {
      if (item.time < lastEndTime) {
        errors.push(`Day ${day.day_number}: Timeline item ${item.id} starts before previous item ends`);
      }
      if (item.end_time) {
        lastEndTime = item.end_time;
      }
    }
  }

  // Check that anchors are fulfilled
  for (const anchor of itinerary.anchor_fulfillment) {
    if (anchor.fulfilled_by.length === 0) {
      errors.push(`Anchor "${anchor.anchor}" is not fulfilled by any spot or activity`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export { getSeason };
