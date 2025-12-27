// ============================================================================
// Core Types for Travel AI App
// ============================================================================

// Enum Types
export type TravelerType = 'solo' | 'couple' | 'friends' | 'family' | 'multi_gen';
export type PacingType = 'relaxed' | 'balanced' | 'packed';
export type BudgetTier = 'budget' | 'moderate' | 'comfort' | 'luxury';
export type TripStatus = 'active' | 'completed' | 'archived';
export type CollaboratorRole = 'owner' | 'editor' | 'commenter' | 'viewer';
export type CollaboratorStatus = 'pending' | 'accepted' | 'declined';
export type CommentStatus = 'pending' | 'addressed' | 'resolved' | 'deleted';
export type CommentTargetType = 'day' | 'spot' | 'drive' | 'meal' | 'activity' | 'general' | 'trip';
export type TimelineItemType = 'spot' | 'drive' | 'meal' | 'activity' | 'accommodation' | 'free_time';
export type ItinerarySourceType = 'base' | 'similar' | 'differential' | 'regeneration' | 'cherry_pick';
export type MealType = 'breakfast' | 'lunch' | 'dinner';
export type CommentAction = 'remove' | 'add' | 'extend' | 'shorten' | 'swap' | 'move' | 'question' | 'preference' | 'unclear';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type CacheMatchType = 'exact' | 'extend' | 'partial' | 'anchor_diff';
export type GenerationTaskType = 'extend_days' | 'add_anchor' | 'adjust_pacing' | 'full_generate';

// ============================================================================
// User & Auth
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  plan: 'free' | 'trip_pass' | 'unlimited';
  plan_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Trip
// ============================================================================

export interface Trip {
  id: string;
  created_by: string | null;
  claim_token: string | null;
  destination_slug: string;
  title: string | null;
  start_date: string;
  end_date: string;
  duration_days: number;
  travelers: TravelerType;
  traveler_count: number;
  pacing: PacingType;
  anchors: string[];
  budget_tier: BudgetTier;
  active_version: number;
  status: TripStatus;
  regenerations_used: number;
  created_at: string;
  updated_at: string;
}

export interface TripFormData {
  destination_slug: string;
  start_date: string;
  end_date: string;
  travelers: TravelerType;
  traveler_count: number;
  pacing: PacingType;
  anchors: string[];
  budget_tier: BudgetTier;
}

// ============================================================================
// Itinerary Version
// ============================================================================

export interface ItineraryVersion {
  id: string;
  trip_id: string;
  version: number;
  data: GeneratedItinerary;
  source_type: ItinerarySourceType;
  base_itinerary_id: string | null;
  parent_version: number | null;
  modifications: Modification[];
  modification_summary: string | null;
  source_comment_ids: string[];
  generation_cost: number | null;
  created_by: string | null;
  created_at: string;
}

export interface Modification {
  type: 'add' | 'remove' | 'extend' | 'shorten' | 'swap' | 'move' | 'reorder';
  target_type: CommentTargetType;
  target_id: string;
  description: string;
  reason: string;
}

// ============================================================================
// Generated Itinerary
// ============================================================================

export interface GeneratedItinerary {
  trip_id: string;
  version: number;
  generated_at: string;
  summary: ItinerarySummary;
  anchor_fulfillment: AnchorFulfillment[];
  days: ItineraryDay[];
  warnings: string[];
  booking_reminders: BookingReminder[];
}

export interface ItinerarySummary {
  total_destinations: number;
  total_driving_km: number;
  total_driving_hours: number;
  accommodation_stops: number;
  estimated_cost: {
    low: number;
    high: number;
    currency: string;
  };
}

export interface AnchorFulfillment {
  anchor: string;
  fulfilled_by: AnchorReference[];
  backup: AnchorReference[];
}

export interface AnchorReference {
  type: 'spot' | 'activity';
  id: string;
  day: number;
}

export interface BookingReminder {
  item_id: string;
  message: string;
  days_ahead: number;
}

// ============================================================================
// Itinerary Day & Timeline
// ============================================================================

export interface ItineraryDay {
  day_number: number;
  date: string;
  day_of_week: string;
  title: string;
  region: string;
  stats: DayStats;
  timeline: TimelineItem[];
  accommodation: DayAccommodation;
}

export interface DayStats {
  driving_minutes: number;
  driving_km: number;
  spots_count: number;
  activities_count: number;
}

export interface DayAccommodation {
  area: string;
  suggestion: string | null;
}

export interface TimelineItem {
  id: string;
  time: string;
  end_time: string | null;
  type: TimelineItemType;
  duration_minutes: number;

  // References to data (AI outputs these IDs, we hydrate from JSON)
  spot_id?: string;
  activity_id?: string;
  route_id?: string;

  // For meals
  meal_type?: MealType;
  meal_suggestion?: string;

  // For free time
  free_time_suggestion?: string;

  notes?: string;
}

// ============================================================================
// Comments
// ============================================================================

export interface Comment {
  id: string;
  trip_id: string;
  version_at_creation: number;
  user_id: string;
  user_email?: string; // Enriched from join
  target_type: CommentTargetType;
  target_id: string | null;
  selection_field: string | null;
  selection_start: number | null;
  selection_end: number | null;
  selected_text: string | null;
  content: string;
  parent_id: string | null;
  thread_id: string | null;
  intent: CommentIntent | null;
  conflicts_with: string[];
  status: CommentStatus;
  addressed_in_version: number | null;
  created_at: string;
  updated_at: string;
}

