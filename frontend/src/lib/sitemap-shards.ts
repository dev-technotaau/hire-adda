/**
 * Single source of truth for the sitemap shard layout.
 *
 * Two files consume this module:
 *
 *   - `app/sitemap.ts`            → Next.js's `generateSitemaps()` +
 *                                    default `sitemap()` route handler.
 *                                    Picks the SHARD content per id.
 *   - `app/sitemap.xml/route.ts`  → The top-level `<sitemapindex>` that
 *                                    references every shard.
 *
 * Before this module both files duplicated `SHARD_PAGE_SIZE`,
 * `JOBS_SHARD_BASE`, `fetchPublicCount`, and the entire shard-ID
 * computation. Any change to one file silently drifted from the other,
 * orphaning new shards from the sitemap index.
 *
 * @see https://www.sitemaps.org/protocol.html
 */

/** Sitemap-spec hard cap — 50,000 URLs per shard file. */
export const SHARD_PAGE_SIZE = 50_000;

/**
 * First numeric ID assigned to the jobs shard family. IDs 0 + 1 are
 * reserved for static + curated. Subsequent shard IDs are derived from
 * the dynamic counts so growing/shrinking the catalogue auto-rebases.
 */
export const JOBS_SHARD_BASE = 2;

/**
 * The complete per-shard map. Every consumer that needs to know "which
 * id belongs to which shard family" reads this single record.
 */
export interface ShardMap {
  staticIds: number[];
  curatedId: number;
  jobsShardCount: number;
  companiesShardBase: number;
  companiesShardCount: number;
  cartesianShardId: number;
  popularAggregatesShardId: number;
  companyReviewsShardId: number;
  vendorsShardId: number;
  helpArticlesShardId: number;
  newsArticlesShardId: number;
}

/**
 * Standalone sitemap files — live at the root of the site rather than
 * under the `/sitemap/{id}.xml` shard scheme. Currently just the
 * Google News sitemap, which uses a distinct XML namespace + 5-minute
 * refresh cadence so it can't share the shard layout.
 */
export const STANDALONE_SITEMAP_PATHS: ReadonlyArray<string> = ['/sitemap-news.xml'];

/**
 * Pull a public-API total count via the public listing endpoint. Used
 * to derive jobsShardCount / companiesShardCount.
 */
export async function fetchPublicCount(path: string): Promise<number> {
  const apiBase =
    process.env.BACKEND_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000/api/v1';
  try {
    const res = await fetch(`${apiBase}${path}?limit=1&page=1`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) return 0;
    const body = await res.json();
    return Number(body?.data?.pagination?.total ?? 0);
  } catch {
    return 0;
  }
}

/**
 * Module-level cache so two parallel imports (sitemap.ts + sitemap.xml
 * route handler) share the same shard map within a single Next.js
 * server process. Caching is keyed only on time — the underlying
 * counts come from the public API which is itself cached for 10min.
 */
let shardMapCache: { map: ShardMap; expires: number } | null = null;

const SHARD_CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Compute the canonical shard map.
 *
 * The order below MUST match the consumer in `sitemap.ts`'s default
 * `sitemap()` function — adding a new shard requires:
 *   1. A new field on `ShardMap`
 *   2. A new ID assignment below
 *   3. A push into `getShardIds()` below
 *   4. A new branch in `sitemap.ts` default function
 *
 * The `sitemap.xml/route.ts` index automatically picks up the new ID
 * because it iterates `getShardIds()` directly.
 */
export async function getShardMap(): Promise<ShardMap> {
  if (shardMapCache && shardMapCache.expires > Date.now()) {
    return shardMapCache.map;
  }
  const [jobsTotal, companiesTotal] = await Promise.all([
    fetchPublicCount('/public/jobs'),
    fetchPublicCount('/public/companies'),
  ]);
  const jobsShardCount = Math.max(1, Math.ceil(jobsTotal / SHARD_PAGE_SIZE));
  const companiesShardBase = JOBS_SHARD_BASE + jobsShardCount;
  const companiesShardCount = Math.max(1, Math.ceil(companiesTotal / SHARD_PAGE_SIZE));
  const cartesianShardId = companiesShardBase + companiesShardCount;
  const popularAggregatesShardId = cartesianShardId + 1;
  const companyReviewsShardId = popularAggregatesShardId + 1;
  const vendorsShardId = companyReviewsShardId + 1;
  const helpArticlesShardId = vendorsShardId + 1;
  const newsArticlesShardId = helpArticlesShardId + 1;
  const map: ShardMap = {
    staticIds: [0],
    curatedId: 1,
    jobsShardCount,
    companiesShardBase,
    companiesShardCount,
    cartesianShardId,
    popularAggregatesShardId,
    companyReviewsShardId,
    vendorsShardId,
    helpArticlesShardId,
    newsArticlesShardId,
  };
  shardMapCache = { map, expires: Date.now() + SHARD_CACHE_TTL_MS };
  return map;
}

/**
 * Flat list of every shard ID, in render order. Both consumers
 * iterate this — sitemap.ts maps each to a `{id}` for Next.js's
 * `generateSitemaps()`, and sitemap.xml/route.ts maps each to a
 * `<sitemap>` index entry.
 */
export async function getShardIds(): Promise<number[]> {
  const m = await getShardMap();
  const ids: number[] = [];
  for (const id of m.staticIds) ids.push(id);
  ids.push(m.curatedId);
  for (let i = 0; i < m.jobsShardCount; i++) ids.push(JOBS_SHARD_BASE + i);
  for (let i = 0; i < m.companiesShardCount; i++) ids.push(m.companiesShardBase + i);
  ids.push(m.cartesianShardId);
  ids.push(m.popularAggregatesShardId);
  ids.push(m.companyReviewsShardId);
  ids.push(m.vendorsShardId);
  ids.push(m.helpArticlesShardId);
  ids.push(m.newsArticlesShardId);
  return ids;
}
