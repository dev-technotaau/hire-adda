import type { Metadata } from 'next';
import PublicLayout from '@/components/layout/PublicLayout';
import PublicCompanyListingShell from '@/components/company-search/PublicCompanyListingShell';
import JsonLd from '@/components/seo/JsonLd';
import {
  breadcrumbSchema,
  collectionPageSchema,
  datasetSchema,
  faqPageSchema,
  graph,
  webPageSchema,
} from '@/lib/json-ld';
import { generateMetadata as buildMetadata, PaginationLinks } from '@/components/common/SEO';
import { getPublicCompaniesFaqs } from '@/data/faqs';

export const revalidate = 300;

const PAGE_SIZE = 20;

interface PublicCompanyListItem {
  id: string;
  slug?: string | null;
  companyName: string;
}

interface PublicCompaniesResponse {
  items: PublicCompanyListItem[];
  total: number;
}

async function fetchPublicCompanies(page: number, limit = 10): Promise<PublicCompaniesResponse> {
  const apiBase =
    process.env.BACKEND_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000/api/v1';
  try {
    const res = await fetch(`${apiBase}/public/companies?limit=${limit}&page=${page}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return { items: [], total: 0 };
    const body = await res.json();
    return {
      items: (body?.data?.items ?? []) as PublicCompanyListItem[],
      total: Number(body?.data?.pagination?.total ?? 0),
    };
  } catch {
    return { items: [], total: 0 };
  }
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const pageNum = Math.max(1, Number(sp?.page ?? '1') || 1);
  const total = (await fetchPublicCompanies(pageNum, 1)).total;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const prev =
    pageNum > 1 ? (pageNum === 2 ? '/companies' : `/companies?page=${pageNum - 1}`) : undefined;
  const next = pageNum < totalPages ? `/companies?page=${pageNum + 1}` : undefined;

  return buildMetadata({
    title:
      pageNum > 1
        ? `Browse Companies — Page ${pageNum} of ${totalPages}`
        : 'Browse Companies — Verified Employers on Hire Adda',
    description:
      'Discover top companies hiring on Hire Adda. Filter by industry, location, size, and verification status. View open jobs, company culture, benefits, and more.',
    url: '/companies',
    keywords: [
      'companies hiring',
      'top companies',
      'verified employers',
      'browse companies',
      'hire adda companies',
    ],
    pagination: { prev, next },
  });
}

export default async function CompaniesListingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const pageNum = Math.max(1, Number(sp?.page ?? '1') || 1);

  const [{ items: topCompanies, total }, faqs] = await Promise.all([
    fetchPublicCompanies(1, 10),
    Promise.resolve(getPublicCompaniesFaqs('en', 6)),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const prevHref =
    pageNum > 1 ? (pageNum === 2 ? '/companies' : `/companies?page=${pageNum - 1}`) : undefined;
  const nextHref = pageNum < totalPages ? `/companies?page=${pageNum + 1}` : undefined;

  const jsonLd = graph(
    collectionPageSchema({
      url: '/companies',
      name: 'Browse Companies — Hire Adda',
      description: 'Discover top companies hiring on Hire Adda — verified employers across India.',
      numberOfItems: total,
      speakableCssSelectors: ['h1', '.hero-subtitle', '[data-speakable]'],
    }),
    webPageSchema({
      url: '/companies',
      name: 'Browse Companies — Hire Adda',
      description: 'Discover top companies hiring on Hire Adda — verified employers across India.',
      speakableCssSelectors: ['h1', '.hero-subtitle', '[data-speakable]'],
    }),
    breadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Companies', url: '/companies' },
    ]),
    // ItemList of top 10 verified employers — fed to Google's
    // organisation knowledge panel + carousel.
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: topCompanies.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: c.slug
          ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://hireadda.in'}/companies/${c.slug}`
          : `${process.env.NEXT_PUBLIC_APP_URL || 'https://hireadda.in'}/companies`,
        name: c.companyName,
      })),
    },
    // FAQPage — same shape Google's "People also ask" SERP rich result
    // pulls from. Filtered to relevant employer/general entries.
    faqPageSchema(faqs.map((f) => ({ question: f.question, answer: f.answer }))),
    // Dataset — registers the verified-employer index with Google
    // Dataset Search and AI engines.
    datasetSchema({
      url: '/companies',
      name: 'Hire Adda — Verified Employer Index (India)',
      description:
        'Continuously-updated dataset of GST-verified employers hiring across India. Includes company name, industry, size, city, verification status, and active job count.',
      dateModified: new Date().toISOString(),
      datePublished: '2024-01-01',
      spatialCoverage: 'India',
      temporalCoverage: '2024-01-01/..',
      keywords: [
        'companies',
        'employers',
        'verified employers',
        'India companies',
        'recruiters',
        'hire adda',
        'organisation index',
      ],
      size: total,
    }),
  );
  return (
    <PublicLayout>
      <JsonLd id="jsonld-companies" data={jsonLd} />
      <PaginationLinks prev={prevHref} next={nextHref} />
      <PublicCompanyListingShell
        heroH1="Browse Companies"
        heroSubtitle="5,000+ verified employers across India — view jobs, culture, benefits"
        seoIntro="Hire Adda lists verified companies across IT, sales, marketing, fintech, healthcare, manufacturing, and more. Search by name, industry, or location; filter by company size, type, and verification status. Each company has a public profile with open jobs, culture, benefits, and tech stack."
      />
    </PublicLayout>
  );
}
