import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import Providers from '@/contexts/providers';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import { GTMHead, GTMBody } from '@/components/analytics/GTM';
import FacebookPixel from '@/components/analytics/FacebookPixel';
import CookieConsent from '@/components/common/CookieConsent';
import OfflineBanner from '@/components/common/OfflineBanner';
import BackToTop from '@/components/common/BackToTop';
import TopLoadingBar from '@/components/common/TopLoadingBar';
import WebVitals from '@/components/common/WebVitals';
import KeyboardShortcuts from '@/components/common/KeyboardShortcuts';
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
        default: 'TalentBridge - Find Your Dream Job',
        template: '%s | TalentBridge',
    },
    description: 'India\'s leading job portal and recruitment platform. Find top jobs, hire the best talent, and build your career with TalentBridge.',
    keywords: ['jobs', 'recruitment', 'hiring', 'career', 'job portal', 'talent', 'India'],
    authors: [{ name: 'TalentBridge' }],
    openGraph: {
        type: 'website',
        locale: 'en_IN',
        siteName: 'TalentBridge',
        title: 'TalentBridge - Find Your Dream Job',
        description: 'India\'s leading job portal and recruitment platform.',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'TalentBridge - Find Your Dream Job',
        description: 'India\'s leading job portal and recruitment platform.',
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
                {/* Preconnect to third-party origins for performance */}
                <link rel="preconnect" href="https://res.cloudinary.com" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
                <link rel="dns-prefetch" href="https://www.google-analytics.com" />
            </head>
            <body className="min-h-screen antialiased">
                <GTMBody />
                {/* Skip-to-content for accessibility */}
                <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[999] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg"
                >
                    Skip to main content
                </a>
                <TopLoadingBar />
                <OfflineBanner />
                <Providers>
                    <main id="main-content">
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
