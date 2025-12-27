/**
 * Data Hydrator
 *
 * Hydrates timeline items with full data from JSON files.
 * Used to enrich the AI-generated itinerary with complete spot/activity/route details.
 */

import type {
  Spot,
  SpotLabels,
  Activity,
  ActivityLabels,
  RouteSegment,
  TimelineItem,
  HydratedTimelineItem,
  ItineraryDay,
  HydratedItineraryDay,
  GeneratedItinerary,
  HydratedItinerary,
} from '@/types';

// Import Iceland data (add more destinations as needed)
import spotsRaw from '@/data/iceland/spots.json';
import spotLabelsRaw from '@/data/iceland/spot_labels.json';
import activitiesRaw from '@/data/iceland/activities.json';
import activityLabelsRaw from '@/data/iceland/activity_labels.json';
import routesRaw from '@/data/iceland/routes.json';

// Raw types from JSON files (before normalization)
interface RawSpot {
  spot_id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  fulfills_anchors: string;
  duration_min_hrs: number;
  duration_max_hrs: number;
  cost: string;
  booking_required: boolean;
  description: string;
  why_this_spot: string;
  pro_tip: string;
  skip_if: string;
  best_time: string;
}

interface RawActivity {
  activity_id: string;
  name: string;
  near_spot_id: string | null;
  operator: string;
  duration_hrs: number;
  price_low_usd: number;
  price_high_usd: number;
  book_ahead_days: number;
  fulfills_anchors: string;
  description: string;
  why_recommended: string;
  what_to_wear: string;
  tips: string;
  booking_url: string | null;
}

interface RawRoute {
  segment_id: string;
  from_region: string;
  to_region: string;
  from_name: string;
  to_name: string;
  distance_km: number;
  drive_min: number;
  road_type: string;
  cell_coverage: string;
  gas_stations: string;
  hazards: string;
  notes: string;
}

interface RawSpotLabel {
  spot_id: string;
  physical_level: string;
  activity_type: string;
  experience_quality: string;
  best_for: string;
  iceland_factor: string;
  seasonality: string;
  timing_preference: string;
  weather_sensitivity: string;
}

interface RawActivityLabel {
  activity_id: string;
  physical_level: string;
  activity_type: string;
  experience_quality: string;
  best_for: string;
  iceland_factor: string;
  seasonality: string;
  weather_sensitivity: string;
}

// Normalize spot data from JSON format to Spot type
function normalizeSpot(raw: RawSpot): Spot {
  return {
    id: raw.spot_id,
    destination_slug: 'iceland',
    name: raw.name,
    region: raw.region,
    lat: raw.lat,
    lng: raw.lng,
    fulfills_anchors: raw.fulfills_anchors ? raw.fulfills_anchors.split(',').map(s => s.trim()).filter(Boolean) : [],
    duration_min_hrs: raw.duration_min_hrs,
    duration_max_hrs: raw.duration_max_hrs,
    cost: raw.cost,
    booking_required: raw.booking_required,
    description: raw.description,
    why_this_spot: raw.why_this_spot,
    pro_tip: raw.pro_tip,
    skip_if: raw.skip_if,
    best_time: raw.best_time,
    images: [],
  };
}

// Normalize activity data from JSON format to Activity type
function normalizeActivity(raw: RawActivity): Activity {
  return {
    id: raw.activity_id,
    destination_slug: 'iceland',
    name: raw.name,
    near_spot_id: raw.near_spot_id,
    operator: raw.operator,
    duration_hrs: raw.duration_hrs,
    price_low_usd: raw.price_low_usd,
    price_high_usd: raw.price_high_usd,
    book_ahead_days: raw.book_ahead_days,
    fulfills_anchors: raw.fulfills_anchors ? raw.fulfills_anchors.split(',').map(s => s.trim()).filter(Boolean) : [],
    description: raw.description,
    why_recommended: raw.why_recommended,
    what_to_wear: raw.what_to_wear,
    tips: raw.tips,
    booking_url: raw.booking_url,
    images: [],
  };
}

// Normalize route data from JSON format to RouteSegment type
function normalizeRoute(raw: RawRoute): RouteSegment {
  return {
    id: raw.segment_id,
    destination_slug: 'iceland',
    from_region: raw.from_region,
    to_region: raw.to_region,
    from_name: raw.from_name,
    to_name: raw.to_name,
    distance_km: raw.distance_km,
    drive_minutes: raw.drive_min,
    road_type: raw.road_type as RouteSegment['road_type'],
    cell_coverage: raw.cell_coverage as RouteSegment['cell_coverage'],
    gas_stations: raw.gas_stations,
    hazards: raw.hazards,
    notes: raw.notes,
  };
}

// Helper to parse comma-separated string into array
function parseCSV(value: string): string[] {
  return value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];
}

