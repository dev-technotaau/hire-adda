/**
 * Site-wide SEO constants consumed by layout.tsx, SEO.tsx, and the
 * structured-data builders. Central place to tune brand-level values.
 *
 * ──────────────────────────────────────────────────────────────────────
 *  Placeholder convention
 * ──────────────────────────────────────────────────────────────────────
 *
 * Any field awaiting an external credential uses the literal token
 * `REPLACE_WITH_REAL_ID`. This is visible in source code AND is detected
 * by `scripts/validate-structured-data.mjs` — CI lists every remaining
 * placeholder with file:line on every build. Set STRICT_SEO=1 in the
 * CI environment to convert those warnings into build-failing errors.
 *
 * Consumers (layout.tsx, SEO.tsx) treat `REPLACE_WITH_REAL_ID` as "not
 * set" — no garbage meta tag is emitted to production HTML — while the
 * marker remains grep-able in the source for any developer or CI check.
 *
 * Helper to test whether a config value is still a placeholder:
 */
export function isPlaceholder(value: string | undefined | null): boolean {
  return !value || value === 'REPLACE_WITH_REAL_ID' || value.startsWith('REPLACE_WITH_');
}

/** Returns `value` if it's real, or `undefined` if it's still a placeholder. */
export function realOrUndef(value: string | undefined | null): string | undefined {
  return isPlaceholder(value) ? undefined : value!;
}

export const SEO_CONFIG = {
  // ── Brand ───────────────────────────────────────────────────────────
  siteName: 'Hire Adda',
  legalName: 'Hire Adda',
  siteSlogan: 'Where Talent Meets Opportunity',
  description:
    "India's leading job portal and recruitment platform. Find top jobs, hire the best talent, and build your career with Hire Adda.",
  defaultTitle: 'Hire Adda — Find Your Dream Job',
  titleTemplate: '%s | Hire Adda',

  // Locale / region ── used by hreflang, geo tags, Google Business
  locale: 'en_IN',
  lang: 'en-IN',
  region: 'IN',
  /** Approximate geographic center of India (ICBM / geo.position). */
  coordinates: { lat: 20.5937, lon: 78.9629 },
  placeName: 'India',
  currency: 'INR',

  // ── Colours ─────────────────────────────────────────────────────────
  themeColor: '#1E5CAF', // light theme
  themeColorDark: '#111A2E', // dark theme — matches pretty-page surface
  accentColor: '#F5880A',
  backgroundColor: '#FFFFFF',

  // ── Social handles ──────────────────────────────────────────────────
  twitterHandle: '@hireadda',
  fbAppId: 'REPLACE_WITH_REAL_ID', // Meta Developer → App Dashboard → App ID
  fbPage: 'REPLACE_WITH_REAL_ID', // Full URL, e.g. 'https://www.facebook.com/hireadda'

  // ── Verification IDs — all detected by scripts/validate-structured-data.mjs
  // while still set to REPLACE_WITH_REAL_ID. Populate as each account is linked.
  verification: {
    google: 'REPLACE_WITH_REAL_ID', // Search Console → HTML tag verification
    bing: 'REPLACE_WITH_REAL_ID', // Bing Webmaster → `msvalidate.01` value
    yandex: 'REPLACE_WITH_REAL_ID', // Yandex Webmaster → meta content value
    pinterest: 'REPLACE_WITH_REAL_ID', // Pinterest → domain claim token
    facebook: 'REPLACE_WITH_REAL_ID', // Meta Business → domain verification
    baidu: 'REPLACE_WITH_REAL_ID', // Baidu webmaster (China market)
    norton: 'REPLACE_WITH_REAL_ID', // Norton safe-web verification
    naver: 'REPLACE_WITH_REAL_ID', // Naver (Korea) site ownership
  },

  // ── App Links (Apple Universal / Android App Links) ─────────────────
  apps: {
    iosAppId: 'REPLACE_WITH_REAL_ID', // e.g. 'id1234567890' from App Store Connect
    iosAppName: 'Hire Adda',
    androidPackage: 'in.hireadda.app',
    androidAppName: 'Hire Adda',
    /** Base deep-link scheme for both iOS/Android. */
    urlScheme: 'hireadda',
  },

  // ── Publisher info for Dublin Core + OpenGraph article attribution ─
  publisher: 'Hire Adda',
  author: 'Hire Adda Team',
  copyrightYear: new Date().getFullYear(),
} as const;

export type SeoConfig = typeof SEO_CONFIG;
