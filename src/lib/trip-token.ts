import { createClient } from '@supabase/supabase-js'

const STORAGE_KEY = 'travel_ai_claim_tokens'

/**
 * Generates a cryptographically secure claim token
 * @returns A 64-character hex string
 */
export function generateClaimToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Stores a claim token for a trip in localStorage
 * @param tripId - The trip ID
 * @param token - The claim token
 */
export function storeClaimToken(tripId: string, token: string): void {
  if (typeof window === 'undefined') return

  const tokens = getStoredTokens()
  tokens[tripId] = token
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
}

/**
 * Retrieves all stored claim tokens from localStorage
 * @returns Record mapping trip IDs to their claim tokens
 */
export function getStoredTokens(): Record<string, string> {
  if (typeof window === 'undefined') return {}

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

/**
 * Gets a specific claim token for a trip
 * @param tripId - The trip ID
 * @returns The claim token or undefined if not found
 */
export function getClaimToken(tripId: string): string | undefined {
  const tokens = getStoredTokens()
  return tokens[tripId]
}

/**
 * Removes a claim token from localStorage (after claiming or deletion)
 * @param tripId - The trip ID
 */
export function removeClaimToken(tripId: string): void {
  if (typeof window === 'undefined') return

  const tokens = getStoredTokens()
  delete tokens[tripId]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
}

/**
 * Claims all anonymous trips for the authenticated user
 * Call this after signup/login to transfer anonymous trips to the user's account
 * @param supabaseClient - The Supabase client instance
 * @returns The claimed trips
 */
export async function claimTripsForUser(
  supabaseClient: ReturnType<typeof createClient>
): Promise<{ data: unknown[] | null; error: Error | null }> {
  const tokens = getStoredTokens()
  const tokenArray = Object.values(tokens)

  if (tokenArray.length === 0) {
    return { data: [], error: null }
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabaseClient.rpc as any)('claim_trips_for_user', {
      tokens: tokenArray
    })

    if (error) {
      return { data: null, error: new Error(error.message) }
    }

    // Clear all claimed tokens from localStorage
    if (data && Array.isArray(data)) {
      data.forEach((trip: { id: string }) => {
        removeClaimToken(trip.id)
      })
    }

    return { data, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') }
  }
}

/**
 * Creates Supabase client headers with claim token for anonymous trip access
 * @param tripId - The trip ID to access
 * @returns Headers object with x-claim-token if available
 */
export function getClaimTokenHeaders(tripId: string): Record<string, string> {
  const token = getClaimToken(tripId)
  return token ? { 'x-claim-token': token } : {}
}

/**
 * Clears all stored claim tokens
 * Use when user explicitly logs out or clears data
 */
export function clearAllClaimTokens(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