// Normalize spot label data
function normalizeSpotLabel(raw: RawSpotLabel): SpotLabels {
  return {
    spot_id: raw.spot_id,
    physical_level: raw.physical_level as SpotLabels['physical_level'],
    activity_types: parseCSV(raw.activity_type),
    experience_qualities: parseCSV(raw.experience_quality),
    best_for: parseCSV(raw.best_for),
    iceland_factor: raw.iceland_factor as SpotLabels['iceland_factor'],
    seasonality: raw.seasonality as SpotLabels['seasonality'],
    timing_preferences: parseCSV(raw.timing_preference),
    weather_sensitivity: raw.weather_sensitivity as SpotLabels['weather_sensitivity'],
  };
}

// Normalize activity label data
function normalizeActivityLabel(raw: RawActivityLabel): ActivityLabels {
  return {
    activity_id: raw.activity_id,
    physical_level: raw.physical_level as ActivityLabels['physical_level'],
    activity_types: parseCSV(raw.activity_type),
    experience_qualities: parseCSV(raw.experience_quality),
    best_for: parseCSV(raw.best_for),
    iceland_factor: raw.iceland_factor as ActivityLabels['iceland_factor'],
    seasonality: raw.seasonality as ActivityLabels['seasonality'],
    weather_sensitivity: raw.weather_sensitivity as ActivityLabels['weather_sensitivity'],
  };
}

// Normalized data
const typedSpots: Spot[] = (spotsRaw as RawSpot[]).map(normalizeSpot);
const typedSpotLabels: SpotLabels[] = (spotLabelsRaw as RawSpotLabel[]).map(normalizeSpotLabel);
const typedActivities: Activity[] = (activitiesRaw as RawActivity[]).map(normalizeActivity);
const typedActivityLabels: ActivityLabels[] = (activityLabelsRaw as RawActivityLabel[]).map(normalizeActivityLabel);
const typedRoutes: RouteSegment[] = (routesRaw as RawRoute[]).map(normalizeRoute);

/**
 * Get a spot by ID with its labels
 */
export function getSpotById(spotId: string): (Spot & { labels?: SpotLabels }) | null {
  const spot = typedSpots.find((s) => s.id === spotId);
  if (!spot) return null;

  const labels = typedSpotLabels.find((l) => l.spot_id === spotId);
  return { ...spot, labels: labels || undefined };
}

/**
 * Get an activity by ID with its labels
 */
export function getActivityById(activityId: string): (Activity & { labels?: ActivityLabels }) | null {
  const activity = typedActivities.find((a) => a.id === activityId);
  if (!activity) return null;

  const labels = typedActivityLabels.find((l) => l.activity_id === activityId);
  return { ...activity, labels: labels || undefined };
}

/**
 * Get a route segment by ID
 */
export function getRouteById(routeId: string): RouteSegment | null {
  return typedRoutes.find((r) => r.id === routeId) || null;
}

/**
 * Find a route between two spots
 */
export function findRouteBetween(fromSpotId: string, toSpotId: string): RouteSegment | null {
  const fromSpot = typedSpots.find((s) => s.id === fromSpotId);
  const toSpot = typedSpots.find((s) => s.id === toSpotId);

  if (!fromSpot || !toSpot) return null;

  // Try to find a direct route between regions
  return typedRoutes.find(
    (r) =>
      (r.from_region === fromSpot.region && r.to_region === toSpot.region) ||
      (r.from_region === toSpot.region && r.to_region === fromSpot.region)
  ) || null;
}

/**
 * Hydrate a single timeline item with full data
 */
export function hydrateTimelineItem(item: TimelineItem): HydratedTimelineItem {
  const hydrated: HydratedTimelineItem = { ...item };

  if (item.spot_id) {
    const spot = getSpotById(item.spot_id);
    if (spot) hydrated.spot = spot;
  }

  if (item.activity_id) {
    const activity = getActivityById(item.activity_id);
    if (activity) hydrated.activity = activity;
  }

  if (item.route_id) {
    const route = getRouteById(item.route_id);
    if (route) hydrated.route = route;
  }

  return hydrated;
}

/**
 * Hydrate a full day with all timeline items
 */
export function hydrateDay(day: ItineraryDay): HydratedItineraryDay {
  return {
    ...day,
    timeline: day.timeline.map(hydrateTimelineItem),
  };
}

/**
 * Hydrate a complete itinerary
 */
export function hydrateItinerary(itinerary: GeneratedItinerary): HydratedItinerary {
  return {
    ...itinerary,
    days: itinerary.days.map(hydrateDay),
  };
}

/**
 * Get all spots for a destination
 */
export function getAllSpots(): Spot[] {
  return typedSpots;
}

/**
 * Get all activities for a destination
 */
export function getAllActivities(): Activity[] {
  return typedActivities;
}

/**
 * Get spots by region
 */
export function getSpotsByRegion(region: string): Spot[] {
  return typedSpots.filter((s) => s.region === region);
}

/**
 * Get spots that fulfill specific anchors
 */
export function getSpotsByAnchors(anchors: string[]): Spot[] {
  return typedSpots.filter((s) =>
    s.fulfills_anchors.some((anchor) => anchors.includes(anchor))
  );
}

/**
 * Get activities that fulfill specific anchors
 */
export function getActivitiesByAnchors(anchors: string[]): Activity[] {
  return typedActivities.filter((a) =>
    a.fulfills_anchors.some((anchor) => anchors.includes(anchor))
  );
}
