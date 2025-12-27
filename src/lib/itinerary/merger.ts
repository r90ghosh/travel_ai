import type {
  GeneratedItinerary,
  Comment,
  Modification,
  Trip,
  ItineraryDay,
  TimelineItem,
} from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface MergeResult {
  itinerary: GeneratedItinerary;
  modifications: Modification[];
  summary: string;
  addressedCommentIds: string[];
}

interface DifferentialOutput {
  modifications: {
    day_number: number;
    action: 'insert' | 'replace' | 'remove';
    index: number;
    item?: TimelineItem;
  }[];
  new_days: ItineraryDay[];
  updated_anchor_fulfillment?: GeneratedItinerary['anchor_fulfillment'];
  updated_warnings?: string[];
  updated_booking_reminders?: GeneratedItinerary['booking_reminders'];
}

/**
 * Merges differential AI output with base itinerary
 * Used when extending/modifying cached itineraries
 */
export function mergeItinerary(
  base: GeneratedItinerary,
  changes: DifferentialOutput,
  trip: Trip
): GeneratedItinerary {
  // Deep clone base
  const merged: GeneratedItinerary = JSON.parse(JSON.stringify(base));
  merged.trip_id = trip.id;
  merged.generated_at = new Date().toISOString();

  // Apply modifications to existing days
  for (const mod of changes.modifications || []) {
    const dayIndex = merged.days.findIndex(d => d.day_number === mod.day_number);
    if (dayIndex === -1) continue;

    const day = merged.days[dayIndex];

    switch (mod.action) {
      case 'insert':
        if (mod.item) {
          mod.item.id = mod.item.id || `day${mod.day_number}_${uuidv4().slice(0, 8)}`;
          day.timeline.splice(mod.index, 0, mod.item);
        }
        break;

      case 'replace':
        if (mod.item) {
          mod.item.id = mod.item.id || day.timeline[mod.index]?.id || `day${mod.day_number}_${uuidv4().slice(0, 8)}`;
          day.timeline[mod.index] = mod.item;
        }
        break;

      case 'remove':
        day.timeline.splice(mod.index, 1);
        break;
    }

    // Recalculate day stats
    merged.days[dayIndex].stats = calculateDayStats(day);
  }

  // Add new days
  if (changes.new_days?.length) {
    const startDate = new Date(trip.start_date);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (const newDay of changes.new_days) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + newDay.day_number - 1);

      newDay.date = date.toISOString().split('T')[0];
      newDay.day_of_week = days[date.getDay()];

      // Ensure all timeline items have IDs
      newDay.timeline = newDay.timeline.map((item, idx) => ({
        ...item,
        id: item.id || `day${newDay.day_number}_item${idx}`,
      }));

      merged.days.push(newDay);
    }

    // Sort days by day_number
    merged.days.sort((a, b) => a.day_number - b.day_number);
  }

  // Update anchor fulfillment if provided
  if (changes.updated_anchor_fulfillment) {
    merged.anchor_fulfillment = changes.updated_anchor_fulfillment;
  }

  // Merge warnings
  if (changes.updated_warnings) {
    merged.warnings = [...new Set([...merged.warnings, ...changes.updated_warnings])];
  }

  // Merge booking reminders
  if (changes.updated_booking_reminders) {
    const existingIds = new Set(merged.booking_reminders.map(r => r.item_id));
    for (const reminder of changes.updated_booking_reminders) {
      if (!existingIds.has(reminder.item_id)) {
        merged.booking_reminders.push(reminder);
      }
    }
  }

  // Recalculate summary
  merged.summary = calculateSummary(merged);

  return merged;
}

function calculateDayStats(day: ItineraryDay) {
  let drivingMinutes = 0;
  let drivingKm = 0;
  let spotsCount = 0;
  let activitiesCount = 0;

  for (const item of day.timeline) {
    if (item.type === 'drive') {
      drivingMinutes += item.duration_minutes;
      // TODO: Look up actual km from routes.json
      drivingKm += Math.round(item.duration_minutes * 1.2); // Rough estimate
    } else if (item.type === 'spot') {
      spotsCount++;
    } else if (item.type === 'activity') {
      activitiesCount++;
    }
  }

  return {
    driving_minutes: drivingMinutes,
    driving_km: drivingKm,
    spots_count: spotsCount,
    activities_count: activitiesCount,
  };
}

function calculateSummary(itinerary: GeneratedItinerary) {
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
    estimated_cost: { low: 3000, high: 5000, currency: 'USD' },
  };
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
