import type {
  ItineraryCache,
  CacheMatchResult,
  GenerationTask,
  TripFormData,
  PacingType,
} from '@/types';

/**
 * Finds the best matching cached itinerary for a trip request
 * Returns match score and required generation tasks
 */
export async function findCacheMatch(
  request: TripFormData,
  season: string
): Promise<CacheMatchResult | null> {
  // TODO: Query itinerary_cache table with filters
  // TODO: Score potential matches
  // TODO: Return best match with generation tasks

  return null;
}

/**
 * Calculates how well a cached itinerary matches a request
 */
export function calculateMatchScore(
  cache: ItineraryCache,
  request: TripFormData,
  season: string
): number {
  let score = 0;
  const maxScore = 100;

  // Duration match (up to 30 points)
  const durationDiff = Math.abs(cache.duration_days - getDurationDays(request));
  if (durationDiff === 0) score += 30;
  else if (durationDiff === 1) score += 20;
  else if (durationDiff === 2) score += 10;

  // Pacing match (up to 20 points)
  if (cache.pacing === request.pacing) score += 20;
  else if (isAdjacentPacing(cache.pacing, request.pacing)) score += 10;

  // Anchor match (up to 30 points)
  const anchorOverlap = calculateAnchorOverlap(cache.anchors, request.anchors);
  score += Math.round(anchorOverlap * 30);

  // Season match (up to 20 points)
  if (cache.season === season) score += 20;
  else if (isAdjacentSeason(cache.season, season)) score += 10;

  return Math.round((score / maxScore) * 100);
}

/**
 * Determines what generation tasks are needed to adapt a cached itinerary
 */
export function determineGenerationTasks(
  cache: ItineraryCache,
  request: TripFormData
): GenerationTask[] {
  const tasks: GenerationTask[] = [];
  const requestDays = getDurationDays(request);

  // Check if we need to extend/shorten days
  if (cache.duration_days < requestDays) {
    tasks.push({
      type: 'extend_days',
      details: {
        current_days: cache.duration_days,
        target_days: requestDays,
        days_to_add: requestDays - cache.duration_days,
      },
    });
  }

  // Check if new anchors need to be added
  const missingAnchors = request.anchors.filter(
    (a) => !cache.anchors.includes(a)
  );
  if (missingAnchors.length > 0) {
    tasks.push({
      type: 'add_anchor',
      details: {
        missing_anchors: missingAnchors,
      },
    });
  }

  // Check if pacing adjustment is needed
  if (cache.pacing !== request.pacing) {
    tasks.push({
      type: 'adjust_pacing',
      details: {
        current_pacing: cache.pacing,
        target_pacing: request.pacing,
      },
    });
  }

  return tasks;
}

/**
 * Calculate duration in days from request dates
 */
function getDurationDays(request: TripFormData): number {
  const start = new Date(request.start_date);
  const end = new Date(request.end_date);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Check if two pacing levels are adjacent
 */
function isAdjacentPacing(a: PacingType, b: PacingType): boolean {
  const order: PacingType[] = ['relaxed', 'balanced', 'packed'];
  const indexA = order.indexOf(a);
  const indexB = order.indexOf(b);
  return Math.abs(indexA - indexB) === 1;
}

/**
 * Calculate anchor overlap percentage
 */
function calculateAnchorOverlap(cached: string[], requested: string[]): number {
  if (requested.length === 0) return 1;
  const overlap = requested.filter((a) => cached.includes(a)).length;
  return overlap / requested.length;
}

/**
 * Check if two seasons are adjacent
 */
function isAdjacentSeason(a: string, b: string): boolean {
  const seasons = ['winter', 'spring', 'summer', 'fall'];
  const indexA = seasons.indexOf(a);
  const indexB = seasons.indexOf(b);
  return Math.abs(indexA - indexB) === 1 || (indexA === 0 && indexB === 3) || (indexA === 3 && indexB === 0);
}

/**
 * Get season from a date
 */
export function getSeasonFromDate(date: string): string {
  const month = new Date(date).getMonth() + 1;
  if (month >= 5 && month <= 8) return 'summer';
  if (month >= 9 && month <= 10) return 'fall';
  if (month >= 11 || month <= 2) return 'winter';
  return 'spring';
}
