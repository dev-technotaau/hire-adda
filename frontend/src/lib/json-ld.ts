/**
 * JSON-LD structured-data builders for Hire Adda.
 *
 * Outputs schema.org markup that every major search/answer engine
 * consumes:
 *   - Google — rich results (knowledge panel, sitelinks search box,
 *     breadcrumbs, FAQ, Jobs, organization cards, video carousels)
 *   - Bing — knowledge cards, FAQ, job listings
 *   - Yandex — organization + event snippets
 *   - DuckDuckGo — uses the same structured data indirectly
 *   - Voice assistants (Alexa, Google Assistant) — Speakable blocks
 *   - AI engines (Perplexity, ChatGPT, Claude) — entity graph extraction
 *
 * Every builder returns a plain JSON-serialisable object ready to be
 * inserted into a `<script type="application/ld+json">` block via the
 * `JsonLd` component.
 *
 * Design rules:
 *   - Keep schemas minimal + accurate. Google penalises inaccurate markup
 *     by suppressing the rich result entirely.
 *   - Only include fields whose value is genuinely present and public.
 *   - Use `@id` anchors so entities on the same page cross-reference
 *     (e.g. JobPosting.hiringOrganization → Organization @id).
 *   - Prefer typed builders over hand-authored JSON to prevent drift.
 *
 * @see https://schema.org/
 * @see https://developers.google.com/search/docs/appearance/structured-data
 * @see https://schema.org/docs/full.html — full type hierarchy
 */

import { OG_IMAGE_VARIANTS } from '@/constants/og-images';

// ═══════════════════════════════════════════════════════════════════════
// 0.  Core constants + types
// ═══════════════════════════════════════════════════════════════════════

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://hireadda.in';

/** Canonical entity IDs — referenced across schemas for graph continuity. */
export const ORGANIZATION_ID = `${BASE_URL}/#organization`;
export const WEBSITE_ID = `${BASE_URL}/#website`;
export const SOFTWARE_APP_ID = `${BASE_URL}/#software`;

type JsonLd = Record<string, unknown>;

interface Named {
  name: string;
  url: string;
}

/** Resolve a relative path to absolute; leave absolute URLs untouched. */
function abs(pathOrUrl: string): string {
  return pathOrUrl.startsWith('http') ? pathOrUrl : `${BASE_URL}${pathOrUrl}`;
}

// ═══════════════════════════════════════════════════════════════════════
// 1.  Organization — canonical brand identity
// ═══════════════════════════════════════════════════════════════════════

/**
 * Organization schema for Hire Adda itself.
 *
 * Powers Google's knowledge panel on brand search ("Hire Adda") and drives
 * logo/site-name attribution across SERP.
 *
 * Emits the full OG image variant set so Google can pick the aspect ratio
 * that fits each rich-result surface (wide for articles, square for mobile
 * cards, tall for Discover feed).
 */
