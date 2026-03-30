// Trigger CI/CD rebuild: ArgoCD-driven deploy, no rollout manipulation
import FacebookPixel from '@/components/analytics/FacebookPixel';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import { GTMBody, GTMHead } from '@/components/analytics/GTM';
import BackToTop from '@/components/common/BackToTop';
import CookieConsent from '@/components/common/CookieConsent';
import KeyboardShortcuts from '@/components/common/KeyboardShortcuts';
import OfflineBanner from '@/components/common/OfflineBanner';
import TopLoadingBar from '@/components/common/TopLoadingBar';
import WebVitals from '@/components/common/WebVitals';
import Providers from '@/contexts/providers';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  title: {
    default: 'Hire Adda - Find Your Dream Job',
    template: '%s | Hire Adda',
  },
  description:
    "India's leading job portal and recruitment platform. Find top jobs, hire the best talent, and build your career with Hire Adda.",
  keywords: ['jobs', 'recruitment', 'hiring', 'career', 'job portal', 'talent', 'India'],
  authors: [{ name: 'Hire Adda' }],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'Hire Adda',
    title: 'Hire Adda - Find Your Dream Job',
    description: "India's leading job portal and recruitment platform.",
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hire Adda - Find Your Dream Job',
    description: "India's leading job portal and recruitment platform.",
  },
  robots: {
    index: true,
    follow: true,
  },
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
        <GTMHead nonce={nonce} />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
        {/* Preconnect to third-party origins for performance */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://firebaseinstallations.googleapis.com" />
        <link rel="preconnect" href="https://firestore.googleapis.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        <link rel="dns-prefetch" href="https://fcm.googleapis.com" />
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
        <TopLoadingBar />
        <OfflineBanner />
        <Providers>
          <main id="main-content" className="flex flex-1 flex-col">
            {children}
          </main>
        </Providers>
        <WebVitals />
        <GoogleAnalytics nonce={nonce} />
        <FacebookPixel nonce={nonce} />
        <BackToTop />
        <KeyboardShortcuts />
        <CookieConsent />
      </body>
    </html>
  );
}
