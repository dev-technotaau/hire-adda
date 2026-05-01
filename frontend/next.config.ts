import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'assets.hireadda.in' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  compress: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          { key: 'X-XSS-Protection', value: '0' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // CSP is now managed by src/proxy.ts with per-request nonce
        ],
      },
      {
        source: '/.well-known/mta-sts.txt',
        headers: [{ key: 'Content-Type', value: 'text/plain; charset=utf-8' }],
      },
      {
        source: '/.well-known/security.txt',
        headers: [{ key: 'Content-Type', value: 'text/plain; charset=utf-8' }],
      },
      {
        // Apple Universal Links — must be served as JSON WITHOUT a file
        // extension, and Content-Type must be application/json. Apple's
        // swcd crawler is strict about both.
        source: '/.well-known/apple-app-site-association',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
      },
      {
        // Android Digital Asset Links — JSON, standard Content-Type.
        source: '/.well-known/assetlinks.json',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
      },
      {
        // humans.txt — plain-text team credits.
        source: '/humans.txt',
        headers: [{ key: 'Content-Type', value: 'text/plain; charset=utf-8' }],
      },
      {
        // ads.txt — plain-text IAB declaration.
        source: '/ads.txt',
        headers: [{ key: 'Content-Type', value: 'text/plain; charset=utf-8' }],
      },
      {
        // ai.txt — Spawning.ai training opt-out.
        source: '/ai.txt',
        headers: [{ key: 'Content-Type', value: 'text/plain; charset=utf-8' }],
      },
      {
        // llms.txt — LLM content-use policy (llmstxt.org convention).
        source: '/llms.txt',
        headers: [{ key: 'Content-Type', value: 'text/plain; charset=utf-8' }],
      },
      {
        // OpenSearch description document — serves the browser search-engine
        // add-to-browser convention. Content-Type is specific.
        source: '/opensearch.xml',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/opensearchdescription+xml; charset=utf-8',
          },
        ],
      },
    ];
  },
  /**
   * Enforce single-slash canonical URLs + eliminate trailing slashes.
   * Combined with Next.js's default `trailingSlash: false`, this prevents
   * duplicate-content penalties from URL variants like:
   *   /about/    → /about
   *   /ABOUT     → /about (case normalization via redirects below)
   */
  trailingSlash: false,

  async redirects() {
    return [
      // ── Canonical / well-known ─────────────────────────────────────────
      {
        // RFC 8615 well-known convention. Password managers probe this
        // URL when a user wants to rotate their credentials, and browsers
        // (Chrome, Edge) surface a "Change password" button in the
        // compromised-credentials UI when it's present.
        source: '/.well-known/change-password',
        destination: '/auth/reset-password',
        permanent: false, // 307 — URL could change between releases
      },

      // ── Legacy URL migration registry ──────────────────────────────────
      // When content moves, add a 308 (permanent) entry here. Google
      // transfers PageRank through 308s; keep entries forever so
      // deep-linked old URLs never break.
      //
      // Example patterns (uncomment + adapt when needed):
      //
      // Single-page moves:
      // {
      //   source: '/jobs-in-india',
      //   destination: '/jobs?location=india',
      //   permanent: true,
      // },
      //
      // Dynamic/wildcard moves (all paths under /old-blog/* → /blog/*):
      // {
      //   source: '/old-blog/:slug*',
      //   destination: '/blog/:slug*',
      //   permanent: true,
      // },
      //
      // Query-string-based move:
      // {
      //   source: '/search',
      //   has: [{ type: 'query', key: 'q' }],
      //   destination: '/candidate/jobs?search=:q',
      //   permanent: true,
      // },

      // ── WWW → apex normalization ───────────────────────────────────────
      // Cloudflare handles this at the edge when proxying, but keep a
      // fallback in case CF is bypassed (direct origin access, misconfig).
      // 308 preserves the request method (unlike 301 which downgrades to GET).
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.hireadda.in' }],
        destination: 'https://hireadda.in/:path*',
        permanent: true,
      },

      // ── HTTP → HTTPS fallback ──────────────────────────────────────────
      // HSTS + Cloudflare handle this. This is a safety net for the first
      // request from a fresh browser that hasn't seen the HSTS header yet.
      // (Next.js middleware can't do protocol-based redirects directly;
      // this relies on the `x-forwarded-proto` header from the proxy.)
      //
      // Left commented because Cloudflare already enforces — enabling here
      // would cause redirect loops. Uncomment only if CF is ever removed.
      //
      // {
      //   source: '/:path*',
      //   has: [{ type: 'header', key: 'x-forwarded-proto', value: 'http' }],
      //   destination: 'https://hireadda.in/:path*',
      //   permanent: true,
      // },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "technotaau-rn",

  project: "hire-adda-web",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
