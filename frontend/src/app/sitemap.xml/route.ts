/**
 * /sitemap.xml — Sitemap Index
 *
 * Next.js 16 with `generateSitemaps()` generates shard files at
 * `/sitemap/[id].xml` but does NOT auto-generate the top-level index
 * at `/sitemap.xml` (despite what the docs imply). This Route Handler
 * fills that gap by emitting a spec-compliant `<sitemapindex>` that
 * references every shard.
 *
 * When new shards are added to `generateSitemaps()` in sitemap.ts
 * (e.g. jobs, companies), add them to SHARD_IDS below.
 *
 * @see https://www.sitemaps.org/protocol.html#index
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://hireadda.in';

/**
 * Must match the IDs returned by `generateSitemaps()` in sitemap.ts.
 * Each entry produces a `<sitemap>` reference in the index.
 */
const SHARD_IDS = [0];

function buildSitemapIndex(): string {
  const now = new Date().toISOString();
  const entries = SHARD_IDS.map(
    (id) => `  <sitemap>
    <loc>${BASE_URL}/sitemap/${id}.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`,
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;
}

export async function GET() {
  return new Response(buildSitemapIndex(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}

export const dynamic = 'force-static';
