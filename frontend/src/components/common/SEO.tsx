import type { Metadata } from 'next';
import { APP_CONFIG } from '@/constants/config';

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  noindex?: boolean;
}

/**
 * Generate Next.js metadata for a page.
 * Usage in page files:
 *   export const metadata = generateMetadata({ title: 'Jobs', description: '...' });
 */
export function generateMetadata({
  title,
  description,
  keywords,
  image,
  url,
  noindex,
}: SEOProps): Metadata {
  const fullTitle = title;
  const desc = description || APP_CONFIG.description;
  const pageUrl = url || APP_CONFIG.url;

  return {
    title: fullTitle,
    description: desc,
    keywords: keywords || ['jobs', 'careers', 'recruitment', 'hiring', 'talent bridge'],
    openGraph: {
      title: fullTitle,
      description: desc,
      url: pageUrl,
      siteName: APP_CONFIG.name,
      type: 'website',
      ...(image && {
        images: [{ url: image, width: 1200, height: 630, alt: fullTitle }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: desc,
      ...(image && { images: [image] }),
    },
    ...(noindex && {
      robots: { index: false, follow: false },
    }),
  };
}
