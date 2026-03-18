// src/tools/youtube.ts
import YoutubeSearchApi from 'youtube-search-api';

export interface YoutubeSearchArgs {
  query: string;
}

export interface YoutubeSearchResult {
  videoId: string;
  title: string;
  channelTitle: string;
  duration: string;
}

/**
 * youtube_search tool: Returns top 3 YouTube results for a query.
 * Uses youtube-search-api (no API key required).
 */
export async function youtubeSearch(args: YoutubeSearchArgs): Promise<YoutubeSearchResult[]> {
  const raw = await YoutubeSearchApi.GetListByKeyword(args.query, false, 3);

  const items: YoutubeSearchResult[] = [];

  if (!raw || !Array.isArray(raw.items)) {
    return items;
  }

  for (const item of raw.items) {
    if (!item || typeof item.id !== 'string') continue;

    const videoId: string = item.id;
    const title: string = typeof item.title === 'string' ? item.title : '';
    const rawChannel: any = item.channelTitle;
    const channelTitle: string =
      typeof rawChannel === 'string'
        ? rawChannel
        : typeof rawChannel?.simpleText === 'string'
        ? rawChannel.simpleText
        : '';
    const rawLength: any = item.length;
    const duration: string =
      typeof rawLength?.simpleText === 'string'
        ? rawLength.simpleText
        : typeof rawLength === 'string'
        ? rawLength
        : '';

    items.push({ videoId, title, channelTitle, duration });

    if (items.length >= 3) break;
  }

  return items;
}
