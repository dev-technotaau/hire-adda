import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://hireadda.in';

/**
 * Sitemap with static pages
 *
 * TODO: Add dynamic job listings and company profiles when public pages are implemented
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    // Core pages
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    {
      url: `${BASE_URL}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/help`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },

    // Legal pages (lower priority, rarely change)
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/cookie-policy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/refund-policy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/accessibility`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/disclaimer`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },

    // Auth pages (high priority for conversion)
    {
      url: `${BASE_URL}/auth/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/auth/register`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/auth/forgot-password`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
  ];
}
