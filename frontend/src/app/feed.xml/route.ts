/**
 * /feed.xml — RSS 2.0 feed for Hire Adda content.
 *
 * Currently emits a valid empty feed. When blog / news content ships,
 * populate `ITEMS` from the CMS/DB. Keeping the route live (rather than
 * returning 404) means:
 *   - The `<link rel="alternate" type="application/rss+xml">` reference
 *     in layout.tsx doesn't break.
 *   - Feed readers that probe this URL (Inoreader, Feedly, NetNewsWire)
 *     get a clean empty feed instead of an error.
 *
 * @see https://www.rssboard.org/rss-specification
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://hireadda.in';
const SITE_NAME = 'Hire Adda';
const SITE_DESCRIPTION =
  "India's leading job portal and recruitment platform — updates, insights, and career advice.";

interface FeedItem {
  title: string;
  link: string; // absolute URL
  description: string;
  pubDate: Date;
  guid?: string;
  author?: string;
  category?: string;
}

/** Populate from CMS / DB when blog content ships. */
const ITEMS: FeedItem[] = [];

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildFeed(): string {
  const now = new Date();
  const itemsXml = ITEMS.map(
    (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="true">${escapeXml(item.guid ?? item.link)}</guid>
      <description>${escapeXml(item.description)}</description>
      <pubDate>${item.pubDate.toUTCString()}</pubDate>
      ${item.author ? `<author>${escapeXml(item.author)}</author>` : ''}
      ${item.category ? `<category>${escapeXml(item.category)}</category>` : ''}
    </item>`,
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${escapeXml(BASE_URL)}</link>
    <atom:link href="${escapeXml(BASE_URL)}/feed.xml" rel="self" type="application/rss+xml" />
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en-IN</language>
    <copyright>© ${now.getFullYear()} ${escapeXml(SITE_NAME)}</copyright>
    <lastBuildDate>${now.toUTCString()}</lastBuildDate>
    <generator>Next.js</generator>
    <ttl>60</ttl>
    <image>
      <url>${escapeXml(BASE_URL)}/icons/logo.png</url>
      <title>${escapeXml(SITE_NAME)}</title>
      <link>${escapeXml(BASE_URL)}</link>
      <width>144</width>
      <height>144</height>
    </image>
${itemsXml}
  </channel>
</rss>`;
}

export async function GET() {
  return new Response(buildFeed(), {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600, stale-while-revalidate=86400',
    },
  });
}

export const dynamic = 'force-static';
