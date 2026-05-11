/**
 * /sitemap-news.xml — Google News sitemap.
 *
 * Distinct from the main /sitemap.xml because Google News uses a
 * different XML namespace + only accepts URLs published in the last
 * 2 days. The route returns an empty (but valid) urlset until /news or
 * /blog ships content; Googlebot crawls it on schedule regardless so we
 * have a stable URL for News integration.
 *
 * @see https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
 */
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://hireadda.in';
const PUBLICATION_NAME = 'Hire Adda';
const PUBLICATION_LANGUAGE = 'en';

interface NewsItem {
  slug: string;
  title: string;
  publicationDate: string; // ISO 8601
  keywords?: string[];
}

async function fetchRecentNews(): Promise<NewsItem[]> {
  const apiBase =
    process.env.BACKEND_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000/api/v1';
  try {
    // Google News only accepts items <= 2 days old.
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const res = await fetch(
      `${apiBase}/public/news?limit=1000&since=${encodeURIComponent(since)}`,
      { next: { revalidate: 600 } },
    );
    if (!res.ok) return [];
    const body = await res.json();
    const rows: Array<{
      slug?: string;
      title?: string;
      publishedAt?: string;
      createdAt?: string;
      keywords?: string[];
    }> = body?.data?.items ?? body?.data ?? [];
    return rows
      .filter((r) => r.slug && r.title)
      .map((r) => ({
        slug: r.slug as string,
        title: r.title as string,
        publicationDate: r.publishedAt ?? r.createdAt ?? new Date().toISOString(),
        keywords: r.keywords,
      }));
  } catch {
    return [];
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildNewsSitemap(items: NewsItem[]): string {
  const urls = items
    .map(
      (item) => `  <url>
    <loc>${escapeXml(`${BASE_URL}/news/${item.slug}`)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(PUBLICATION_NAME)}</news:name>
        <news:language>${PUBLICATION_LANGUAGE}</news:language>
      </news:publication>
      <news:publication_date>${escapeXml(item.publicationDate)}</news:publication_date>
      <news:title>${escapeXml(item.title)}</news:title>
      ${item.keywords && item.keywords.length > 0 ? `<news:keywords>${escapeXml(item.keywords.join(', '))}</news:keywords>` : ''}
    </news:news>
  </url>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;
}

export async function GET() {
  const items = await fetchRecentNews();
  const body = buildNewsSitemap(items);
  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
    },
  });
}

// 5min ISR — news content turns over fast.
export const revalidate = 300;
