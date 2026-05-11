/**
 * /sitemap.xml — Sitemap Index
 *
 * Next.js 16 with `generateSitemaps()` generates shard files at
 * `/sitemap/[id].xml` but does NOT auto-generate the top-level index
 * at `/sitemap.xml` (despite what the docs imply). This Route Handler
 * fills that gap by emitting a spec-compliant `<sitemapindex>` that
 * references every shard.
 *
 * The shard layout is defined ONCE in `lib/sitemap-shards.ts` and
 * consumed by both this route handler AND `app/sitemap.ts`. Adding a
 * new shard there auto-propagates here without code changes.
 *
 * @see https://www.sitemaps.org/protocol.html#index
 */

import { getShardIds, STANDALONE_SITEMAP_PATHS } from '@/lib/sitemap-shards';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://hireadda.in';

async function buildSitemapIndex(): Promise<string> {
  const now = new Date().toISOString();
  const ids = await getShardIds();

  // Per-shard entries — `/sitemap/{id}.xml` for every numbered shard.
  const shardEntries = ids
    .map(
      (id) => `  <sitemap>
    <loc>${BASE_URL}/sitemap/${id}.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`,
    )
    .join('\n');

  // Standalone sitemap files — live at the root rather than under the
  // /sitemap/{id}.xml shard scheme. See STANDALONE_SITEMAP_PATHS in
  // lib/sitemap-shards.ts (currently /sitemap-news.xml only — distinct
  // namespace + 5-min refresh cadence).
  const standaloneEntries = STANDALONE_SITEMAP_PATHS.map(
    (path) => `  <sitemap>
    <loc>${BASE_URL}${path}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`,
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${shardEntries}
${standaloneEntries}
</sitemapindex>`;
}

export async function GET() {
  const body = await buildSitemapIndex();
  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}

// Dynamic = ISR-revalidate the index so growing job/company counts get
// reflected on the next 10-min interval without redeploying.
export const revalidate = 600;
