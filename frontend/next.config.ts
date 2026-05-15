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
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-XSS-Protection', value: '0' },
          // Adobe / Flash legacy — disable cross-domain policy lookup.
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
          // Process isolation — modern browsers run this origin in a
          // dedicated process. Reduces Spectre / cross-origin info leaks.
          { key: 'Origin-Agent-Cluster', value: '?1' },
          // Cross-Origin-Resource-Policy — limits cross-site embedding
          // of our resources to same-origin or explicit cross-origin
          // (we use `same-site` so subdomains can embed; tighten to
          // `same-origin` later if no subdomains need cross-embed).
          { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
          // Cross-Origin-Opener-Policy — top-level browsing-context
          // isolation. `same-origin-allow-popups` because the OAuth
          // flow opens Google/LinkedIn windows that we re-attach via
          // postMessage; strict same-origin would break that flow.
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          // NOT setting COEP — `require-corp` would break Cloudinary
          // images, Firebase auth iframes, and Stripe-hosted forms,
          // none of which ship CORP headers we control. Re-evaluate
          // when SharedArrayBuffer / cross-origin isolated APIs are
          // actually needed.
          {
            key: 'Permissions-Policy',
            // Delegations to cross-origin iframes:
            //   - challenges.cloudflare.com → picture-in-picture +
            //     xr-spatial-tracking. Turnstile probes these on load
            //     and the console floods with denial warnings otherwise;
            //     the widget doesn't actually use them.
            //   - api.razorpay.com → payment + accelerometer + gyroscope.
            //     Razorpay's risk-detection bundle (`loader.min.js`) runs
            //     device-motion biometrics inside the checkout iframe and
            //     the Payment Request API is needed for UPI / card flows.
            //     Without these the overlay still works but emits red
            //     "Permissions policy violation" entries on every checkout.
            // Both origins are already in `frame-src` of the CSP, so no
            // new security surface — we're just letting the iframes use
            // features they need.
            value:
              'camera=(), microphone=(), geolocation=(self), payment=(self "https://api.razorpay.com"), usb=(), serial=(), bluetooth=(), accelerometer=(self "https://api.razorpay.com"), gyroscope=(self "https://api.razorpay.com"), magnetometer=(), midi=(), publickey-credentials-get=(self), publickey-credentials-create=(self), interest-cohort=(), browsing-topics=(), clipboard-read=(self), clipboard-write=(self), display-capture=(), fullscreen=(self), picture-in-picture=(self "https://challenges.cloudflare.com"), screen-wake-lock=(self), web-share=(self), xr-spatial-tracking=(self "https://challenges.cloudflare.com"), gamepad=(), hid=(), idle-detection=(), local-fonts=(), storage-access=(self)',
          },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // Reporting endpoint signal — browsers send CSP / NEL reports
          // to this group. `default` is the standard group name.
          {
            key: 'Reporting-Endpoints',
            value:
              'default="https://hireadda.in/api/csp-report", csp-endpoint="https://hireadda.in/api/csp-report", nel-endpoint="https://hireadda.in/api/csp-report"',
          },
          // Report-To — older Reporting v0 header. Older Chromium /
          // Safari only consume Report-To; both ship together for
          // maximum browser coverage.
          {
            key: 'Report-To',
            value:
              '{"group":"default","max_age":10886400,"endpoints":[{"url":"https://hireadda.in/api/csp-report"}],"include_subdomains":true}',
          },
          // Network Error Logging — when a request fails (DNS, TCP, TLS,
          // 5xx), browsers send a structured report to the reporting
          // group. Captures CDN flakes / connection issues that never
          // reach our access logs.
          {
            key: 'NEL',
            value:
              '{"report_to":"default","max_age":2592000,"include_subdomains":true,"success_fraction":0,"failure_fraction":1}',
          },
          // Server-Timing — surfaces backend timing breakdowns in the
          // browser DevTools Network panel. The CORS allow-list lets
          // client-side WebVitals read the values.
          { key: 'Timing-Allow-Origin', value: '*' },
          // Tk — Tracking Status. We don't track DNT users (see
          // /.well-known/dnt-policy.txt), so `N` = not tracking.
          { key: 'Tk', value: 'N' },
          // CSP is managed by src/proxy.ts with per-request nonce
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
        // Global Privacy Control — JSON, served at .well-known/gpc.json
        source: '/.well-known/gpc.json',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
      },
      {
        // EFF DNT Policy — plain text. Advisory (RFC 7231 / EFF DNT v1.0).
        source: '/.well-known/dnt-policy.txt',
        headers: [{ key: 'Content-Type', value: 'text/plain; charset=utf-8' }],
      },
      {
        // Private prefetch proxy directives — JSON, custom MIME.
        source: '/.well-known/traffic-advice',
        headers: [{ key: 'Content-Type', value: 'application/trafficadvice+json' }],
      },
      {
        // llms-full.txt — extended deep-crawl manifest companion to llms.txt.
        source: '/llms-full.txt',
        headers: [{ key: 'Content-Type', value: 'text/plain; charset=utf-8' }],
      },
      {
        // carbon.txt — sustainability / green-hosting disclosure.
        source: '/carbon.txt',
        headers: [{ key: 'Content-Type', value: 'text/plain; charset=utf-8' }],
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

  // Don't fail the build when sourcemap upload errors (expired/invalid
  // SENTRY_AUTH_TOKEN, transient API failure). Sourcemaps are an
  // observability enhancement — the deploy itself shouldn't block on them.
  errorHandler: (err) => {
    console.warn('[sentry] sourcemap upload failed (non-fatal):', err.message);
  },

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
