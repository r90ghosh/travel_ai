import { NextRequest, NextResponse } from 'next/server';

const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

// In-memory cache for image URLs (persists for server lifetime)
const imageCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');
  const type = searchParams.get('type') || 'spot';

  if (!query) {
    return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
  }

  if (!UNSPLASH_ACCESS_KEY) {
    // Fallback to Lorem Picsum if no API key
    const seed = encodeURIComponent(`${type}-${query}`);
    return NextResponse.json({
      url: `https://picsum.photos/seed/${seed}/800/600`,
      fallback: true,
    });
  }

  // Check cache first
  const cacheKey = `${type}:${query.toLowerCase()}`;
  const cached = imageCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({ url: cached.url, cached: true });
  }

  try {
    // Strategy: Search for exact location/destination name first
    // This will return actual photos of Seljalandsfoss, Blue Lagoon, etc.

    // Try exact name search first (most specific)
    let imageUrl = await searchUnsplash(`${query} Iceland`, UNSPLASH_ACCESS_KEY);

    // If no results, try with just the query (for well-known spots)
    if (!imageUrl) {
      imageUrl = await searchUnsplash(query, UNSPLASH_ACCESS_KEY);
    }

    // If still no results for activities, try activity type
    if (!imageUrl && type === 'activity') {
      const activityType = extractActivityType(query);
      if (activityType) {
        imageUrl = await searchUnsplash(`Iceland ${activityType}`, UNSPLASH_ACCESS_KEY);
      }
    }

    // Last resort: fall back to nature keyword search
    if (!imageUrl) {
      const natureTerm = extractNatureKeyword(query);
      if (natureTerm) {
        imageUrl = await searchUnsplash(`Iceland ${natureTerm}`, UNSPLASH_ACCESS_KEY);
      }
    }

    if (imageUrl) {
      // Cache the result
      imageCache.set(cacheKey, {
        url: imageUrl,
        timestamp: Date.now(),
      });
      return NextResponse.json({ url: imageUrl });
    }

    // No results found, use fallback
    const seed = encodeURIComponent(`${type}-${query}`);
    return NextResponse.json({
      url: `https://picsum.photos/seed/${seed}/800/600`,
      fallback: true,
    });
  } catch (error) {
    console.error('Unsplash API error:', error);

    // Fallback to Lorem Picsum on error
    const seed = encodeURIComponent(`${type}-${query}`);
    return NextResponse.json({
      url: `https://picsum.photos/seed/${seed}/800/600`,
      fallback: true,
    });
  }
}

/**
 * Search Unsplash for images matching the query
 */
async function searchUnsplash(query: string, accessKey: string): Promise<string | null> {
  try {
    const response = await fetch(
      `${UNSPLASH_API_URL}?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      return data.results[0].urls.regular;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Extract activity type for better search results
 */
function extractActivityType(query: string): string | null {
  const lowerQuery = query.toLowerCase();

  const activityTypes: Record<string, string> = {
    'glacier': 'glacier hiking',
    'ice cave': 'ice cave tour',
    'snorkeling': 'snorkeling silfra',
    'diving': 'diving silfra',
    'whale': 'whale watching',
    'puffin': 'puffin watching',
    'aurora': 'northern lights tour',
    'northern lights': 'northern lights tour',
    'horseback': 'icelandic horse riding',
    'horse': 'icelandic horse riding',
    'snowmobile': 'snowmobile glacier',
    'atv': 'atv tour',
    'kayak': 'kayaking',
    'rafting': 'river rafting',
    'hot spring': 'hot spring bathing',
    'spa': 'geothermal spa',
    'hiking': 'hiking trail',
    'volcano': 'volcano tour',
  };

  for (const [keyword, searchTerm] of Object.entries(activityTypes)) {
    if (lowerQuery.includes(keyword)) {
      return searchTerm;
    }
  }

  return null;
}

/**
 * Extract nature-related keywords from spot names for better image matching
 */
function extractNatureKeyword(query: string): string | null {
  const lowerQuery = query.toLowerCase();

  // Map of keywords to search terms for Iceland nature
  const natureKeywords: Record<string, string> = {
    waterfall: 'waterfall',
    foss: 'waterfall', // Icelandic for waterfall
    glacier: 'glacier',
    jökull: 'glacier', // Icelandic for glacier
    geyser: 'geyser hot spring',
    geysir: 'geyser hot spring',
    lagoon: 'lagoon',
    beach: 'black sand beach',
    canyon: 'canyon',
    crater: 'volcanic crater',
    volcano: 'volcano',
    lava: 'lava field',
    cave: 'ice cave',
    aurora: 'northern lights aurora',
    northern: 'northern lights aurora',
    puffin: 'puffin bird',
    whale: 'whale watching',
    'hot spring': 'hot spring geothermal',
    pool: 'geothermal pool',
    mountain: 'mountain',
    fjord: 'fjord',
    lake: 'lake',
    vatn: 'lake', // Icelandic for lake
    cliff: 'cliff seabird',
    church: 'church Iceland',
    lighthouse: 'lighthouse',
  };

  for (const [keyword, searchTerm] of Object.entries(natureKeywords)) {
    if (lowerQuery.includes(keyword)) {
      return searchTerm;
    }
  }

  return null;
}
