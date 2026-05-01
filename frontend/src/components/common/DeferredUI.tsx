'use client';

/**
 * Bundle of below-the-fold / interaction-triggered UI primitives, lazy-loaded
 * as a single client-only chunk so they don't add to the initial JS payload.
 *
 * Why this file exists:
 *   `layout.tsx` is a server component, which means `next/dynamic({ ssr: false })`
 *   can't be used inside it directly — Next.js disallows `ssr: false` in server
 *   components. This client wrapper lets us defer all of these components' code
 *   while still mounting them globally from the root layout.
 *
 * What's deferred:
 *   - `BackToTop`           — only visible after the user scrolls.
 *   - `KeyboardShortcuts`   — opens on Cmd/Ctrl+K, otherwise dormant.
 *   - `CookieConsent`       — banner for first-time visitors; small UX delay
 *                             before it appears is acceptable.
 *   - `OfflineBanner`       — only renders when network is offline (rare).
 *   - `TopLoadingBar`       — only animates between route changes.
 *
 * What's NOT in here (deliberately kept eager elsewhere):
 *   - `WebVitals` — needs to register listeners before LCP/FCP are reported,
 *     otherwise we'd lose the very metrics we're trying to improve.
 *   - Analytics scripts (FacebookPixel, GoogleAnalytics, GTM) — already gated
 *     by cookie consent and use `next/script strategy="afterInteractive"`,
 *     so their cost on first paint is already negligible.
 *
 * Each `dynamic()` call code-splits its target into its own chunk; loading
 * is triggered after the layout tree hydrates on the client.
 */

import dynamic from 'next/dynamic';

const BackToTop = dynamic(() => import('./BackToTop'), {
  ssr: false,
  loading: () => null,
});

const KeyboardShortcuts = dynamic(() => import('./KeyboardShortcuts'), {
  ssr: false,
  loading: () => null,
});

const CookieConsent = dynamic(() => import('./CookieConsent'), {
  ssr: false,
  loading: () => null,
});

const OfflineBanner = dynamic(() => import('./OfflineBanner'), {
  ssr: false,
  loading: () => null,
});

const TopLoadingBar = dynamic(() => import('./TopLoadingBar'), {
  ssr: false,
  loading: () => null,
});

export default function DeferredUI() {
  return (
    <>
      <TopLoadingBar />
      <OfflineBanner />
      <BackToTop />
      <KeyboardShortcuts />
      <CookieConsent />
    </>
  );
}
