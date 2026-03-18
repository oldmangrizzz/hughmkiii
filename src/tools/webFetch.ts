// src/tools/webFetch.ts
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface WebFetchArgs {
  url: string;
}

export interface WebFetchResult {
  title: string;
  text: string;
  url: string;
}

/**
 * web_fetch tool: Fetches a URL, strips nav/footer/header/script/style,
 * and returns clean title + paragraph text (max 3000 chars).
 */
export async function webFetch(args: WebFetchArgs): Promise<WebFetchResult> {
  const response = await axios.get(args.url, {
    timeout: 15000,
    headers: {
      'User-Agent': 'HUGH-Harbor-Master/1.0 (Mozilla/5.0 compatible)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    maxRedirects: 5,
  });

  const $ = cheerio.load(response.data as string);

  // Strip noise elements
  $('script, style, nav, footer, header, noscript, iframe, aside, [role="navigation"], [role="banner"], [role="contentinfo"]').remove();

  const title = $('title').first().text().trim() || $('h1').first().text().trim() || args.url;

  // Collect paragraph and heading text
  const textParts: string[] = [];
  $('p, h1, h2, h3, h4, li').each((_i, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text.length > 20) {
      textParts.push(text);
    }
  });

  const fullText = textParts.join('\n').slice(0, 3000);

  return {
    title,
    text: fullText,
    url: args.url,
  };
}
