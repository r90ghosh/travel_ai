import { createClient } from '@/lib/supabase/server';
import type { GeneratedItinerary, ItineraryVersion, ItineraryDay } from '@/types';

/**
 * Cherry-pick days from different versions to create a new version
 * Validates routing continuity between days
 */
export async function cherryPickVersions(
  tripId: string,
  daySelections: Record<number, number>, // { dayNumber: versionNumber }
  userId: string
): Promise<ItineraryVersion> {
  const supabase = await createClient();

  // Get trip
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  if (tripError || !trip) {
    throw new Error('Trip not found');
  }

  // Get all referenced versions
  const versionNumbers = [...new Set(Object.values(daySelections))];
  const { data: versions, error: versionsError } = await supabase
    .from('itinerary_versions')
    .select('*')
    .eq('trip_id', tripId)
    .in('version', versionNumbers);

  if (versionsError || !versions) {
    throw new Error('Failed to fetch versions');
  }

  // Also get current version for fallback days
  const { data: currentVersion, error: currentError } = await supabase
    .from('itinerary_versions')
    .select('*')
    .eq('trip_id', tripId)
    .eq('version', trip.active_version)
    .single();

  if (currentError || !currentVersion) {
    throw new Error('Current version not found');
  }

  const currentItinerary = currentVersion.data as GeneratedItinerary;
  const versionMap = new Map(versions.map((v) => [v.version, v.data as GeneratedItinerary]));

  // Build cherry-picked days
  const cherryPickedDays: ItineraryDay[] = [];
  const usedVersions = new Set<number>();

  for (let dayNum = 1; dayNum <= currentItinerary.days.length; dayNum++) {
    let sourceDay: ItineraryDay | undefined;
    let sourceVersion: number;

    if (daySelections[dayNum]) {
      // Use selected version for this day
      sourceVersion = daySelections[dayNum];
      const versionItinerary = versionMap.get(sourceVersion);
      sourceDay = versionItinerary?.days.find((d) => d.day_number === dayNum);
      usedVersions.add(sourceVersion);
    } else {
      // Use current version as fallback
      sourceVersion = trip.active_version;
      sourceDay = currentItinerary.days.find((d) => d.day_number === dayNum);
    }

    if (!sourceDay) {
      throw new Error('Day ' + dayNum + ' not found in version ' + sourceVersion);
    }

    cherryPickedDays.push({ ...sourceDay });
  }

  // Validate routing continuity
  const routingIssues = validateRouting(cherryPickedDays);
  if (routingIssues.length > 0) {
    // Log warnings but don't block - let user proceed
    console.warn('Routing continuity issues:', routingIssues);
  }

  // Build new itinerary
  const newItinerary: GeneratedItinerary = {
    ...currentItinerary,
    days: cherryPickedDays,
    generated_at: new Date().toISOString(),
  };

  // Generate modification summary
  const summaryParts: string[] = [];
  for (const [dayNum, version] of Object.entries(daySelections)) {
    summaryParts.push('Day ' + dayNum + ' from v' + version);
  }
  const modificationSummary = 'Cherry-picked: ' + summaryParts.join(', ');

  // Save new version
  const nextVersion = trip.active_version + 1;
  const { data: savedVersion, error: saveError } = await supabase
    .from('itinerary_versions')
    .insert({
      trip_id: tripId,
      version: nextVersion,
      data: newItinerary,
      source_type: 'cherry_pick',
      parent_version: trip.active_version,
      modification_summary: modificationSummary,
      created_by: userId,
      source_versions: Array.from(usedVersions),
    })
    .select()
    .single();

  if (saveError) {
    throw new Error('Failed to save cherry-picked version');
  }

  // Update trip active version
  const { error: updateError } = await supabase
    .from('trips')
    .update({ active_version: nextVersion })
    .eq('id', tripId);

  if (updateError) {
    throw new Error('Failed to update trip');
  }

  return savedVersion;
}

interface RoutingIssue {
  type: 'gap' | 'time_mismatch';
  dayNumber: number;
  description: string;
}

/**
 * Validate that days connect properly for routing
 * Simplified validation based on time continuity
 */
function validateRouting(days: ItineraryDay[]): RoutingIssue[] {
  const issues: RoutingIssue[] = [];

  for (let i = 0; i < days.length - 1; i++) {
    const currentDay = days[i];
    const nextDay = days[i + 1];

    // Get last and first items of consecutive days
    const lastItem = currentDay.timeline[currentDay.timeline.length - 1];
    const firstItem = nextDay.timeline[0];

    if (!lastItem || !firstItem) continue;

    // Check for time continuity
    if (lastItem.end_time && firstItem.time) {
      const lastEnd = parseTime(lastItem.end_time);
      const firstStart = parseTime(firstItem.time);

      // Flag if overnight transition seems problematic
      if (lastEnd > 22 && firstStart < 7) {
        issues.push({
          type: 'time_mismatch',
          dayNumber: nextDay.day_number,
          description: 'Day ' + currentDay.day_number + ' ends late but Day ' + nextDay.day_number + ' starts early',
        });
      }
    }
  }

  return issues;
}

/**
 * Parse time string to hour number
 */
function parseTime(timeStr: string): number {
  const match = timeStr.match(/(\d+):(\d+)/);
  if (!match) return 12;
  return parseInt(match[1], 10);
}
