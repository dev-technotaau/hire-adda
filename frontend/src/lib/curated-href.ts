/**
 * Resolve a CuratedListing entry to its canonical public URL.
 *
 * Single source of truth for routing CuratedListing rows — used by:
 *   - Header NavMegaMenu
 *   - Footer mega-section
 *   - Homepage discovery widgets (Sections 1, 2)
 *   - Sitemap generator (frontend mirror lives in `app/sitemap.ts`)
 */
import type { CuratedListing } from '@/services/curated.service';

export function curatedHref(item: CuratedListing): string {
  const isCompany = item.type.startsWith('COMPANY_');
  if (isCompany) {
    if (item.type === 'COMPANY_CATEGORY')
      return `/companies/category/${item.slug.replace(/^companies-/, '')}`;
    return `/companies/collection/${item.slug}`;
  }
  if (item.type === 'JOB_LOCATION') {
    const city = item.slug.replace(/^jobs-in-/, '');
    return `/jobs/in/${city}`;
  }
  if (item.type === 'JOB_CATEGORY') return `/jobs/category/${item.slug.replace(/-jobs$/, '')}`;
  if (item.type === 'JOB_DEPARTMENT') return `/jobs/department/${item.slug.replace(/-jobs$/, '')}`;
  if (item.type === 'JOB_QUALIFICATION')
    return `/jobs/qualification/${item.slug.replace(/-jobs$/, '')}`;
  if (item.type === 'JOB_COLLECTION') return `/jobs/collection/${item.slug}`;
  return `/jobs/${item.slug}`;
}
