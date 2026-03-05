import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://talentbridge.com';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Enterprise-grade robots.txt configuration
 * Controls search engine crawler access and indexing behavior
 */
export default function robots(): MetadataRoute.Robots {
  // Prevent all crawling in non-production environments
  if (!IS_PRODUCTION || BASE_URL.includes('localhost') || BASE_URL.includes('vercel.app')) {
    return {
      rules: [
        {
          userAgent: '*',
          disallow: '/',
        },
      ],
    };
  }

  return {
    rules: [
      // Main crawlers (Google, Bing, etc.) - Full access with rate limiting
      {
        userAgent: ['Googlebot', 'Bingbot', 'Slurp', 'DuckDuckBot'],
        allow: [
          '/',
          '/about',
          '/contact',
          '/help',
          '/privacy',
          '/terms',
          '/cookie-policy',
          '/refund-policy',
          '/accessibility',
          '/disclaimer',
          '/auth/login',
          '/auth/register',
        ],
        disallow: [
          '/candidate/',
          '/employer/',
          '/admin/',
          '/super-admin/',
          '/notifications',
          '/auth/reset-password',
          '/auth/verify-email',
          '/auth/forgot-password',
          '/auth/callback',
          '/api/',
          '/_next/',
          '/404',
          '/500',
        ],
        crawlDelay: 1, // Polite crawling - 1 second between requests
      },
      // Generic bots - More restrictive
      {
        userAgent: '*',
        allow: ['/', '/about', '/contact', '/auth/login', '/auth/register'],
        disallow: [
          '/candidate/',
          '/employer/',
          '/admin/',
          '/super-admin/',
          '/notifications',
          '/auth/',
          '/api/',
          '/_next/',
        ],
        crawlDelay: 2,
      },
      // Block aggressive scrapers and bad bots
      {
        userAgent: [
          'CCBot',
          'ChatGPT-User',
          'GPTBot',
          'Google-Extended',
          'anthropic-ai',
          'Claude-Web',
          'Omgilibot',
          'Bytespider', // ByteDance
          'PetalBot', // Huawei
        ],
        disallow: '/',
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
