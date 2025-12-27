/**
 * Image utility for fetching spot/activity images
 * Uses Unsplash API via our proxy route for real destination photos
 * Falls back to Lorem Picsum if API is unavailable
 */

/**
 * Generate a fallback image URL (used while loading or on error)
 */
export function getFallbackImageUrl(name: string, type: 'spot' | 'activity' = 'spot'): string {
  const seed = encodeURIComponent(`${type}-${name}`);
  return `https://picsum.photos/seed/${seed}/800/600`;
}

/**
 * Fetch spot image URL from Unsplash via our API route
 */
export async function fetchSpotImageUrl(
  spotName: string,
  region: string = 'Iceland'
): Promise<string> {
  try {
    const query = `${region} ${spotName}`;
    const response = await fetch(`/api/images?query=${encodeURIComponent(query)}&type=spot`);
    const data = await response.json();
    return data.url;
  } catch {
    return getFallbackImageUrl(spotName, 'spot');
  }
}

/**
 * Fetch activity image URL from Unsplash via our API route
 */
export async function fetchActivityImageUrl(activityName: string): Promise<string> {
  try {
    const response = await fetch(`/api/images?query=${encodeURIComponent(activityName)}&type=activity`);
    const data = await response.json();
    return data.url;
  } catch {
    return getFallbackImageUrl(activityName, 'activity');
  }
}

/**
 * Generate a deterministic image URL for a spot (sync fallback)
 */
export function getSpotImageUrl(
  spotId: string,
  spotName: string,
  region: string = 'Iceland'
): string {
  return getFallbackImageUrl(`${region}-${spotName}`, 'spot');
}

/**
 * Get activity image URL (sync fallback)
 */
export function getActivityImageUrl(
  activityId: string,
  activityName: string
): string {
  return getFallbackImageUrl(activityName, 'activity');
}

/**
 * Get gradient placeholder based on spot/activity type
 */
export function getPlaceholderGradient(name: string): string {
  // Generate a consistent gradient based on the name
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradients = [
    'from-blue-400 to-cyan-500',
    'from-emerald-400 to-teal-500',
    'from-purple-400 to-pink-500',
    'from-amber-400 to-orange-500',
    'from-indigo-400 to-purple-500',
    'from-rose-400 to-pink-500',
    'from-cyan-400 to-blue-500',
    'from-green-400 to-emerald-500',
  ];
  return gradients[hash % gradients.length];
}
