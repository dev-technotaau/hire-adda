/**
 * /robots.txt — Route Handler.
 *
 * Implemented as a raw Route Handler (instead of Next.js's `robots.ts`
 * metadata convention) because we need directives that aren't covered by
 * the `MetadataRoute.Robots` type:
 *
 *   - `Clean-param` (Yandex) — collapses tracking-parameter URL variants
 *     into their canonical form in the index.
 *   - Wildcard `Disallow` patterns for query-string parameters (e.g.
 *     `/*?utm_*`) — explicit belt-and-braces on top of Google's canonical
 *     tag handling.
 *
 * Non-production environments return a blanket `Disallow: /` to prevent
 * staging URLs from being indexed.
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://hireadda.in';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// ── Path groups ─────────────────────────────────────────────────────────
const PUBLIC_ALLOW_PATHS = [
  '/',
  '/about',
  '/contact',
  '/help',
  '/site-map',
  // Jobs listings — `/jobs/*` (public listing page, future) + individual
  // detail pages under the same prefix.
  '/jobs',
  '/jobs/',
  // Company profiles — the actual route is `/company/[id]` (singular);
  // `/companies` is the planned public index page. Allow both so crawlers
  // find the listing AND individual profile pages.
  '/company/',
  '/companies',
  '/companies/',
  // Pricing pages — public landing surfaces for both the catch-all index
  // and the audience-split variants. The trailing-slash form covers the
  // per-plan detail pages at `/pricing/[slug]`.
  '/pricing',
  '/pricing/',
  '/pricing/candidate',
  '/pricing/employer',
  // Enterprise "Contact Sales" quote form. The rest of /billing/* is
  // disallowed below (private user dashboard), but this single URL is
  // a public lead-capture page. More-specific Allow > broader Disallow
  // is honoured by Googlebot, Bingbot, YandexBot, and other modern
  // crawlers — defence-in-depth across all rule tiers.
  '/billing/quote',
  '/billing/quote/',
  // Public vendor directory — `/vendors/*` is the public browse + profile
  // pages. The `/vendor/*` prefix (no `s`) is the private dashboard and
  // is disallowed below.
  '/vendors',
  '/vendors/',
  '/privacy',
  '/terms',
  '/cookie-policy',
  '/refund-policy',
  '/accessibility',
  '/disclaimer',
  '/auth/login',
  '/auth/login/candidate',
  '/auth/login/employer',
  '/auth/login/vendor',
  '/auth/register',
  '/auth/register/candidate',
  '/auth/register/employer',
  '/auth/register/vendor',
];

const PRIVATE_DISALLOW_PATHS = [
  '/candidate/',
  '/employer/',
  '/admin/',
  '/super-admin/',
  '/portal/',
  // Vendor dashboard — singular `/vendor/*` prefix (DO NOT confuse with
  // `/vendors/*` which is the PUBLIC vendor directory; the trailing slash
  // ensures we don't accidentally disallow the public prefix).
  '/vendor/',
  // Billing / payment / subscription pages — all auth-required user flows.
  '/billing/',
  // Team-invite acceptance flow — signed-token, single-use URL.
  '/team/',
  '/notifications',
  '/notifications/',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/forgot-password',
  '/auth/callback',
  '/verify-employment/', // signed-token employment verification flow
  '/api/',
  '/_next/',
  '/share',
  '/offline',
  '/404',
  '/500',
];

// Tracking-parameter URL variants that should NEVER be indexed as separate
// pages. Google normally dedupes these via canonical tags, but explicit
// Disallow is defence-in-depth for misconfigured canonicals + Bing/Yandex.
const TRACKING_PARAM_DISALLOW = [
  '/*?utm_source=*',
  '/*?utm_medium=*',
  '/*?utm_campaign=*',
  '/*?utm_content=*',
  '/*?utm_term=*',
  '/*?fbclid=*',
  '/*?gclid=*',
  '/*?gclsrc=*',
  '/*?msclkid=*',
  '/*?mc_eid=*',
  '/*?ref=*',
];

// Yandex Clean-param: list of query parameters to strip from the indexed
// URL. All variants collapse to the canonical parameterless URL.
const YANDEX_CLEAN_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'fbclid',
  'gclid',
  'gclsrc',
  'msclkid',
  'mc_eid',
  'ref',
];

// AI training crawlers — intent-level block at robots.txt (WAF/edge should
// enforce for misbehaving UAs). Sourced from public publisher block-lists.
const AI_TRAINING_BOTS = [
  // OpenAI
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  // Anthropic
  'ClaudeBot',
  'Claude-Web',
  'ClaudeBot-User',
  'anthropic-ai',
  // Google AI
  'Google-Extended',
  'GoogleOther',
  'GoogleOther-Image',
  'GoogleOther-Video',
  // Meta AI
  'Meta-ExternalAgent',
  'Meta-ExternalFetcher',
  'FacebookBot',
  // Apple AI
  'Applebot-Extended',
  // Amazon
  'Amazonbot',
  // Perplexity
  'PerplexityBot',
  'Perplexity-User',
  // Cohere / Mistral / xAI / misc. labs
  'cohere-ai',
  'cohere-training-data-crawler',
  'MistralAI-User',
  'xAI-Bot',
  'GrokBot',
  // Common Crawl
  'CCBot',
  // Chinese vendors
  'Bytespider',
  'PetalBot',
  'PanguBot',
  'Yeti', // Naver
  'Sogou web spider',
  'Sogou inst spider',
  // You.com / Phind / DuckAssist
  'YouBot',
  'PhindBot',
  'DuckAssistBot',
  // Scraping services + dataset labs
  'Diffbot',
  'Scrapy',
  'DataForSeoBot',
  'AI2Bot',
  'AI2Bot-Dolma',
  'ImagesiftBot',
  'Omgilibot',
  'omgili',
  'Webzio-Extended',
  'Timpibot',
  'ICC-Crawler',
  'ISSCyberRiskCrawler',
  'Kangaroo Bot',
  'FriendlyCrawler',
  'VelenPublicWebCrawler',
  'NovaAct',
  'Crawlspace',
  'iaskspider/2.0',
  'IntelliSeek.ai',
  'BrightBot',
];

// ── Serialisation helpers ───────────────────────────────────────────────
function renderRule(
  agents: string | string[],
  allow: string[],
  disallow: string[],
  crawlDelay?: number,
): string {
  const lines: string[] = [];
  (Array.isArray(agents) ? agents : [agents]).forEach((ua) => lines.push(`User-agent: ${ua}`));
  allow.forEach((p) => lines.push(`Allow: ${p}`));
  disallow.forEach((p) => lines.push(`Disallow: ${p}`));
  if (crawlDelay !== undefined) lines.push(`Crawl-delay: ${crawlDelay}`);
  return lines.join('\n');
}

function buildRobotsTxt(): string {
  // Staging / preview / local — block everything.
  if (!IS_PRODUCTION || BASE_URL.includes('localhost') || BASE_URL.includes('vercel.app')) {
    return [
      '# Non-production environment — all crawling disallowed.',
      'User-agent: *',
      'Disallow: /',
      '',
    ].join('\n');
  }

  const blocks: string[] = [
    '# Hire Adda robots.txt',
    '# Generated by src/app/robots.txt/route.ts — do not edit in place.',
    '',

    // Tier 1: Major search engines — full public access
    '# ── Tier 1: Major search engines ─────────────────────────────────',
    renderRule(
      ['Googlebot', 'Googlebot-Image', 'Googlebot-News', 'Googlebot-Video'],
      PUBLIC_ALLOW_PATHS,
      [...PRIVATE_DISALLOW_PATHS, ...TRACKING_PARAM_DISALLOW],
    ),
    '',
    renderRule(
      ['Bingbot', 'Slurp', 'DuckDuckBot', 'YandexBot', 'Yandex'],
      PUBLIC_ALLOW_PATHS,
      [...PRIVATE_DISALLOW_PATHS, ...TRACKING_PARAM_DISALLOW],
      1,
    ),
    '',

    // Tier 2: Social link-preview crawlers
    '# ── Tier 2: Social media / link-preview crawlers ─────────────────',
    renderRule(
      [
        'facebookexternalhit',
        'Facebot',
        'Twitterbot',
        'LinkedInBot',
        'Slackbot',
        'Slackbot-LinkExpanding',
        'TelegramBot',
        'Discordbot',
        'WhatsApp',
        'Applebot',
        'SkypeUriPreview',
        'Pinterest',
        'Pinterestbot',
        'redditbot',
      ],
      PUBLIC_ALLOW_PATHS,
      PRIVATE_DISALLOW_PATHS,
    ),
    '',

    // Tier 3: Google advertising crawlers
    '# ── Tier 3: Google advertising crawlers ──────────────────────────',
    renderRule(
      ['AdsBot-Google', 'AdsBot-Google-Mobile', 'Mediapartners-Google', 'APIs-Google'],
      PUBLIC_ALLOW_PATHS,
      PRIVATE_DISALLOW_PATHS,
    ),
    '',

    // Tier 4: Generic catch-all
    '# ── Tier 4: Generic crawlers — restrictive default ───────────────',
    renderRule(
      '*',
      [
        '/',
        '/about',
        '/contact',
        '/help',
        '/site-map',
        '/pricing',
        '/pricing/',
        '/pricing/candidate',
        '/pricing/employer',
        // Enterprise quote form — explicit allow overrides the
        // /billing/ disallow further down for catch-all UAs too.
        '/billing/quote',
        '/billing/quote/',
        '/vendors',
        '/vendors/',
        '/auth/login',
        '/auth/login/candidate',
        '/auth/login/employer',
        '/auth/login/vendor',
        '/auth/register',
        '/auth/register/candidate',
        '/auth/register/employer',
        '/auth/register/vendor',
        '/privacy',
        '/terms',
        '/cookie-policy',
        '/refund-policy',
        '/accessibility',
        '/disclaimer',
      ],
      [...PRIVATE_DISALLOW_PATHS, ...TRACKING_PARAM_DISALLOW],
      2,
    ),
    '',

    // Tier 5: AI training crawlers — full disallow
    '# ── Tier 5: AI training crawlers — full disallow ─────────────────',
    renderRule(AI_TRAINING_BOTS, [], ['/']),
    '',

    // Tier 5b: AI search/answer engines — selective allow on public
    // job + company surfaces only. This makes our content discoverable
    // when users query AI search ("find me web developer jobs in noida"
    // on Perplexity/ChatGPT/Claude/Gemini) WITHOUT opening the rest of
    // the site for training-data scraping.
    '# ── Tier 5b: AI search engines — public surfaces only ────────────',
    renderRule(
      [
        'GPTBot',
        'OAI-SearchBot',
        'ChatGPT-User',
        'ClaudeBot',
        'Claude-Web',
        'ClaudeBot-User',
        'PerplexityBot',
        'Perplexity-User',
        'Google-Extended',
        'Applebot-Extended',
        'YouBot',
        'PhindBot',
        'DuckAssistBot',
        'MistralAI-User',
        'xAI-Bot',
      ],
      [
        '/',
        '/about',
        '/help',
        '/jobs',
        '/jobs/',
        '/companies',
        '/companies/',
        '/vendors',
        '/vendors/',
        '/pricing',
        '/pricing/',
        // AI search engines should also surface the enterprise quote
        // page when users ask "where do I get a bulk CV access quote
        // on hire adda" / similar high-intent procurement queries.
        '/billing/quote',
        '/billing/quote/',
        '/site-map',
        '/feed.xml',
        '/feed.atom',
        '/feed.json',
        '/llms.txt',
        '/sitemap.xml',
      ],
      [...PRIVATE_DISALLOW_PATHS],
    ),
    '',

    // Yandex Clean-param: dedupe tracking-parameter URL variants
    '# ── Yandex Clean-param — canonical URL collapsing ────────────────',
    `Clean-param: ${YANDEX_CLEAN_PARAMS.join('&')} /`,
    '',

    // Sitemap references — main index + Google News sitemap.
    `Sitemap: ${BASE_URL}/sitemap.xml`,
    `Sitemap: ${BASE_URL}/sitemap-news.xml`,
    // Yandex `Host:` directive — explicit canonical-host hint.
    'Host: hireadda.in',
    '',
  ];

  return blocks.join('\n');
}

export async function GET() {
  return new Response(buildRobotsTxt(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      // Robots.txt can be cached aggressively — it changes on deploys only.
      // Browsers / crawlers should re-fetch periodically; 1 hour edge cache
      // + stale-while-revalidate gives freshness without origin load.
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}

// Explicitly mark static — evaluated at build time, identical output every
// request. Prevents per-request function invocations.
export const dynamic = 'force-static';
