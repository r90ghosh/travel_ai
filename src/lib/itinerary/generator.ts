import Anthropic from '@anthropic-ai/sdk';
import { createClient, createClientWithClaimToken } from '@/lib/supabase/server';
import type { Trip, GeneratedItinerary, ItineraryVersion, ItinerarySummary, BudgetTier, EstimatedCost } from '@/types';
import { findBestCacheMatch } from './cache-matcher';
import { buildFullGenerationPrompt, buildDifferentialPrompt } from '@/lib/ai/prompts';
import { mergeItinerary } from './merger';
import { getActivityById } from '@/lib/data-hydrator';

// Budget rates per person per day by tier (USD)
const BUDGET_RATES: Record<BudgetTier, {
  accommodation: [number, number];
  meals: [number, number];
  activities: [number, number];
}> = {
  budget: { accommodation: [30, 50], meals: [25, 40], activities: [20, 50] },
  moderate: { accommodation: [70, 120], meals: [45, 70], activities: [40, 70] },
  comfort: { accommodation: [130, 200], meals: [70, 100], activities: [90, 125] },
  luxury: { accommodation: [220, 350], meals: [100, 150], activities: [145, 225] },
};

// Transport costs
const CAR_RENTAL_PER_DAY = { low: 80, high: 120 }; // USD per day
const FUEL_RATE_PER_KM = 0.25; // USD per km

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Extract JSON from AI response (handles markdown code blocks)
function extractJSON(text: string): string {
  // Try to find JSON in markdown code blocks
  const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    return jsonBlockMatch[1].trim();
  }

  // Try to find raw JSON (starts with { or [)
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }

  // Return as-is and let JSON.parse handle any errors
  return text.trim();
}

// Helper to create the appropriate Supabase client
async function getSupabaseClient(claimToken?: string) {
  if (claimToken) {
    return createClientWithClaimToken(claimToken);
  }
  return createClient();
}

function getSeason(startDate: string): 'summer' | 'winter' | 'shoulder' {
  const month = new Date(startDate).getMonth() + 1;
  if ([6, 7, 8].includes(month)) return 'summer';
  if ([11, 12, 1, 2, 3].includes(month)) return 'winter';
  return 'shoulder';
}

export async function generateItinerary(tripId: string, claimToken?: string): Promise<{
  itinerary: GeneratedItinerary;
  version: ItineraryVersion;
  source: 'cache_exact' | 'cache_differential' | 'full_generation';
}> {
  console.log('[Generator] Starting generation for trip:', tripId);
  const supabase = await getSupabaseClient(claimToken);

  // Get trip data
  console.log('[Generator] Fetching trip data...');
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  if (tripError || !trip) {
    console.error('[Generator] Trip not found:', tripError);
    throw new Error('Trip not found');
  }

  console.log('[Generator] Trip loaded:', trip.destination_slug, trip.duration_days, 'days');

  const season = getSeason(trip.start_date);
  console.log('[Generator] Season:', season);

  // Step 1: Check cache for similar itinerary
  console.log('[Generator] Checking cache for similar itinerary...');
  const cacheMatch = await findBestCacheMatch(trip as Trip);
  console.log('[Generator] Cache match:', cacheMatch ? `found (score: ${cacheMatch.match_score}, type: ${cacheMatch.match_type})` : 'none');

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
    const jsonText = extractJSON(contentBlock.text);
    console.log('[Generator] Differential generation response length:', jsonText.length);
    const aiOutput = JSON.parse(jsonText);
    itinerary = mergeItinerary(cacheMatch.cache_entry.itinerary_data, aiOutput, trip as Trip);
    sourceType = 'differential';
    baseCacheId = cacheMatch.cache_entry.id;

  } else {
    // Full generation
    console.log('[Generator] Full generation (no suitable cache match)');
    console.log('[Generator] Building prompt...');
    const prompt = buildFullGenerationPrompt(trip as Trip, season);
    console.log('[Generator] Prompt length:', prompt.length, 'chars');
    console.log('[Generator] === FULL PROMPT START ===');
    console.log(prompt);
    console.log('[Generator] === FULL PROMPT END ===');

    console.log('[Generator] Calling Claude API... (this may take 30-60 seconds)');
    const startTime = Date.now();
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000, // Increased for longer itineraries
      messages: [{ role: 'user', content: prompt }],
    });
    console.log('[Generator] Claude API response received in', (Date.now() - startTime) / 1000, 'seconds');
    console.log('[Generator] Stop reason:', response.stop_reason);
    console.log('[Generator] Usage:', response.usage);

    // Check if response was truncated
    if (response.stop_reason === 'max_tokens') {
      console.error('[Generator] Response was truncated due to max_tokens limit');
    }

    tokenCost = (response.usage.input_tokens + response.usage.output_tokens) / 1000 * 0.015;

    const contentBlock = response.content[0];
    if (contentBlock.type !== 'text') {
      throw new Error('Unexpected response type from AI');
    }
    const jsonText = extractJSON(contentBlock.text);
    console.log('[Generator] Full generation response length:', jsonText.length);
    try {
      itinerary = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('[Generator] JSON parse error:', parseError instanceof Error ? parseError.message : parseError);
      console.error('[Generator] First 500 chars:', jsonText.substring(0, 500));
      console.error('[Generator] Last 500 chars:', jsonText.substring(jsonText.length - 500));
      throw new Error('Failed to parse AI response as JSON - response may have been truncated');
    }
    itinerary.trip_id = tripId;
    itinerary.version = 1;
    itinerary.generated_at = new Date().toISOString();
    sourceType = 'base';
  }

  // Add summary if not present or recalculate with proper budget
  itinerary.summary = calculateSummary(itinerary, trip as Trip);

  // Step 2: Save to itinerary_versions
  console.log('[Generator] Saving itinerary version...');
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
    console.error('[Generator] Failed to save version:', versionError);
    throw new Error('Failed to save itinerary version: ' + versionError.message);
  }
  console.log('[Generator] Version saved:', version.id);

  // Step 3: Update trip with active version
  await supabase
    .from('trips')
    .update({ active_version: 1, regenerations_used: 1 })
    .eq('id', tripId);

  // Step 4: Cache this generation for future use
  await cacheItinerary(trip as Trip, itinerary, season, claimToken);

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
function calculateSummary(itinerary: GeneratedItinerary, trip: Trip): ItinerarySummary {
  let totalDrivingKm = 0;
  let totalDrivingMinutes = 0;
  const regions = new Set<string>();

  itinerary.days.forEach(day => {
    totalDrivingKm += day.stats.driving_km;
    totalDrivingMinutes += day.stats.driving_minutes;
    regions.add(day.region);
  });

  // Calculate budget
  const estimatedCost = calculateBudget(itinerary, trip, totalDrivingKm);

  return {
    total_destinations: regions.size,
    total_driving_km: totalDrivingKm,
    total_driving_hours: Math.round(totalDrivingMinutes / 60 * 10) / 10,
    accommodation_stops: itinerary.days.length,
    estimated_cost: estimatedCost,
  };
}

