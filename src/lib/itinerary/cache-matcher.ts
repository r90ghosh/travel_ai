import { createClient } from '@/lib/supabase/server';
import type { Trip, ItineraryCache, CacheMatchResult, GenerationTask } from '@/types';

// Calculate Jaccard similarity between two arrays
function jaccardSimilarity(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

// Determine season from dates
function getSeason(startDate: string): 'summer' | 'winter' | 'shoulder' {
  const month = new Date(startDate).getMonth() + 1;
  if ([6, 7, 8].includes(month)) return 'summer';
  if ([11, 12, 1, 2, 3].includes(month)) return 'winter';
  return 'shoulder';
}

// Get duration bucket (exported for use elsewhere)
export function getDurationBucket(days: number): string {
  if (days <= 5) return '3-5';
  if (days <= 8) return '6-8';
  if (days <= 11) return '9-11';
  if (days <= 14) return '12-14';
  return '15+';
}

export async function findBestCacheMatch(trip: Trip): Promise<CacheMatchResult | null> {
  const supabase = await createClient();
  const season = getSeason(trip.start_date);

  // Query potential matches - same destination, compatible pacing
  const { data: candidates, error } = await supabase
    .from('itinerary_cache')
    .select('*')
    .eq('destination_slug', trip.destination_slug)
    .eq('season', season)
    .lte('duration_days', trip.duration_days + 3) // Allow some flexibility
    .gte('duration_days', Math.max(3, trip.duration_days - 7)) // Can extend, harder to shrink
    .order('quality_score', { ascending: false })
    .limit(20);

  if (error || !candidates?.length) return null;

  // Score each candidate
  const scored = candidates.map(candidate => {
    let score = 0;
    const tasks: GenerationTask[] = [];

    // Pacing match (exact = 30 points, adjacent = 15 points)
    if (candidate.pacing === trip.pacing) {
      score += 30;
    } else if (
      (candidate.pacing === 'relaxed' && trip.pacing === 'balanced') ||
      (candidate.pacing === 'balanced' && trip.pacing === 'packed')
    ) {
      score += 15;
      tasks.push({ type: 'adjust_pacing', details: { from: candidate.pacing, to: trip.pacing } });
    }

    // Anchor similarity (up to 40 points)
    const anchorSimilarity = jaccardSimilarity(candidate.anchors, trip.anchors);
    score += Math.round(anchorSimilarity * 40);

    // Find missing anchors
    const missingAnchors = trip.anchors.filter(a => !candidate.anchors.includes(a));
    if (missingAnchors.length > 0) {
      tasks.push({ type: 'add_anchor', details: { anchors: missingAnchors } });
    }

    // Duration match (up to 20 points)
    const durationDiff = Math.abs(candidate.duration_days - trip.duration_days);
    if (durationDiff === 0) {
      score += 20;
    } else if (durationDiff <= 2) {
      score += 15;
    } else if (durationDiff <= 5) {
      score += 10;
    }

    // Need to extend?
    if (candidate.duration_days < trip.duration_days) {
      tasks.push({
        type: 'extend_days',
        details: {
          from_days: candidate.duration_days,
          to_days: trip.duration_days,
          add_days: trip.duration_days - candidate.duration_days,
        },
      });
    }

    // Traveler type bonus (10 points if same)
    if (candidate.traveler_type === trip.travelers) {
      score += 10;
    }

    // Determine match type
    let matchType: CacheMatchResult['match_type'];
    if (score >= 90 && tasks.length === 0) {
      matchType = 'exact';
    } else if (tasks.some(t => t.type === 'extend_days')) {
      matchType = 'extend';
    } else if (tasks.some(t => t.type === 'add_anchor')) {
      matchType = 'anchor_diff';
    } else {
      matchType = 'partial';
    }

    return {
      cache_entry: candidate as ItineraryCache,
      match_score: score,
      match_type: matchType,
      generation_tasks: tasks,
    };
  });

  // Sort by score and return best match if above threshold
  scored.sort((a, b) => b.match_score - a.match_score);
  const best = scored[0];

  // Only use cache if score is above 50 (otherwise generate fresh)
  if (best.match_score >= 50) {
    return best;
  }

  return null;
}
