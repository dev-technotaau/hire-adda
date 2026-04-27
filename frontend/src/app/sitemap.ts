import { execSync } from 'node:child_process';
import { statSync } from 'node:fs';
import path from 'node:path';
import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://hireadda.in';

/**
 * Build-time timestamp. Used as the fallback when no git or filesystem
 * history is available for a page.
 */
const LAST_BUILD = new Date();

/**
 * Per-page lastModified resolution order:
 *   1. Git commit timestamp — `git log -1 --format=%cI <file>` gives real
 *      content-change history. Works during CI builds that check out the
 *      full repo; may fail in stripped Docker images (no `.git`).
 *   2. Filesystem mtime — `statSync(file).mtime`. Useful in dev; not
 *      reliable under Docker COPY which resets mtimes at build time.
 *   3. Build timestamp — `LAST_BUILD`. Last-resort fallback when neither
 *      of the above is available.
 *
 * Results are memoised — each page file is probed once per process.
 */
const lastModCache = new Map<string, Date>();

function getPageLastModified(pageFile: string): Date {
  const cached = lastModCache.get(pageFile);
  if (cached) return cached;

  const absPath = path.join(process.cwd(), pageFile);

  // Try git first — real content-change history.
  try {
    const iso = execSync(`git log -1 --format=%cI -- "${absPath}"`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (iso) {
      const d = new Date(iso);
      if (!Number.isNaN(d.getTime())) {
        lastModCache.set(pageFile, d);
        return d;
      }
    }
  } catch {
    // git not available (stripped Docker image, non-git checkout) — fall through.
  }

  // Fallback: filesystem mtime.
  try {
    const stat = statSync(absPath);
    lastModCache.set(pageFile, stat.mtime);
    return stat.mtime;
  } catch {
    // File not found (shouldn't happen for declared entries) — fall through.
  }

  lastModCache.set(pageFile, LAST_BUILD);
  return LAST_BUILD;
}

/**
 * Supported languages for hreflang alternates.
 *
 * Currently single-language (en-IN) — no content is translated yet. The
 * `x-default` entry is the fallback Google uses when no locale matches,
 * and is pointed at the canonical English URL.
 *
 * When additional locales ship (e.g. hi-IN, ta-IN), add them here and
 * they'll automatically appear as `<xhtml:link rel="alternate">` on every
 * sitemap entry.
 */
const LANGUAGES: Record<string, string> = {
  'en-IN': BASE_URL,
  'x-default': BASE_URL,
};

type ChangeFreq = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;

interface SitemapEntry {
  path: string;
  /** Source file used to derive content-specific lastModified (relative to cwd). */
  source: string;
  changeFrequency: ChangeFreq;
  priority: number;
  /** Image URL(s) for image sitemaps — surfaces page imagery in Google Images. */
  images?: string[];
  /** Explicit override — skips the git/fs lookup entirely. */
  lastModified?: Date;
}

/**
 * All pages registered here are public, indexable, and contain non-transient
 * content. Authenticated pages, transient endpoints (share target, offline
 * fallback), and planned-but-not-yet-launched pages (public jobs, public
 * companies) are intentionally excluded to preserve crawl trust — a sitemap
 * pointing to 404s erodes it.
 *
 * `source` points at the Next.js page file so `lastModified` reflects when
 * the content (not the deploy) was last changed. Edit `src/app/privacy/page.tsx`
 * and only that entry's timestamp bumps; other pages keep their old dates.
 */
const STATIC_ENTRIES: SitemapEntry[] = [
  // Core marketing pages
  {
    path: '/',
    source: 'src/app/page.tsx',
    changeFrequency: 'daily',
    priority: 1.0,
    images: ['/images/og-home.png', '/icons/logo.png'],
  },
  { path: '/about', source: 'src/app/about/page.tsx', changeFrequency: 'monthly', priority: 0.8 },
  {
    path: '/contact',
    source: 'src/app/contact/page.tsx',
    changeFrequency: 'monthly',
    priority: 0.7,
  },
  { path: '/help', source: 'src/app/help/page.tsx', changeFrequency: 'weekly', priority: 0.7 },

  // Auth entry points — kept in sitemap so link-preview crawlers can render
  // previews, but priority is intentionally lowered: these pages are thin
  // (no SEO-valuable content), and over-prioritising them wastes crawl budget.
  {
    path: '/auth/login',
    source: 'src/app/auth/login/page.tsx',
    changeFrequency: 'monthly',
    priority: 0.5,
  },
  {
    path: '/auth/register',
    source: 'src/app/auth/register/page.tsx',
    changeFrequency: 'monthly',
    priority: 0.5,
  },
  {
    path: '/auth/forgot-password',
    source: 'src/app/auth/forgot-password/page.tsx',
    changeFrequency: 'yearly',
    priority: 0.2,
  },

  // Human-readable site map page. URL is `/site-map` (dashed) — undashed
  // would collide with the `sitemap.xml` metadata file.
  {
    path: '/site-map',
    source: 'src/app/site-map/page.tsx',
    changeFrequency: 'monthly',
    priority: 0.5,
  },

  // Legal / policy pages — required for compliance + app store approval
  {
    path: '/privacy',
    source: 'src/app/privacy/page.tsx',
    changeFrequency: 'yearly',
    priority: 0.3,
  },
  { path: '/terms', source: 'src/app/terms/page.tsx', changeFrequency: 'yearly', priority: 0.3 },
  {
    path: '/cookie-policy',
    source: 'src/app/cookie-policy/page.tsx',
    changeFrequency: 'yearly',
    priority: 0.3,
  },
  {
    path: '/refund-policy',
    source: 'src/app/refund-policy/page.tsx',
    changeFrequency: 'yearly',
    priority: 0.3,
  },
  {
    path: '/accessibility',
    source: 'src/app/accessibility/page.tsx',
    changeFrequency: 'yearly',
    priority: 0.3,
  },
  {
    path: '/disclaimer',
    source: 'src/app/disclaimer/page.tsx',
    changeFrequency: 'yearly',
    priority: 0.3,
  },
];

/**
 * Sitemap shards.
 *
 * Next.js's `generateSitemaps` returns a list of shard identifiers, and the
 * default `sitemap()` function is invoked once per shard. For each shard a
 * separate `/sitemap/{id}.xml` is generated, and Next.js auto-creates the
 * top-level `/sitemap.xml` index that references them.
 *
 * Today we have one shard (`static`) for the 13 marketing/legal/auth pages.
 * When dynamic content ships, add further shards:
 *
 *   - `jobs-0`, `jobs-1`, … (50k URLs per shard — the sitemap spec limit)
 *   - `companies-0`, `companies-1`, …
 *
 * Each dynamic shard pulls its IDs + updatedAt from the backend, honouring
 * the per-entry `lastModified` for granular freshness signals (instead of
 * a blanket build-time stamp).
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap#generating-multiple-sitemaps
 * @see https://www.sitemaps.org/protocol.html
 */
export async function generateSitemaps() {
  // IMPORTANT: Next.js 16 requires NUMERIC shard IDs. String IDs like
  // 'static' silently break — the index at /sitemap.xml becomes 404 and
  // the shard at /sitemap/<id>.xml returns an empty <urlset>.
  //
  // Shard map:
  //   0 = static pages (marketing, legal, auth entry points)
  //   Future: 1+ = dynamic content shards (jobs, companies)
  return [{ id: 0 }];
}

function buildAlternates(path: string) {
  const languages: Record<string, string> = {};
  for (const [lang, origin] of Object.entries(LANGUAGES)) {
    languages[lang] = `${origin}${path}`;
  }
  return { languages };
}

/**
 * Enterprise-grade sitemap generator.
 *
 * Notes:
 *   - Declarative `SitemapEntry[]` + single generator — no hand-maintained
 *     duplication.
 *   - Each entry emits image references (Google Images / Bing visual search)
 *     where relevant.
 *   - Each entry emits hreflang alternates so locale-specific versions
 *     automatically get indexed in their markets when they launch.
 *   - `lastModified` defaults to build time (uniform freshness per deploy);
 *     entries with known update dates can override.
 *   - Shard-aware via `generateSitemaps()` — ready to slot in dynamic
 *     jobs / companies sitemaps without restructuring.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 * @see https://developers.google.com/search/docs/specialty/international/localized-versions
 */
export default function sitemap({ id }: { id: number }): MetadataRoute.Sitemap {
  switch (id) {
    case 0:
      // Shard 0 — static pages (marketing, legal, auth entry points)
      return STATIC_ENTRIES.map((entry) => ({
        url: `${BASE_URL}${entry.path}`,
        lastModified: entry.lastModified ?? getPageLastModified(entry.source),
        changeFrequency: entry.changeFrequency,
        priority: entry.priority,
        alternates: buildAlternates(entry.path),
        ...(entry.images && entry.images.length > 0
          ? { images: entry.images.map((src) => `${BASE_URL}${src}`) }
          : {}),
      }));

    // Future shards — uncomment + implement when /jobs + /companies go public.
    //
    // case 1:
    //   return await fetchActiveJobsAsSitemap();
    // case 2:
    //   return await fetchPublicCompaniesAsSitemap();

    default:
      return [];
  }
}