// Calculate budget based on itinerary, trip settings, and driving distance
function calculateBudget(itinerary: GeneratedItinerary, trip: Trip, totalDrivingKm: number): EstimatedCost {
  const { budget_tier, traveler_count, duration_days } = trip;
  const rates = BUDGET_RATES[budget_tier];

  // 1. Calculate accommodation costs (per person × days × travelers)
  const accommodationLow = rates.accommodation[0] * duration_days * traveler_count;
  const accommodationHigh = rates.accommodation[1] * duration_days * traveler_count;

  // 2. Calculate meal costs (per person × days × travelers)
  const mealsLow = rates.meals[0] * duration_days * traveler_count;
  const mealsHigh = rates.meals[1] * duration_days * traveler_count;

  // 3. Calculate activity costs from actual activities in itinerary
  let activitiesLow = 0;
  let activitiesHigh = 0;

  itinerary.days.forEach(day => {
    day.timeline.forEach(item => {
      if (item.activity_id) {
        const activity = getActivityById(item.activity_id);
        if (activity) {
          // Activity prices are per person, multiply by traveler count
          activitiesLow += activity.price_low_usd * traveler_count;
          activitiesHigh += activity.price_high_usd * traveler_count;
        }
      }
    });
  });

  // If no specific activities, use tier-based estimate
  if (activitiesLow === 0) {
    activitiesLow = rates.activities[0] * duration_days * traveler_count;
    activitiesHigh = rates.activities[1] * duration_days * traveler_count;
  }

  // 4. Calculate transport costs (car rental + fuel)
  // Car rental is typically per vehicle (1 car for group), not per person
  const carRentalLow = CAR_RENTAL_PER_DAY.low * duration_days;
  const carRentalHigh = CAR_RENTAL_PER_DAY.high * duration_days;
  const fuelCost = totalDrivingKm * FUEL_RATE_PER_KM;
  const transportLow = carRentalLow + fuelCost;
  const transportHigh = carRentalHigh + fuelCost;

  // 5. Calculate totals
  const totalLow = Math.round(accommodationLow + mealsLow + activitiesLow + transportLow);
  const totalHigh = Math.round(accommodationHigh + mealsHigh + activitiesHigh + transportHigh);

  // 6. Calculate expected budget (what user selected in form)
  // Using the daily ranges from BUDGET_OPTIONS in TripForm
  const expectedDailyRates: Record<BudgetTier, [number, number]> = {
    budget: [75, 140],
    moderate: [155, 260],
    comfort: [290, 425],
    luxury: [465, 725],
  };
  const expectedLow = expectedDailyRates[budget_tier][0] * duration_days * traveler_count;
  const expectedHigh = expectedDailyRates[budget_tier][1] * duration_days * traveler_count;

  // 7. Calculate variance (comparing mid-point of calculated vs expected high)
  const calculatedMid = (totalLow + totalHigh) / 2;
  const variancePercent = Math.round(((calculatedMid - expectedHigh) / expectedHigh) * 100);

  return {
    low: totalLow,
    high: totalHigh,
    currency: 'USD',
    breakdown: {
      accommodation: { low: Math.round(accommodationLow), high: Math.round(accommodationHigh) },
      meals: { low: Math.round(mealsLow), high: Math.round(mealsHigh) },
      activities: { low: Math.round(activitiesLow), high: Math.round(activitiesHigh) },
      transport: { low: Math.round(transportLow), high: Math.round(transportHigh) },
    },
    expected_low: expectedLow,
    expected_high: expectedHigh,
    variance_percent: variancePercent,
  };
}

// Cache the generated itinerary
async function cacheItinerary(trip: Trip, itinerary: GeneratedItinerary, season: string, claimToken?: string) {
  const supabase = await getSupabaseClient(claimToken);

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