export function organizationSchema(): JsonLd {
  const imageObjects = OG_IMAGE_VARIANTS.map((v) => ({
    '@type': 'ImageObject',
    url: abs(v.url),
    width: v.width,
    height: v.height,
    caption: v.alt,
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: 'Hire Adda',
    legalName: 'Hire Adda',
    alternateName: ['HireAdda', 'Hire-Adda', 'hireadda.in'],
    url: BASE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${BASE_URL}/icons/logo.png`,
      width: 512,
      height: 512,
      caption: 'Hire Adda logo',
      contentUrl: `${BASE_URL}/icons/logo.png`,
    },
    image: imageObjects,
    slogan: 'Where Talent Meets Opportunity',
    description:
      "India's leading job portal and recruitment platform. Find top jobs, hire the best talent, and build your career with Hire Adda.",
    foundingDate: '2024',
    knowsAbout: [
      'Job Search',
      'Recruitment',
      'Hiring',
      'Career Development',
      'Talent Acquisition',
      'Human Resources',
      'Employment',
      'Workforce',
    ],
    areaServed: {
      '@type': 'Country',
      name: 'India',
      '@id': 'https://en.wikipedia.org/wiki/India',
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN',
      addressRegion: 'India',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'support@hireadda.in',
        url: `${BASE_URL}/contact`,
        areaServed: 'IN',
        availableLanguage: ['English', 'Hindi'],
      },
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        email: 'billing@hireadda.in',
        areaServed: 'IN',
        availableLanguage: 'English',
      },
      {
        '@type': 'ContactPoint',
        contactType: 'security',
        email: 'security@hireadda.in',
        areaServed: 'IN',
        availableLanguage: 'English',
      },
      {
        '@type': 'ContactPoint',
        contactType: 'privacy',
        email: 'privacy@hireadda.in',
        areaServed: 'IN',
        availableLanguage: 'English',
      },
    ],
    sameAs: [
      // Populate when social profiles go live — drives "Profiles" card in SERP.
      // 'https://www.linkedin.com/company/hireadda',
      // 'https://twitter.com/hireadda',
      // 'https://www.facebook.com/hireadda',
      // 'https://www.instagram.com/hireadda',
      // 'https://www.youtube.com/@hireadda',
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 2.  WebSite — sitelinks search box + publisher graph
// ═══════════════════════════════════════════════════════════════════════

/**
 * WebSite schema with SearchAction — the engine behind Google's "Sitelinks
 * Search Box" (in-SERP search input under the brand result).
 */
export function websiteSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: BASE_URL,
    name: 'Hire Adda',
    alternateName: 'HireAdda',
    description: "India's leading job portal and recruitment platform.",
    publisher: { '@id': ORGANIZATION_ID },
    inLanguage: 'en-IN',
    copyrightYear: new Date().getFullYear(),
    copyrightHolder: { '@id': ORGANIZATION_ID },
    potentialAction: [
      {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${BASE_URL}/candidate/jobs?search={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 3.  SoftwareApplication — the platform as a product
// ═══════════════════════════════════════════════════════════════════════

/**
 * SoftwareApplication schema identifies Hire Adda as an app/product.
 *
 * Surfaces the platform in Google's software-carousel results and feeds
 * the Knowledge Graph with product-level attributes (categories, OS,
 * pricing tier).
 */
export function softwareApplicationSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': SOFTWARE_APP_ID,
    name: 'Hire Adda',
    alternateName: 'Hire Adda Job Portal',
    url: BASE_URL,
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Job Search & Recruitment',
    operatingSystem: 'Any (Web-based, PWA installable)',
    browserRequirements: 'Requires a modern browser with JavaScript enabled.',
    author: { '@id': ORGANIZATION_ID },
    publisher: { '@id': ORGANIZATION_ID },
    description:
      'Full-featured job portal and recruitment platform: AI-matched opportunities, verified employers, quick-apply, passkey sign-in, and real-time application tracking.',
    featureList: [
      'AI-powered job matching',
      'Verified employer profiles',
      'Quick apply with saved profile',
      'Passkey (WebAuthn) authentication',
      'Real-time application status',
      'Resume parsing with Document AI',
      'Employer dashboard with analytics',
      'Canary-deployed progressive delivery',
    ],
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      category: 'Free',
    },
    aggregateRating: undefined, // Populate when real ratings exist — never fake them.
    screenshot: [
      abs('/screenshots/home-desktop.png'),
      abs('/screenshots/home-mobile.png'),
      abs('/screenshots/jobs-mobile.png'),
      abs('/screenshots/profile-mobile.png'),
    ],
    inLanguage: 'en-IN',
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 4.  Navigation + page-level
// ═══════════════════════════════════════════════════════════════════════

/**
 * BreadcrumbList — drives the breadcrumb trail below the result title in SERP.
 *
 * @param items Ordered path root → current page. First item should be "Home".
 */
export function breadcrumbSchema(items: ReadonlyArray<{ name: string; url: string }>): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: abs(item.url),
    })),
  };
}

/**
 * SiteNavigationElement[] — exposes the primary site nav so search engines
 * can derive sitelinks (the 6-block grid under the top result). Google
 * also uses this to enrich the Knowledge Graph's "related links" pane.
 */
export function siteNavigationSchema(items: ReadonlyArray<Named>): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Primary site navigation',
    itemListElement: items.map((item, i) => ({
      '@type': 'SiteNavigationElement',
      position: i + 1,
      name: item.name,
      url: abs(item.url),
    })),
  };
}

interface WebPageInput {
  url: string;
  name: string;
  description?: string;
  datePublished?: string;
  dateModified?: string;
  breadcrumb?: JsonLd;
  /** Attaches Speakable regions so voice assistants can read the page aloud. */
  speakableCssSelectors?: string[];
  /** Optional primary image URL. Defaults to site-wide wide hero. */
  primaryImage?: string;
}

/** Generic WebPage — fallback type for any page without a more specific schema. */
export function webPageSchema(input: WebPageInput): JsonLd {
  const absUrl = abs(input.url);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': absUrl,
    url: absUrl,
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': ORGANIZATION_ID },
    inLanguage: 'en-IN',
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    ...(input.breadcrumb ? { breadcrumb: input.breadcrumb } : {}),
    ...(input.primaryImage
      ? { primaryImageOfPage: { '@type': 'ImageObject', url: abs(input.primaryImage) } }
      : {}),
    ...(input.speakableCssSelectors && input.speakableCssSelectors.length
      ? {
          speakable: {
            '@type': 'SpeakableSpecification',
            cssSelector: input.speakableCssSelectors,
          },
        }
      : {}),
  };
}

/** AboutPage — `/about`. Helps Google mark the page as company/mission info. */
export function aboutPageSchema(input: WebPageInput): JsonLd {
  return { ...webPageSchema(input), '@type': 'AboutPage' };
}

/** ContactPage — `/contact`. */
export function contactPageSchema(input: WebPageInput): JsonLd {
  return { ...webPageSchema(input), '@type': 'ContactPage' };
}

/** CollectionPage — index/listing pages (e.g. jobs, companies). */
export function collectionPageSchema(input: WebPageInput & { numberOfItems?: number }): JsonLd {
  const base = webPageSchema(input);
  return {
    ...base,
    '@type': 'CollectionPage',
    ...(input.numberOfItems !== undefined ? { numberOfItems: input.numberOfItems } : {}),
  };
}

/**
 * SearchResultsPage — search-results page (/jobs?q=…). Signals to Google
 * this is a SERP-like page, not primary content, so it won't be indexed
 * as a landing page.
 */
export function searchResultsPageSchema(input: WebPageInput & { numberOfItems?: number }): JsonLd {
  const base = webPageSchema(input);
  return {
    ...base,
    '@type': 'SearchResultsPage',
    ...(input.numberOfItems !== undefined ? { numberOfItems: input.numberOfItems } : {}),
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 5.  FAQ / HowTo / Speakable — AEO (Answer Engine Optimization)
// ═══════════════════════════════════════════════════════════════════════

/**
 * FAQPage — renders eligible Q&A accordions in SERP.
 *
 * Google's policy (2024+): FAQ rich results are limited to pages whose
 * primary purpose is answering FAQs. Use on /help and sparingly elsewhere.
 */
export function faqPageSchema(faqs: ReadonlyArray<{ question: string; answer: string }>): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };
}

/**
 * HowTo — procedural content (e.g. "How to post a job", "How to apply").
 * Triggers a step-carousel rich result on mobile.
 */
export function howToSchema(input: {
  name: string;
  description: string;
  totalTime?: string; // ISO 8601 duration — "PT5M" = 5 minutes
  estimatedCost?: { value: string; currency: string };
  supply?: string[];
  tool?: string[];
  steps: ReadonlyArray<{ name: string; text: string; image?: string; url?: string }>;
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: input.name,
    description: input.description,
    ...(input.totalTime ? { totalTime: input.totalTime } : {}),
    ...(input.estimatedCost
      ? {
          estimatedCost: {
            '@type': 'MonetaryAmount',
            currency: input.estimatedCost.currency,
            value: input.estimatedCost.value,
          },
        }
      : {}),
    ...(input.supply
      ? { supply: input.supply.map((name) => ({ '@type': 'HowToSupply', name })) }
      : {}),
    ...(input.tool ? { tool: input.tool.map((name) => ({ '@type': 'HowToTool', name })) } : {}),
    step: input.steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
      ...(s.image ? { image: abs(s.image) } : {}),
      ...(s.url ? { url: abs(s.url) } : {}),
    })),
  };
}

/**
 * Speakable — marks regions of the page suitable for voice readout
 * (Google Assistant, Alexa). Use CSS selectors pointing at key summary
 * nodes (page title + subtitle).
 */
export function speakableSchema(cssSelectors: ReadonlyArray<string>): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'SpeakableSpecification',
    cssSelector: cssSelectors,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 6.  JobPosting — Google Jobs / SERP job carousel (critical for a job portal)
// ═══════════════════════════════════════════════════════════════════════

export type EmploymentType =
  | 'FULL_TIME'
  | 'PART_TIME'
  | 'CONTRACTOR'
  | 'TEMPORARY'
  | 'INTERN'
  | 'VOLUNTEER'
  | 'PER_DIEM'
  | 'OTHER';

interface MoneyRange {
  currency: string; // ISO 4217 — 'INR'
  min: number;
  max: number;
  /** 'YEAR' | 'MONTH' | 'WEEK' | 'DAY' | 'HOUR' */
  unitText?: 'YEAR' | 'MONTH' | 'WEEK' | 'DAY' | 'HOUR';
}

interface JobLocation {
  addressLocality: string;
  addressRegion?: string;
  postalCode?: string;
  streetAddress?: string;
  addressCountry: string;
}

interface JobPostingInput {
  /** Absolute or relative URL — used as canonical. */
  url: string;
  title: string;
  description: string; // HTML allowed, up to 3000 chars recommended
  datePosted: string; // ISO 8601
  validThrough?: string; // ISO 8601 — when the posting closes
  employmentType: EmploymentType | EmploymentType[];
  /** Employer Organization @id or inline object. */
  hiringOrganization: { name: string; url?: string; logo?: string; sameAs?: string[] };
  /** Physical location OR remote flag. Provide one. */
  jobLocation?: JobLocation | JobLocation[];
  applicantLocationRequirements?: { name: string }[];
  jobLocationType?: 'TELECOMMUTE';
  baseSalary?: MoneyRange;
  qualifications?: string;
  responsibilities?: string;
  skills?: string[];
  experienceRequirements?: string;
  educationRequirements?: string;
  /** Google wants `directApply: true` for "Apply on publisher" button. */
  directApply?: boolean;
  identifier?: { name: string; value: string };
  industry?: string;
  occupationalCategory?: string; // ONET-SOC code if known
  workHours?: string;
  datePostedToGoogleJobs?: string;
}

/**
 * JobPosting — the single highest-leverage schema for this platform.
 *
 * Powers Google Jobs (jobs.google.com integration + SERP jobs-box), Bing
 * Jobs, and LinkedIn job surfacing. Google's policy:
 *   - Every field below that's marked required in their docs IS included.
 *   - `validThrough` should always be set — missing it causes the posting
 *     to be dropped from Google Jobs after ~30 days.
 *   - `directApply: true` tells Google the Apply button on our site is the
 *     authoritative application path (vs. redirecting via an aggregator).
 *
 * @see https://developers.google.com/search/docs/appearance/structured-data/job-posting
 */
export function jobPostingSchema(input: JobPostingInput): JsonLd {
  const locations = Array.isArray(input.jobLocation)
    ? input.jobLocation
    : input.jobLocation
      ? [input.jobLocation]
      : [];

  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    '@id': abs(input.url),
    url: abs(input.url),
    title: input.title,
    description: input.description,
    datePosted: input.datePosted,
    ...(input.validThrough ? { validThrough: input.validThrough } : {}),
    employmentType: input.employmentType,
    hiringOrganization: {
      '@type': 'Organization',
      name: input.hiringOrganization.name,
      ...(input.hiringOrganization.url ? { url: abs(input.hiringOrganization.url) } : {}),
      ...(input.hiringOrganization.logo ? { logo: abs(input.hiringOrganization.logo) } : {}),
      ...(input.hiringOrganization.sameAs ? { sameAs: input.hiringOrganization.sameAs } : {}),
    },
    ...(locations.length
      ? {
          jobLocation: locations.map((loc) => ({
            '@type': 'Place',
            address: {
              '@type': 'PostalAddress',
              streetAddress: loc.streetAddress,
              addressLocality: loc.addressLocality,
              addressRegion: loc.addressRegion,
              postalCode: loc.postalCode,
              addressCountry: loc.addressCountry,
            },
          })),
        }
      : {}),
    ...(input.applicantLocationRequirements
      ? {
          applicantLocationRequirements: input.applicantLocationRequirements.map((r) => ({
            '@type': 'Country',
            name: r.name,
          })),
        }
      : {}),
    ...(input.jobLocationType ? { jobLocationType: input.jobLocationType } : {}),
    ...(input.baseSalary
      ? {
          baseSalary: {
            '@type': 'MonetaryAmount',
            currency: input.baseSalary.currency,
            value: {
              '@type': 'QuantitativeValue',
              minValue: input.baseSalary.min,
              maxValue: input.baseSalary.max,
              unitText: input.baseSalary.unitText || 'YEAR',
            },
          },
        }
      : {}),
    ...(input.qualifications ? { qualifications: input.qualifications } : {}),
    ...(input.responsibilities ? { responsibilities: input.responsibilities } : {}),
    ...(input.skills ? { skills: input.skills.join(', ') } : {}),
    ...(input.experienceRequirements
      ? { experienceRequirements: input.experienceRequirements }
      : {}),
    ...(input.educationRequirements ? { educationRequirements: input.educationRequirements } : {}),
    ...(input.directApply !== undefined ? { directApply: input.directApply } : {}),
    ...(input.identifier
      ? {
          identifier: {
            '@type': 'PropertyValue',
            name: input.identifier.name,
            value: input.identifier.value,
          },
        }
      : {}),
    ...(input.industry ? { industry: input.industry } : {}),
    ...(input.occupationalCategory ? { occupationalCategory: input.occupationalCategory } : {}),
    ...(input.workHours ? { workHours: input.workHours } : {}),
  };
}

/** ItemList of JobPostings — used on job search results pages for Google Jobs-list. */
export function jobPostingListSchema(
  url: string,
  postings: ReadonlyArray<{ url: string; title: string; hiringOrganizationName: string }>,
): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${abs(url)}#itemlist`,
    itemListElement: postings.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: abs(p.url),
      name: `${p.title} at ${p.hiringOrganizationName}`,
    })),
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 7.  Employer Organization / Company profile schemas
// ═══════════════════════════════════════════════════════════════════════

interface CompanyInput {
  /** Slug or absolute URL of the public company page. */
  url: string;
  name: string;
  legalName?: string;
  description?: string;
  logo?: string;
  foundingDate?: string;
  numberOfEmployees?: number | { min: number; max: number };
  industry?: string;
  website?: string;
  sameAs?: string[];
  address?: JobLocation;
  telephone?: string;
  email?: string;
}

/**
 * Employer organization — renders on public company profile pages.
 *
 * Uses plain Organization rather than LocalBusiness unless the employer
 * has a retail storefront open to walk-ins (rare for most tech employers).
 * LocalBusiness requires `openingHours` and physical address which don't
 * apply to most of our tenants.
 */
export function companySchema(input: CompanyInput): JsonLd {
  const num = input.numberOfEmployees;
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${abs(input.url)}#organization`,
    url: abs(input.url),
    name: input.name,
    ...(input.legalName ? { legalName: input.legalName } : {}),
    ...(input.description ? { description: input.description } : {}),
    ...(input.logo ? { logo: abs(input.logo) } : {}),
    ...(input.foundingDate ? { foundingDate: input.foundingDate } : {}),
    ...(num !== undefined
      ? {
          numberOfEmployees:
            typeof num === 'number'
              ? { '@type': 'QuantitativeValue', value: num }
              : {
                  '@type': 'QuantitativeValue',
                  minValue: num.min,
                  maxValue: num.max,
                },
        }
      : {}),
    ...(input.industry ? { industry: input.industry } : {}),
    ...(input.website
      ? { sameAs: [...(input.sameAs ?? []), input.website] }
      : input.sameAs
        ? { sameAs: input.sameAs }
        : {}),
    ...(input.address
      ? {
          address: {
            '@type': 'PostalAddress',
            streetAddress: input.address.streetAddress,
            addressLocality: input.address.addressLocality,
            addressRegion: input.address.addressRegion,
            postalCode: input.address.postalCode,
            addressCountry: input.address.addressCountry,
          },
        }
      : {}),
    ...(input.telephone ? { telephone: input.telephone } : {}),
    ...(input.email ? { email: input.email } : {}),
  };
}

