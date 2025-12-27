import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'trip_claim_tokens';

// Generate a secure claim token
export function generateClaimToken(): string {
  return uuidv4() + '-' + Date.now().toString(36);
}

// Store token in localStorage (browser only)
export function storeClaimToken(tripId: string, token: string): void {
  if (typeof window === 'undefined') return;
  const tokens = getStoredTokens();
  tokens[tripId] = token;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

// Get all stored tokens
export function getStoredTokens(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

// Get token for specific trip
export function getTokenForTrip(tripId: string): string | null {
  return getStoredTokens()[tripId] || null;
}

// Remove token after claiming
export function removeClaimToken(tripId: string): void {
  if (typeof window === 'undefined') return;
  const tokens = getStoredTokens();
  delete tokens[tripId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

// Check if user can access trip (has token or is owner)
export function canAccessTrip(
  trip: { id: string; claim_token: string | null; created_by: string | null },
  userId: string | null,
  urlToken: string | null
): boolean {
  // Owner can always access
  if (userId && trip.created_by === userId) return true;

  // Check URL token
  if (urlToken && trip.claim_token === urlToken) return true;

  // Check localStorage token
  const storedToken = getTokenForTrip(trip.id);
  if (storedToken && trip.claim_token === storedToken) return true;

  return false;
}

// Clear all stored claim tokens
export function clearAllClaimTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

// Get headers with claim token for API requests
export function getClaimTokenHeaders(tripId: string): Record<string, string> {
  const token = getTokenForTrip(tripId);
  return token ? { 'x-claim-token': token } : {};
}