export interface CommentIntent {
  action: CommentAction;
  confidence: ConfidenceLevel;
  details: string;
  affects_routing: boolean;
  estimated_time_impact_minutes: number | null;
  suggested_resolution: string | null;
}

export interface CommentThread {
  root: Comment;
  replies: Comment[];
}

// ============================================================================
// Collaborators
// ============================================================================

export interface Collaborator {
  id: string;
  trip_id: string;
  user_id: string | null;
  email: string;
  name: string | null;
  role: CollaboratorRole;
  status: CollaboratorStatus;
  invited_by: string | null;
  invited_at: string;
  accepted_at: string | null;
}

// ============================================================================
// Itinerary Cache
// ============================================================================

export interface ItineraryCache {
  id: string;
  destination_slug: string;
  duration_days: number;
  duration_bucket: string;
  pacing: PacingType;
  anchors: string[];
  anchors_key: string;
  season: string;
  traveler_type: TravelerType;
  regions_covered: string[];
  spot_ids: string[];
  activity_ids: string[];
  total_driving_minutes: number;
  itinerary_data: GeneratedItinerary;
  quality_score: number;
  times_used: number;
  created_at: string;
}

export interface CacheMatchResult {
  cache_entry: ItineraryCache;
  match_score: number;
  match_type: CacheMatchType;
  generation_tasks: GenerationTask[];
}

export interface GenerationTask {
  type: GenerationTaskType;
  details: Record<string, unknown>;
}

// ============================================================================
// Destination Data Types (from JSON files)
// ============================================================================

export interface Destination {
  slug: string;
  name: string;
  country: string;
  config: DestinationConfig;
}

export interface DestinationConfig {
  regions: string[];
  anchors: string[];
  pacing: Record<PacingType, { max_stops: number; max_drive_hrs: number }>;
  seasonality: {
    summer_months: number[];
    winter_months: number[];
    midnight_sun_months: number[];
    northern_lights_months: number[];
    puffin_months: number[];
    ice_caves_months: number[];
  };
  blocked_combos: { anchor: string; months: number[]; reason: string }[];
  warnings: { anchor: string; months: number[]; reason: string; context?: string }[];
}

export interface Spot {
  id: string;
  destination_slug: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  fulfills_anchors: string[];
  duration_min_hrs: number;
  duration_max_hrs: number;
  cost: string;
  booking_required: boolean;
  description: string;
  why_this_spot: string;
  pro_tip: string;
  skip_if: string;
  best_time: string;
  images: string[];
}

export interface SpotLabels {
  spot_id: string;
  physical_level: 'easy' | 'moderate' | 'challenging' | 'strenuous';
  activity_types: string[];
  experience_qualities: string[];
  best_for: string[];
  iceland_factor: 'only_here' | 'world_class' | 'iconic_iceland' | 'local_character' | 'scenic_filler';
  seasonality: 'year_round' | 'summer_only' | 'winter_only';
  timing_preferences: string[];
  weather_sensitivity: 'weather_critical' | 'weather_resistant' | 'weather_enhanced' | 'indoor';
}

export interface SpotRelationship {
  spot_id: string;
  less_physical: string[];
  more_adventure: string[];
  same_vibes: string[];
  notes: string;
}

export interface Activity {
  id: string;
  destination_slug: string;
  name: string;
  near_spot_id: string | null;
  operator: string;
  duration_hrs: number;
  price_low_usd: number;
  price_high_usd: number;
  book_ahead_days: number;
  fulfills_anchors: string[];
  description: string;
  why_recommended: string;
  what_to_wear: string;
  tips: string;
  booking_url: string | null;
  images: string[];
}

export interface ActivityLabels {
  activity_id: string;
  physical_level: 'easy' | 'moderate' | 'challenging' | 'strenuous';
  activity_types: string[];
  experience_qualities: string[];
  best_for: string[];
  iceland_factor: 'only_here' | 'world_class' | 'iconic_iceland' | 'local_character' | 'scenic_filler';
  seasonality: 'year_round' | 'summer_only' | 'winter_only';
  weather_sensitivity: 'weather_critical' | 'weather_resistant' | 'weather_enhanced' | 'indoor';
}

export interface RouteSegment {
  id: string;
  destination_slug: string;
  from_region: string;
  to_region: string;
  from_name: string;
  to_name: string;
  distance_km: number;
  drive_minutes: number;
  road_type: 'paved' | 'gravel' | 'f_road' | 'mixed';
  cell_coverage: 'good' | 'spotty' | 'none';
  gas_stations: string;
  hazards: string;
  notes: string;
}

// ============================================================================
// Taxonomy Types
// ============================================================================

export interface Taxonomy {
  activity_types: TaxonomyItem[];
  experience_qualities: TaxonomyItem[];
  best_for: TaxonomyItem[];
  physical_levels: TaxonomyItem[];
  iceland_factors: TaxonomyItem[];
}

export interface TaxonomyItem {
  id: string;
  label: string;
  description: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

// ============================================================================
// Hydrated Types (for UI - combines timeline items with full data)
// ============================================================================

export interface HydratedTimelineItem extends TimelineItem {
  spot?: Spot & { labels?: SpotLabels };
  activity?: Activity & { labels?: ActivityLabels };
  route?: RouteSegment;
}

export interface HydratedItineraryDay extends Omit<ItineraryDay, 'timeline'> {
  timeline: HydratedTimelineItem[];
}

export interface HydratedItinerary extends Omit<GeneratedItinerary, 'days'> {
  days: HydratedItineraryDay[];
}