/** LocalBusiness variant — use when the employer is a retail/physical-location business. */
export function localBusinessSchema(
  input: CompanyInput & {
    priceRange?: string;
    openingHours?: { dayOfWeek: string[]; opens: string; closes: string }[];
    geo?: { latitude: number; longitude: number };
  },
): JsonLd {
  const base = companySchema(input);
  return {
    ...base,
    '@type': 'LocalBusiness',
    ...(input.priceRange ? { priceRange: input.priceRange } : {}),
    ...(input.openingHours
      ? {
          openingHoursSpecification: input.openingHours.map((o) => ({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: o.dayOfWeek,
            opens: o.opens,
            closes: o.closes,
          })),
        }
      : {}),
    ...(input.geo
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: input.geo.latitude,
            longitude: input.geo.longitude,
          },
        }
      : {}),
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 8.  Person — candidate profiles (when public)
// ═══════════════════════════════════════════════════════════════════════

export function personSchema(input: {
  url: string;
  name: string;
  givenName?: string;
  familyName?: string;
  headline?: string;
  description?: string;
  image?: string;
  jobTitle?: string;
  worksFor?: { name: string; url?: string };
  alumniOf?: Array<{ name: string; url?: string }>;
  knowsAbout?: string[];
  sameAs?: string[];
  email?: string;
  address?: JobLocation;
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${abs(input.url)}#person`,
    url: abs(input.url),
    name: input.name,
    ...(input.givenName ? { givenName: input.givenName } : {}),
    ...(input.familyName ? { familyName: input.familyName } : {}),
    ...(input.headline
      ? { jobTitle: input.headline }
      : input.jobTitle
        ? { jobTitle: input.jobTitle }
        : {}),
    ...(input.description ? { description: input.description } : {}),
    ...(input.image ? { image: abs(input.image) } : {}),
    ...(input.worksFor
      ? {
          worksFor: {
            '@type': 'Organization',
            name: input.worksFor.name,
            ...(input.worksFor.url ? { url: input.worksFor.url } : {}),
          },
        }
      : {}),
    ...(input.alumniOf
      ? {
          alumniOf: input.alumniOf.map((a) => ({
            '@type': 'EducationalOrganization',
            name: a.name,
            ...(a.url ? { url: a.url } : {}),
          })),
        }
      : {}),
    ...(input.knowsAbout ? { knowsAbout: input.knowsAbout } : {}),
    ...(input.sameAs ? { sameAs: input.sameAs } : {}),
    ...(input.email ? { email: input.email } : {}),
    ...(input.address
      ? {
          address: {
            '@type': 'PostalAddress',
            addressLocality: input.address.addressLocality,
            addressRegion: input.address.addressRegion,
            addressCountry: input.address.addressCountry,
          },
        }
      : {}),
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 9.  Article / BlogPosting — content articles (help, blog, landing posts)
// ═══════════════════════════════════════════════════════════════════════

export function articleSchema(input: {
  url: string;
  headline: string;
  description?: string;
  image?: string | string[];
  datePublished: string;
  dateModified?: string;
  authorName: string;
  authorUrl?: string;
  publisher?: { id: string } | null;
  keywords?: string[];
  articleSection?: string;
  wordCount?: number;
  speakableCssSelectors?: string[];
}): JsonLd {
  const images = input.image
    ? Array.isArray(input.image)
      ? input.image.map(abs)
      : [abs(input.image)]
    : OG_IMAGE_VARIANTS.map((v) => abs(v.url));

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${abs(input.url)}#article`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': abs(input.url) },
    url: abs(input.url),
    headline: input.headline,
    ...(input.description ? { description: input.description } : {}),
    image: images,
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    author: {
      '@type': 'Person',
      name: input.authorName,
      ...(input.authorUrl ? { url: abs(input.authorUrl) } : {}),
    },
    publisher: { '@id': input.publisher?.id ?? ORGANIZATION_ID },
    ...(input.keywords ? { keywords: input.keywords.join(', ') } : {}),
    ...(input.articleSection ? { articleSection: input.articleSection } : {}),
    ...(input.wordCount ? { wordCount: input.wordCount } : {}),
    ...(input.speakableCssSelectors
      ? {
          speakable: {
            '@type': 'SpeakableSpecification',
            cssSelector: input.speakableCssSelectors,
          },
        }
      : {}),
    inLanguage: 'en-IN',
    isPartOf: { '@id': WEBSITE_ID },
  };
}

/** BlogPosting — narrower subtype of Article for dated blog content. */
export function blogPostingSchema(input: Parameters<typeof articleSchema>[0]): JsonLd {
  return { ...articleSchema(input), '@type': 'BlogPosting' };
}

/** NewsArticle — for news-grade content that qualifies for Top Stories. */
export function newsArticleSchema(input: Parameters<typeof articleSchema>[0]): JsonLd {
  return { ...articleSchema(input), '@type': 'NewsArticle' };
}

// ═══════════════════════════════════════════════════════════════════════
// 10. Reviews, Events, Video, Service — long-tail types we may need later
// ═══════════════════════════════════════════════════════════════════════

export function videoObjectSchema(input: {
  name: string;
  description: string;
  thumbnailUrl: string | string[];
  uploadDate: string;
  contentUrl: string;
  embedUrl?: string;
  duration?: string; // ISO 8601
  transcript?: string;
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: input.name,
    description: input.description,
    thumbnailUrl: Array.isArray(input.thumbnailUrl)
      ? input.thumbnailUrl.map(abs)
      : abs(input.thumbnailUrl),
    uploadDate: input.uploadDate,
    contentUrl: abs(input.contentUrl),
    ...(input.embedUrl ? { embedUrl: abs(input.embedUrl) } : {}),
    ...(input.duration ? { duration: input.duration } : {}),
    ...(input.transcript ? { transcript: input.transcript } : {}),
    publisher: { '@id': ORGANIZATION_ID },
  };
}

export function eventSchema(input: {
  name: string;
  description: string;
  startDate: string; // ISO 8601
  endDate?: string;
  eventAttendanceMode?:
    | 'OnlineEventAttendanceMode'
    | 'OfflineEventAttendanceMode'
    | 'MixedEventAttendanceMode';
  eventStatus?: 'EventScheduled' | 'EventPostponed' | 'EventCancelled' | 'EventMovedOnline';
  location?: { name: string; address?: JobLocation; url?: string };
  image?: string[];
  organizer?: { name: string; url?: string };
  offers?: { url: string; price: string; priceCurrency: string; availability?: string };
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: input.name,
    description: input.description,
    startDate: input.startDate,
    ...(input.endDate ? { endDate: input.endDate } : {}),
    eventAttendanceMode: `https://schema.org/${input.eventAttendanceMode ?? 'OfflineEventAttendanceMode'}`,
    eventStatus: `https://schema.org/${input.eventStatus ?? 'EventScheduled'}`,
    ...(input.location
      ? {
          location: input.location.address
            ? {
                '@type': 'Place',
                name: input.location.name,
                address: {
                  '@type': 'PostalAddress',
                  streetAddress: input.location.address.streetAddress,
                  addressLocality: input.location.address.addressLocality,
                  addressRegion: input.location.address.addressRegion,
                  postalCode: input.location.address.postalCode,
                  addressCountry: input.location.address.addressCountry,
                },
              }
            : { '@type': 'VirtualLocation', url: input.location.url ?? BASE_URL },
        }
      : {}),
    ...(input.image ? { image: input.image.map(abs) } : {}),
    organizer: {
      '@type': 'Organization',
      name: input.organizer?.name ?? 'Hire Adda',
      url: input.organizer?.url ?? BASE_URL,
    },
    ...(input.offers
      ? {
          offers: {
            '@type': 'Offer',
            url: abs(input.offers.url),
            price: input.offers.price,
            priceCurrency: input.offers.priceCurrency,
            availability: input.offers.availability ?? 'https://schema.org/InStock',
          },
        }
      : {}),
  };
}

export function serviceSchema(input: {
  name: string;
  description: string;
  serviceType: string;
  areaServed?: string;
  provider?: { id: string };
  offers?: { price: string; priceCurrency: string };
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    description: input.description,
    serviceType: input.serviceType,
    provider: { '@id': input.provider?.id ?? ORGANIZATION_ID },
    ...(input.areaServed ? { areaServed: input.areaServed } : {}),
    ...(input.offers
      ? {
          offers: {
            '@type': 'Offer',
            price: input.offers.price,
            priceCurrency: input.offers.priceCurrency,
          },
        }
      : {}),
  };
}

export function reviewSchema(input: {
  itemName: string;
  itemType: string; // 'Organization' | 'Product' etc.
  authorName: string;
  reviewBody: string;
  ratingValue: number;
  bestRating?: number;
  datePublished: string;
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: { '@type': input.itemType, name: input.itemName },
    author: { '@type': 'Person', name: input.authorName },
    reviewBody: input.reviewBody,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: input.ratingValue,
      bestRating: input.bestRating ?? 5,
    },
    datePublished: input.datePublished,
  };
}

export function aggregateRatingSchema(input: {
  itemName: string;
  itemType: string;
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  worstRating?: number;
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'AggregateRating',
    itemReviewed: { '@type': input.itemType, name: input.itemName },
    ratingValue: input.ratingValue,
    reviewCount: input.reviewCount,
    bestRating: input.bestRating ?? 5,
    worstRating: input.worstRating ?? 1,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 11. Graph helper — combine multiple entities into an @graph document
// ═══════════════════════════════════════════════════════════════════════

/**
 * Wrap multiple top-level schemas into a single `@graph` document.
 * More efficient than emitting N separate <script> tags and lets
 * crawlers see cross-references between entities (e.g. JobPosting
 * → hiringOrganization → Organization).
 */
export function graph(...items: JsonLd[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@graph': items.map((item) => {
      // Strip nested @context — redundant inside @graph.
      const copy = { ...item };
      delete copy['@context'];
      return copy;
    }),
  };
}
