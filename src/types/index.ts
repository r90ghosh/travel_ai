// Core Types for Travel AI App

export type TravelerType = "solo" | "couple" | "friends" | "family" | "multi-gen";
export type PacingType = "relaxed" | "balanced" | "packed";
export type BudgetTier = "budget" | "moderate" | "comfort" | "luxury";
export type TripStatus = "active" | "completed" | "archived";
export type CollaboratorRole = "owner" | "editor" | "commenter" | "viewer";
export type CollaboratorStatus = "pending" | "accepted" | "declined";
export type CommentStatus = "pending" | "addressed" | "resolved" | "deleted";
export type CommentTargetType = "day" | "spot" | "drive" | "meal" | "tour" | "general";
export type TimelineItemType = "arrival" | "spot" | "drive" | "meal" | "tour" | "accommodation" | "departure";
export type ItinerarySourceType = "base" | "similar" | "hybrid" | "regeneration" | "cherry_pick";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: "free" | "trip_pass" | "unlimited";
  plan_expires_at?: Date;
}

export interface Trip {
  id: string;
  created_by: string;
  destination_slug: string;
  start_date: Date;
  end_date: Date;
  duration_days: number;
  travelers: {
    type: TravelerType;
    count?: number;
  };
  pacing: PacingType;
  anchors: string[];
  budget_tier: BudgetTier;
  active_version: number;
  status: TripStatus;
  regenerations_used: number;
}

export interface Itinerary {
  id: string;
  trip_id: string;
  version: number;
  metadata: ItineraryMetadata;
  summary: ItinerarySummary;
  days: Day[];
}

export interface ItineraryMetadata {
  destination: string;
  start_date: Date;
  end_date: Date;
  duration: number;
  travelers: TravelerType;
  pacing: PacingType;
  anchors: string[];
  budget_tier: BudgetTier;
  generated_at: Date;
  based_on_itinerary_id?: string;
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
  anchors_covered: {
    anchor: string;
    covered_on: string[];
    notes: string;
  }[];
}

export interface Day {
  day_number: number;
  date: Date;
  day_of_week: string;
  title: string;
  region: string;
  stats: DayStats;
  timeline: TimelineItem[];
  accommodation: Accommodation;
  weather?: Weather;
}

export interface DayStats {
  driving_minutes: number;
  driving_km: number;
  major_stops: number;
  overnight_area: string;
}

export interface TimelineItem {
  id: string;
  type: TimelineItemType;
  start_time: string;
  end_time?: string;
  spot?: Spot;
  drive?: Drive;
  meal?: Meal;
  tour?: Tour;
}

export interface Spot {
  name: string;
  location: string;
  coordinates: [number, number];
  duration: string;
  cost: string;
  images: string[];
  what_youll_experience: string;
  why_this_spot: string[];
  pro_tip: string;
  skip_if?: string;
  labels: SpotLabels;
  similar?: SimilarOptions;
}

export interface SpotLabels {
  experience: string[];
  activity_type: string[];
  physical: "easy" | "moderate" | "challenging";
  best_for: string[];
  sensory: string[];
  iceland_factor: string;
}

export interface SimilarOptions {
  if_less_physical?: string[];
  if_more_adventure?: string[];
  same_vibes?: string[];
}

export interface Drive {
  from: string;
  to: string;
  duration_minutes: number;
  distance_km: number;
  route: string;
  cell_coverage: string;
  gas_stations: string[];
  notes?: string;
}

export interface Meal {
  type: "breakfast" | "lunch" | "dinner";
  suggestion: string;
  location: string;
  price_range: string;
  notes?: string;
}

export interface Tour {
  name: string;
  operator: string;
  duration: string;
  price: string;
  booking_url: string;
  why_recommended: string;
  what_to_wear: string;
  tips: string;
  labels: SpotLabels;
}

export interface Accommodation {
  recommended: {
    name: string;
    area: string;
    price_per_night: string;
    rating: number;
    why_this_location: string;
    booking_url: string;
  };
  alternatives: {
    budget: AccommodationOption;
    moderate: AccommodationOption;
    comfort: AccommodationOption;
  };
}

export interface AccommodationOption {
  name: string;
  price: string;
  notes: string;
}

export interface Weather {
  high: number;
  low: number;
  condition: string;
  sunrise: string;
  sunset: string;
}

export interface Collaborator {
  id: string;
  trip_id: string;
  user_id?: string;
  email: string;
  name?: string;
  role: CollaboratorRole;
  status: CollaboratorStatus;
  invited_by: string;
}

export interface Comment {
  id: string;
  trip_id: string;
  version_at_creation: number;
  user_id: string;
  target_type: CommentTargetType;
  target_id: string;
  selection_field?: string;
  selection_start?: number;
  selection_end?: number;
  selected_text?: string;
  content: string;
  parent_id?: string;
  thread_id?: string;
  intent?: CommentIntent;
  conflicts_with?: string[];
  status: CommentStatus;
  addressed_in_version?: number;
  created_at: Date;
}

export interface CommentIntent {
  action: "add" | "remove" | "extend" | "shorten" | "swap" | "question" | "general";
  confidence: number;
  details: string;
  classified_by: "client" | "ai";
}

export interface ItineraryVersion {
  id: string;
  trip_id: string;
  version: number;
  data: Itinerary;
  source_type: ItinerarySourceType;
  parent_version?: number;
  modifications?: Modification[];
  modification_summary?: string;
  source_comment_ids?: string[];
  cherry_picked_from?: Record<string, number>;
  generation_cost?: number;
  created_by: string;
  created_at: Date;
}

export interface Modification {
  type: "add" | "remove" | "extend" | "shorten" | "swap" | "reorder";
  target: string;
  description: string;
  reason: string;
}
