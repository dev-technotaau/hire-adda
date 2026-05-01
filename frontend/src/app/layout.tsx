// Trigger CI/CD rebuild: refresh GHCR credentials after VPS reboot
import FacebookPixel from '@/components/analytics/FacebookPixel';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import { GTMBody, GTMHead } from '@/components/analytics/GTM';
import DeferredUI from '@/components/common/DeferredUI';
import SmoothScroll from '@/components/common/SmoothScroll';
import WebVitals from '@/components/common/WebVitals';
import JsonLd from '@/components/seo/JsonLd';
import Providers from '@/contexts/providers';
import { organizationSchema, softwareApplicationSchema, websiteSchema } from '@/lib/json-ld';
import { OG_IMAGE_VARIANTS, TWITTER_IMAGE_URL } from '@/constants/og-images';
import { SEO_CONFIG, realOrUndef } from '@/constants/seo';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

/**
 * Viewport + theme-color — split out of `metadata` per Next.js 14+ convention.
 * Includes dark-mode theme-color via media query so the browser UI chrome
 * switches with the user's system preference.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover', // honours iOS notch (safe-area insets)
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: SEO_CONFIG.themeColor },
    { media: '(prefers-color-scheme: dark)', color: SEO_CONFIG.themeColorDark },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
    languages: {
      'en-IN': '/',
      'x-default': '/',
      // Add 'hi-IN': '/hi' etc. when localised content ships.
    },
    types: {
      'application/rss+xml': '/feed.xml', // RSS when we publish a blog
      'application/atom+xml': '/feed.atom',
    },
  },
  title: {
    default: SEO_CONFIG.defaultTitle,
    template: SEO_CONFIG.titleTemplate,
  },
  description: SEO_CONFIG.description,
  applicationName: SEO_CONFIG.siteName,
  generator: 'Next.js',
  keywords: [
    'jobs',
    'job search',
    'job portal',
    'recruitment',
    'hiring',
    'career',
    'career portal',
    'employment',
    'talent acquisition',
    'India jobs',
    'hire adda',
    'hireadda',
    'find jobs',
    'post job',
    'resume',
    'job application',
  ],
  authors: [{ name: SEO_CONFIG.author, url: process.env.NEXT_PUBLIC_APP_URL }],
  creator: SEO_CONFIG.publisher,
  publisher: SEO_CONFIG.publisher,
  category: 'Business, Recruitment, Jobs',
  classification: 'Job Portal',

  openGraph: {
    type: 'website',
    locale: SEO_CONFIG.locale,
    alternateLocale: [],
    siteName: SEO_CONFIG.siteName,
    title: SEO_CONFIG.defaultTitle,
    description: SEO_CONFIG.description,
    url: '/',
    // Multi-variant — Facebook picks the first, WhatsApp/iMessage prefer
    // the square, Pinterest may prefer the tall. See src/constants/og-images.ts
    // for the full crawler-behaviour matrix.
    images: OG_IMAGE_VARIANTS,
    countryName: 'India',
    emails: ['support@hireadda.in'],
    determiner: '',
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO_CONFIG.defaultTitle,
    description: SEO_CONFIG.description,
    images: [TWITTER_IMAGE_URL],
    site: SEO_CONFIG.twitterHandle,
    creator: SEO_CONFIG.twitterHandle,
  },

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },

  formatDetection: {
    telephone: false,
    address: false,
    email: false,
    url: false,
  },

  appleWebApp: {
    capable: true,
    title: SEO_CONFIG.siteName,
    statusBarStyle: 'default',
    startupImage: ['/icon-512x512.png'],
  },

  referrer: 'strict-origin-when-cross-origin',

  // Verification — real values pass through, `REPLACE_WITH_REAL_ID`
  // placeholders are stripped via `realOrUndef()` so no garbage meta tags
  // ship to production. CI detects remaining placeholders in source.
  verification: (() => {
    const bing = realOrUndef(SEO_CONFIG.verification.bing);
    const pinterest = realOrUndef(SEO_CONFIG.verification.pinterest);
    const facebook = realOrUndef(SEO_CONFIG.verification.facebook);
    const baidu = realOrUndef(SEO_CONFIG.verification.baidu);
    const norton = realOrUndef(SEO_CONFIG.verification.norton);
    const naver = realOrUndef(SEO_CONFIG.verification.naver);
    const google = realOrUndef(SEO_CONFIG.verification.google);
    const yandex = realOrUndef(SEO_CONFIG.verification.yandex);

    const otherEntries: Record<string, string> = {};
    if (bing) otherEntries['msvalidate.01'] = bing;
    if (pinterest) otherEntries['p:domain_verify'] = pinterest;
    if (facebook) otherEntries['facebook-domain-verification'] = facebook;
    if (baidu) otherEntries['baidu-site-verification'] = baidu;
    if (norton) otherEntries['norton-safeweb-site-verification'] = norton;
    if (naver) otherEntries['naver-site-verification'] = naver;
    return {
      ...(google ? { google } : {}),
      ...(yandex ? { yandex } : {}),
      ...(Object.keys(otherEntries).length > 0 ? { other: otherEntries } : {}),
    };
  })(),

  // Facebook App ID — required for Insights tracking + richer FB cards.
  // Emits only when a real value is set (placeholder is stripped).
  ...(realOrUndef(SEO_CONFIG.fbAppId)
    ? { other: { 'fb:app_id': realOrUndef(SEO_CONFIG.fbAppId)! } }
    : {}),

  // App Links — lets Facebook / LinkedIn deep-link into native apps
  // when installed. Emits only when iOS App ID is a real value.
  ...(realOrUndef(SEO_CONFIG.apps.iosAppId) || SEO_CONFIG.apps.androidPackage
    ? {
        appLinks: {
          ...(realOrUndef(SEO_CONFIG.apps.iosAppId)
            ? {
                ios: {
                  app_store_id: realOrUndef(SEO_CONFIG.apps.iosAppId)!,
                  app_name: SEO_CONFIG.apps.iosAppName,
                  url: `${SEO_CONFIG.apps.urlScheme}://`,
                },
              }
            : {}),
          ...(SEO_CONFIG.apps.androidPackage
            ? {
                android: {
                  package: SEO_CONFIG.apps.androidPackage,
                  app_name: SEO_CONFIG.apps.androidAppName,
                  url: `${SEO_CONFIG.apps.urlScheme}://`,
                },
              }
            : {}),
          web: { url: '/', should_fallback: true },
        },
      }
    : {}),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get('x-nonce') || '';

  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Frame-busting fallback for browsers that don't support CSP frame-ancestors */}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `if(window.top!==window.self){window.top.location=window.self.location}`,
          }}
        />
        <GTMHead nonce={nonce} />

        {/* ── Favicons ── */}
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
        <link rel="icon" type="image/svg+xml" href="/icon0.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png" />
        {/* Safari pinned-tab mask icon (coloured by Safari via `color`) */}
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color={SEO_CONFIG.themeColor} />

        {/* ── Windows / Edge tile ── */}
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content={SEO_CONFIG.themeColor} />
        <meta name="msapplication-navbutton-color" content={SEO_CONFIG.themeColor} />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* ── Apple / iOS ── */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content={SEO_CONFIG.siteName} />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* ── Geo tags (local + "local pack" SEO for India) ── */}
        <meta name="geo.region" content={SEO_CONFIG.region} />
        <meta name="geo.placename" content={SEO_CONFIG.placeName} />
        <meta
          name="geo.position"
          content={`${SEO_CONFIG.coordinates.lat};${SEO_CONFIG.coordinates.lon}`}
        />
        <meta
          name="ICBM"
          content={`${SEO_CONFIG.coordinates.lat}, ${SEO_CONFIG.coordinates.lon}`}
        />

        {/* ── Language + distribution ── */}
        <meta httpEquiv="content-language" content={SEO_CONFIG.lang} />
        <meta name="language" content="English" />
        <meta name="distribution" content="global" />
        <meta name="rating" content="general" />
        <meta name="coverage" content="Worldwide" />
        <meta name="revisit-after" content="1 day" />
        <meta name="target" content="all" />

        {/* ── Dublin Core (deep-enterprise metadata) ── */}
        <meta name="DC.title" content={SEO_CONFIG.defaultTitle} />
        <meta name="DC.description" content={SEO_CONFIG.description} />
        <meta name="DC.publisher" content={SEO_CONFIG.publisher} />
        <meta name="DC.creator" content={SEO_CONFIG.author} />
        <meta name="DC.rights" content={`© ${SEO_CONFIG.copyrightYear} ${SEO_CONFIG.siteName}`} />
        <meta name="DC.language" content={SEO_CONFIG.lang} />
        <meta name="DC.type" content="InteractiveResource" />
        <meta name="DC.format" content="text/html" />
        <meta name="DC.coverage" content={SEO_CONFIG.placeName} />

        {/* ── Copyright / brand-attribution ── */}
        <meta name="copyright" content={`© ${SEO_CONFIG.copyrightYear} ${SEO_CONFIG.siteName}`} />
        <meta name="author" content={SEO_CONFIG.author} />
        <meta name="designer" content={SEO_CONFIG.author} />

        {/* ── Pinterest Rich Pins (article/product) ── */}
        <meta property="article:publisher" content={`${process.env.NEXT_PUBLIC_APP_URL}/about`} />

        {/* ── Sitewide JSON-LD ──
            Organization + WebSite SearchAction + WebApplication.
            Emitted on every page so Google can aggregate across the site when
            building the knowledge panel, sitelinks search box, and software
            carousel. More specific schemas are injected per-page. */}
        <JsonLd id="jsonld-organization" data={organizationSchema()} />
        <JsonLd id="jsonld-website" data={websiteSchema()} />
        <JsonLd id="jsonld-software" data={softwareApplicationSchema()} />

        {/* ── Resource hints — performance SEO (LCP/TTFB) ── */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://assets.hireadda.in" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://firebaseinstallations.googleapis.com" />
        <link rel="preconnect" href="https://firestore.googleapis.com" />
        <link rel="preconnect" href="https://fcmregistrations.googleapis.com" />
        <link rel="preconnect" href="https://identitytoolkit.googleapis.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        <link rel="dns-prefetch" href="https://fcm.googleapis.com" />
        <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />

        {/* ── Alternate resources (AEO + discovery) ── */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Hire Adda Blog RSS"
          href="/feed.xml"
        />
        <link
          rel="alternate"
          hrefLang="en-IN"
          href={process.env.NEXT_PUBLIC_APP_URL ?? 'https://hireadda.in'}
        />
        <link
          rel="alternate"
          hrefLang="x-default"
          href={process.env.NEXT_PUBLIC_APP_URL ?? 'https://hireadda.in'}
        />

        {/* ── Discovery hints for crawlers + browsers + password managers ── */}
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
        {/* OpenSearch — "add hireadda.in as browser search engine" support */}
        <link
          rel="search"
          type="application/opensearchdescription+xml"
          title="Hire Adda"
          href="/opensearch.xml"
        />
        <link rel="help" href="/help" />
        <link rel="author" href="/humans.txt" />
        <link rel="license" href="/terms" />
        <link rel="privacy-policy" href="/privacy" />
        <link rel="terms-of-service" href="/terms" />

        {/* ── Cache control hint for CDNs ── */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      </head>
      <body className="flex min-h-screen flex-col antialiased">
        <GTMBody />
        {/* Skip-to-content for accessibility */}
        <a
          href="#main-content"
          className="focus:bg-primary sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[999] focus:rounded-lg focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg"
        >
          Skip to main content
        </a>
        <Providers>
          <SmoothScroll>
            <main id="main-content" className="flex flex-1 flex-col">
              {children}
            </main>
          </SmoothScroll>
        </Providers>
        {/* Web Vitals stays eager — it must register listeners before LCP/FCP
            are reported, otherwise the very metrics we're optimising would
            be lost. Analytics scripts stay eager too because they're already
            gated by cookie consent and use `next/script strategy="afterInteractive"`. */}
        <WebVitals />
        <GoogleAnalytics nonce={nonce} />
        <FacebookPixel nonce={nonce} />
        {/* All other below-the-fold / interaction-triggered UI is lazy-loaded
            as one client chunk after hydration. See DeferredUI for the list. */}
        <DeferredUI />
      </body>
    </html>
  );
}
