// src/tools/osint.ts
import axios from 'axios';

export interface OsintArgs {
  latitude: number;
  longitude: number;
  radius_km: number;
  query?: string;
}

export interface RedditPost {
  title: string;
  score: number;
  url: string;
  subreddit: string;
}

export interface OverpassPlace {
  name: string;
  amenity: string;
  lat: number;
  lon: number;
}

export interface OsintResult {
  reddit: RedditPost[];
  places: OverpassPlace[];
}

/**
 * osint_search tool: Combines Reddit public search API + Overpass API
 * to surface nearby events, places, and social signals for a lat/lon + radius.
 */
export async function osintSearch(args: OsintArgs): Promise<OsintResult> {
  const searchTerm = args.query ?? 'events';
  const radiusMeters = args.radius_km * 1000;

  // Run both requests concurrently
  const [redditResult, overpassResult] = await Promise.allSettled([
    // Reddit public JSON search
    axios.get(
      `https://www.reddit.com/search.json?q=${encodeURIComponent(searchTerm)}&limit=10&sort=new`,
      {
        headers: { 'User-Agent': 'HUGH-Harbor-Master/1.0' },
        timeout: 15000,
      }
    ),
    // Overpass API — amenities within radius of the given lat/lon
    axios.post(
      'https://overpass-api.de/api/interpreter',
      `[out:json][timeout:25];
node(around:${radiusMeters},${args.latitude},${args.longitude})["amenity"];
out body 20;`,
      {
        headers: { 'Content-Type': 'text/plain' },
        timeout: 30000,
      }
    ),
  ]);

  // Parse Reddit
  const reddit: RedditPost[] = [];
  if (redditResult.status === 'fulfilled') {
    const body = redditResult.value.data as {
      data?: { children?: Array<{ data: { title: string; score: number; url: string; subreddit: string } }> };
    };
    const children = body?.data?.children ?? [];
    for (const child of children) {
      const d = child.data;
      reddit.push({
        title: d.title ?? '',
        score: d.score ?? 0,
        url: d.url ?? '',
        subreddit: d.subreddit ?? '',
      });
    }
  }

  // Parse Overpass
  const places: OverpassPlace[] = [];
  if (overpassResult.status === 'fulfilled') {
    const body = overpassResult.value.data as {
      elements?: Array<{ tags?: { name?: string; amenity?: string }; lat?: number; lon?: number }>;
    };
    const elements = body?.elements ?? [];
    for (const el of elements) {
      const name = el.tags?.name;
      const amenity = el.tags?.amenity;
      if (!name || !amenity) continue;
      places.push({
        name,
        amenity,
        lat: el.lat ?? 0,
        lon: el.lon ?? 0,
      });
    }
  }

  return { reddit, places };
}
