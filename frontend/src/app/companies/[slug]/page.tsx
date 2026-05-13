import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { isOptimisableImageHost } from '@/lib/image-host';
import PublicLayout from '@/components/layout/PublicLayout';
import PublicJobCard from '@/components/job-search/PublicJobCard';
import JsonLd from '@/components/seo/JsonLd';
import {
  breadcrumbSchema,
  graph,
  webPageSchema,
  organizationSchema,
  aggregateRatingSchema,
  companySchema,
  localBusinessSchema,
} from '@/lib/json-ld';
import { generateMetadata as buildMetadata } from '@/components/common/SEO';
import {
  Building2,
  MapPin,
  Briefcase,
  ShieldCheck,
  Users,
  Globe,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import CompanyDetailTabs from '@/components/company-search/CompanyDetailTabs';
// Helper + type live in a non-'use client' module so this server
// component can import them directly. Importing from CompanyDetailTabs
// (which carries `'use client'`) raises a "client function from server"
// error at SSR time under Next.js 16.
import {
  deriveAvailableCompanyTabs,
  type CompanyTabKey,
} from '@/components/company-search/company-tabs-helpers';
import CompanyJobsTab from '@/components/company-search/CompanyJobsTab';
import CompanyFollowButton from '@/components/company-search/CompanyFollowButton';
import SocialLinksBento, { companySocialLinks } from '@/components/common/SocialLinksBento';
import ReviewsByJobProfilesPreview from '@/components/reviews/ReviewsByJobProfilesPreview';
import WriteReviewBox from '@/components/reviews/WriteReviewBox';
import RatingBadge from '@/components/reviews/RatingBadge';
import type { PublicCompanyDetailResult } from '@/services/public-companies.service';
import type { TopJobProfile } from '@/types/review';

export const revalidate = 300;

async function fetchCompanyBySlug(slug: string): Promise<PublicCompanyDetailResult | null> {
  const apiBase =
    process.env.BACKEND_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000/api/v1';
  try {
    const res = await fetch(`${apiBase}/public/companies/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body?.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchCompanyBySlug(slug);
  if (!data?.company) {
    return buildMetadata({ title: 'Company not found', url: `/companies/${slug}` });
  }
  const c = data.company;
  return buildMetadata({
    title: `${c.companyName} — Jobs, culture, and reviews`,
    description:
      c.tagline ||
      c.description?.replace(/<[^>]+>/g, '').slice(0, 160) ||
      `Browse ${data.openJobsCount} open jobs at ${c.companyName} on Hire Adda. Verified employer, ${c.industry ?? ''} industry, ${c.companySize ?? ''} employees.`,
    url: `/companies/${slug}`,
  });
}

export default async function CompanyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const data = await fetchCompanyBySlug(slug);
  if (!data?.company) notFound();
  const { company, jobs, openJobsCount } = data;
  const averageRating = (data as { averageRating?: number }).averageRating ?? 0;
  const totalReviews = (data as { totalReviews?: number }).totalReviews ?? 0;
  const topJobProfiles = ((data as { topJobProfiles?: TopJobProfile[] }).topJobProfiles ??
    []) as TopJobProfile[];

  // Tab availability derived from the data — auto-hides empty tabs.
  const availableTabs = deriveAvailableCompanyTabs(company);
  const requested = (sp?.tab as CompanyTabKey | undefined) ?? 'overview';
  const activeTab: CompanyTabKey = availableTabs.has(requested) ? requested : 'overview';
  const socialLinks = companySocialLinks(
    (company as { socialLinks?: Record<string, unknown> | null }).socialLinks,
  );

  // Per-company Organization (or LocalBusiness when address is present)
  // schema. The address fields are populated on `CompanyProfile` and
  // sanitised through the public response, so a city + state combo is
  // enough to upgrade Organization → LocalBusiness for richer SERP cards
  // (e.g. Google Maps integration).
  const hasAddress = !!(company.city && company.state);
  const companyEntity = hasAddress
    ? localBusinessSchema({
        url: `/companies/${slug}`,
        name: company.companyName,
        description: company.tagline ?? company.description ?? undefined,
        logo: company.logo ?? undefined,
        industry: company.industry ?? undefined,
        website: company.website ?? undefined,
        address: {
          addressLocality: company.city as string,
          addressRegion: company.state as string,
          addressCountry: (company as { country?: string | null }).country ?? 'IN',
        },
      })
    : companySchema({
        url: `/companies/${slug}`,
        name: company.companyName,
        description: company.tagline ?? company.description ?? undefined,
        logo: company.logo ?? undefined,
        industry: company.industry ?? undefined,
        website: company.website ?? undefined,
      });

  const jsonLd = graph(
    organizationSchema(),
    companyEntity,
    webPageSchema({
      url: `/companies/${slug}`,
      name: `${company.companyName} — Hire Adda`,
      description: company.tagline ?? `Open jobs at ${company.companyName} on Hire Adda`,
      // Speakable: voice assistants read company name + tagline.
      speakableCssSelectors: ['h1', '[data-speakable]'],
    }),
    breadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Companies', url: '/companies' },
      { name: company.companyName, url: `/companies/${slug}` },
    ]),
    // AggregateRating attached to the company entity — only emitted
    // when there are real reviews (never fake the schema).
    ...(totalReviews > 0
      ? [
          aggregateRatingSchema({
            itemName: company.companyName,
            itemType: hasAddress ? 'LocalBusiness' : 'Organization',
            ratingValue: averageRating,
            reviewCount: totalReviews,
          }),
        ]
      : []),
  );

  return (
    <PublicLayout>
      <JsonLd id="jsonld-company-detail" data={jsonLd} />
      <main className="bg-[var(--bg)]">
        <nav
          aria-label="Breadcrumb"
          className="mx-auto flex max-w-7xl items-center gap-1 px-4 pt-6 text-xs text-[var(--text-muted)] sm:px-6 lg:px-8"
        >
          <Link href="/" className="hover:text-[var(--text)]">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/companies" className="hover:text-[var(--text)]">
            Companies
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="truncate text-[var(--text)]">{company.companyName}</span>
        </nav>

        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Cover image */}
          {company.coverImage && (
            <div className="relative mb-6 h-48 overflow-hidden rounded-2xl sm:h-64">
              <Image
                src={company.coverImage}
                alt={`${company.companyName} cover`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 1024px"
                unoptimized={!isOptimisableImageHost(company.coverImage)}
                className="object-cover"
              />
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="min-w-0 space-y-6">
              <Card padding="lg">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[var(--bg-tertiary)]">
                    {company.logo ? (
                      <Image
                        src={company.logo}
                        alt={company.companyName}
                        width={64}
                        height={64}
                        sizes="64px"
                        priority
                        unoptimized={!isOptimisableImageHost(company.logo)}
                        className="h-16 w-16 rounded-xl object-contain"
                      />
                    ) : (
                      <Building2 className="h-10 w-10 text-[var(--text-muted)]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-2xl font-bold text-[var(--text)] sm:text-3xl">
                      {company.companyName}
                      {company.isVerified && (
                        <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-[var(--success-light)] px-1.5 py-0.5 align-middle text-[10px] font-semibold text-[var(--success-dark)]">
                          <ShieldCheck className="h-3 w-3" />
                          Verified
                        </span>
                      )}
                      <span className="ml-2 inline-flex align-middle">
                        <RatingBadge
                          rating={averageRating}
                          count={totalReviews}
                          size="sm"
                          href={`/companies/${encodeURIComponent(company.slug ?? company.id)}/reviews`}
                        />
                      </span>
                    </h1>
                    {company.tagline && (
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">{company.tagline}</p>
                    )}
                    {/* AEO + Speakable: deterministic one-line answer to
                        "tell me about <company name>". Voice/AI engines
                        read this region; reuses already-rendered fields. */}
                    <p
                      data-speakable="true"
                      className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]"
                    >
                      {company.companyName}
                      {company.industry ? ` is a ${company.industry} company` : ' is a company'}
                      {company.companySize ? ` with ${company.companySize} employees` : ''}
                      {company.city || company.headquarters
                        ? ` based in ${company.city ?? company.headquarters}`
                        : ''}
                      {company.foundedYear ? `, founded in ${company.foundedYear}` : ''}
                      {`. ${openJobsCount > 0 ? `${openJobsCount} open jobs` : 'No open jobs right now'} on Hire Adda — `}
                      {company.isVerified ? 'GST-verified employer.' : 'verified profile.'}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
                      {company.industry && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5" /> {company.industry}
                        </span>
                      )}
                      {company.companySize && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" /> {company.companySize}
                        </span>
                      )}
                      {(company.city || company.headquarters) && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {company.city ?? company.headquarters}
                        </span>
                      )}
                      {company.foundedYear && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" /> Founded {company.foundedYear}
                        </span>
                      )}
                      {company.website && (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary flex items-center gap-1 hover:underline"
                        >
                          <Globe className="h-3.5 w-3.5" />
                          Website
                        </a>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {company.companyType && (
                        <Badge variant="info" size="sm">
                          {company.companyType}
                        </Badge>
                      )}
                      {openJobsCount > 0 && (
                        <Badge variant="success" size="sm">
                          {openJobsCount} open jobs
                        </Badge>
                      )}
                    </div>
                    {/* Follow / Following toggle + follower count.
                        `isFollowing` is intentionally omitted from
                        initialStatus — the public endpoint response
                        is shared across users (auth-fragmented but
                        not per-user) so per-user follow state must
                        come from the dedicated /follow-status
                        endpoint that the button calls on mount
                        (~50ms). followersCount is shared/public, safe
                        to seed from the SSR fetch. */}
                    <div className="mt-4">
                      <CompanyFollowButton
                        idOrSlug={company.slug ?? company.id}
                        companyOwnerUserId={(company as { userId?: string | null }).userId ?? null}
                        initialStatus={{
                          isFollowing: false,
                          followersCount: Number(
                            (data as { followersCount?: number }).followersCount ?? 0,
                          ),
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Card>

              <CompanyDetailTabs openJobsCount={openJobsCount} available={availableTabs} />

              {/* ════════════════ Overview tab ════════════════ */}
              {activeTab === 'overview' && (
                <>
                  {company.description && (
                    <Card padding="lg">
                      <h2 className="mb-3 text-lg font-bold text-[var(--text)]">About</h2>
                      <div
                        className="prose prose-sm max-w-none text-[var(--text-secondary)]"
                        dangerouslySetInnerHTML={{ __html: company.description }}
                      />
                    </Card>
                  )}
                  {(company.techStack?.length ?? 0) > 0 && (
                    <Card padding="lg">
                      <h2 className="mb-3 text-lg font-bold text-[var(--text)]">Tech stack</h2>
                      <div className="flex flex-wrap gap-1.5">
                        {company.techStack!.map((t) => (
                          <Badge key={t} variant="neutral" size="sm">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </Card>
                  )}
                  {(company.specialties?.length ?? 0) > 0 && (
                    <Card padding="lg">
                      <h2 className="mb-3 text-lg font-bold text-[var(--text)]">Specialties</h2>
                      <div className="flex flex-wrap gap-1.5">
                        {company.specialties!.map((s) => (
                          <Badge key={s} variant="neutral" size="sm">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </Card>
                  )}
                  {(company.productsServices?.length ?? 0) > 0 && (
                    <Card padding="lg">
                      <h2 className="mb-3 text-lg font-bold text-[var(--text)]">
                        Products & services
                      </h2>
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {company.productsServices!.map((p) => (
                          <li
                            key={p}
                            className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text)]"
                          >
                            {p}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}
                  {socialLinks.length > 0 && (
                    <SocialLinksBento heading="Connect with us" links={socialLinks} />
                  )}

                  {/* ════════════════ Reviews preview ════════════════ */}
                  <ReviewsByJobProfilesPreview
                    companySlug={company.slug ?? company.id}
                    topJobProfiles={topJobProfiles}
                    totalReviews={totalReviews}
                  />
                  <WriteReviewBox
                    companySlug={company.slug ?? company.id}
                    companyName={company.companyName}
                  />

                  {jobs.length > 0 && (
                    <Card padding="lg">
                      <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-[var(--text)]">Open jobs</h2>
                        <Link
                          href={`/companies/${slug}?tab=jobs`}
                          className="text-primary text-xs font-semibold hover:underline"
                        >
                          View all {openJobsCount} jobs →
                        </Link>
                      </div>
                      <ul className="space-y-3">
                        {jobs.slice(0, 3).map((j) => (
                          <li key={j.id}>
                            <PublicJobCard
                              job={{
                                ...j,
                                experienceMin: j.experienceMin ?? 0,
                                company: {
                                  id: company.id,
                                  slug: company.slug,
                                  companyName: company.companyName,
                                  logo: company.logo,
                                  isVerified: company.isVerified,
                                },
                              }}
                              isGuest
                            />
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}
                </>
              )}

              {/* ════════════════ Why work with us ════════════════ */}
              {activeTab === 'why-work-with-us' && company.whyWorkForUs && (
                <Card padding="lg">
                  <h2 className="mb-3 text-lg font-bold text-[var(--text)]">
                    Why work with {company.companyName}
                  </h2>
                  <div className="prose prose-sm max-w-none whitespace-pre-line text-[var(--text-secondary)]">
                    {company.whyWorkForUs}
                  </div>
                </Card>
              )}

              {/* ════════════════ Culture ════════════════ */}
              {activeTab === 'culture' && (
                <>
                  {company.missionStatement && (
                    <Card padding="lg">
                      <h2 className="mb-3 text-lg font-bold text-[var(--text)]">Our mission</h2>
                      <p className="text-sm leading-relaxed whitespace-pre-line text-[var(--text-secondary)]">
                        {company.missionStatement}
                      </p>
                    </Card>
                  )}
                  {company.visionStatement && (
                    <Card padding="lg">
                      <h2 className="mb-3 text-lg font-bold text-[var(--text)]">Our vision</h2>
                      <p className="text-sm leading-relaxed whitespace-pre-line text-[var(--text-secondary)]">
                        {company.visionStatement}
                      </p>
                    </Card>
                  )}
                  {(company.coreValues?.length ?? 0) > 0 && (
                    <Card padding="lg">
                      <h2 className="mb-3 text-lg font-bold text-[var(--text)]">Core values</h2>
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {company.coreValues!.map((v) => (
                          <li
                            key={v}
                            className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text)]"
                          >
                            {v}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}
                  {company.companyCulture && (
                    <Card padding="lg">
                      <h2 className="mb-3 text-lg font-bold text-[var(--text)]">
                        Working at {company.companyName}
                      </h2>
                      <p className="text-sm leading-relaxed whitespace-pre-line text-[var(--text-secondary)]">
                        {company.companyCulture}
                      </p>
                    </Card>
                  )}
                  {company.diversityStatement && (
                    <Card padding="lg">
                      <h2 className="mb-3 text-lg font-bold text-[var(--text)]">
                        Diversity & inclusion
                      </h2>
                      <p className="text-sm leading-relaxed whitespace-pre-line text-[var(--text-secondary)]">
                        {company.diversityStatement}
                      </p>
                    </Card>
                  )}
                  {company.csrInitiatives && (
                    <Card padding="lg">
                      <h2 className="mb-3 text-lg font-bold text-[var(--text)]">Social impact</h2>
                      <p className="text-sm leading-relaxed whitespace-pre-line text-[var(--text-secondary)]">
                        {company.csrInitiatives}
                      </p>
                    </Card>
                  )}
                </>
              )}

              {/* ════════════════ Benefits ════════════════ */}
              {activeTab === 'benefits' && (
                <>
                  {(company.benefits?.length ?? 0) > 0 && (
                    <Card padding="lg">
                      <h2 className="mb-3 text-lg font-bold text-[var(--text)]">Benefits</h2>
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {company.benefits!.map((b) => (
                          <li
                            key={b}
                            className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text)]"
                          >
                            {b}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}
                  {Array.isArray(company.workplacePolicies) &&
                    company.workplacePolicies.length > 0 && (
                      <Card padding="lg">
                        <h2 className="mb-3 text-lg font-bold text-[var(--text)]">
                          Workplace policies
                        </h2>
                        <ul className="space-y-3">
                          {(
                            company.workplacePolicies as Array<{
                              title?: string;
                              description?: string;
                            }>
                          ).map((p, i) => (
                            <li
                              key={`${p.title ?? 'policy'}-${i}`}
                              className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-3"
                            >
                              {p.title && (
                                <p className="text-sm font-semibold text-[var(--text)]">
                                  {p.title}
                                </p>
                              )}
                              {p.description && (
                                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                                  {p.description}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </Card>
                    )}
                </>
              )}

              {/* ════════════════ People ════════════════ */}
              {activeTab === 'people' && (
                <>
                  {Array.isArray(company.leadershipTeam) && company.leadershipTeam.length > 0 && (
                    <Card padding="lg">
                      <h2 className="mb-3 text-lg font-bold text-[var(--text)]">Leadership</h2>
                      <ul className="grid gap-3 sm:grid-cols-2">
                        {(
                          company.leadershipTeam as Array<{
                            name?: string;
                            designation?: string;
                            imageUrl?: string;
                            bio?: string;
                            linkedinUrl?: string;
                          }>
                        ).map((p, i) => (
                          <li
                            key={`${p.name ?? 'leader'}-${i}`}
                            className="flex gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-3"
                          >
                            {p.imageUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.imageUrl}
                                alt={p.name ?? 'Leader'}
                                className="h-14 w-14 shrink-0 rounded-full object-cover"
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-[var(--text)]">{p.name}</p>
                              {p.designation && (
                                <p className="text-xs text-[var(--text-muted)]">{p.designation}</p>
                              )}
                              {p.bio && (
                                <p className="mt-1 line-clamp-3 text-xs text-[var(--text-secondary)]">
                                  {p.bio}
                                </p>
                              )}
                              {p.linkedinUrl && (
                                <a
                                  href={p.linkedinUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary mt-1 inline-block text-xs font-semibold hover:underline"
                                >
                                  LinkedIn ↗
                                </a>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}
                  {Array.isArray(company.employeeTestimonials) &&
                    company.employeeTestimonials.length > 0 && (
                      <Card padding="lg">
                        <h2 className="mb-3 text-lg font-bold text-[var(--text)]">
                          What our team says
                        </h2>
                        <ul className="space-y-3">
                          {(
                            company.employeeTestimonials as Array<{
                              name?: string;
                              designation?: string;
                              quote?: string;
                              imageUrl?: string;
                            }>
                          ).map((t, i) => (
                            <li
                              key={`${t.name ?? 'testimonial'}-${i}`}
                              className="rounded-lg border-l-2 border-[var(--primary)] bg-[var(--bg-secondary)] p-3"
                            >
                              {t.quote && (
                                <p className="text-sm text-[var(--text-secondary)] italic">
                                  &ldquo;{t.quote}&rdquo;
                                </p>
                              )}
                              <p className="mt-2 text-xs font-semibold text-[var(--text)]">
                                — {t.name}
                                {t.designation ? `, ${t.designation}` : ''}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </Card>
                    )}
                </>
              )}

              {/* ════════════════ Gallery ════════════════ */}
              {activeTab === 'gallery' && (
                <>
                  {company.companyVideoUrl && (
                    <Card padding="lg">
                      <h2 className="mb-3 text-lg font-bold text-[var(--text)]">Company video</h2>
                      <div className="aspect-video overflow-hidden rounded-xl bg-black">
                        {/* Inline iframe — supports YouTube/Vimeo embed
                            URLs out of the box. */}
                        <iframe
                          src={company.companyVideoUrl}
                          title={`${company.companyName} video`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="h-full w-full"
                        />
                      </div>
                    </Card>
                  )}
                  {Array.isArray(company.officePhotos) && company.officePhotos.length > 0 && (
                    <Card padding="lg">
                      <h2 className="mb-3 text-lg font-bold text-[var(--text)]">Office photos</h2>
                      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {(
                          company.officePhotos as Array<{
                            url?: string;
                            caption?: string;
                            location?: string;
                          }>
                        ).map((p, i) => (
                          <li key={`photo-${i}`} className="overflow-hidden rounded-xl">
                            {p.url && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.url}
                                alt={p.caption ?? `${company.companyName} office`}
                                className="aspect-video w-full object-cover"
                              />
                            )}
                            {(p.caption || p.location) && (
                              <p className="mt-1 px-1 text-xs text-[var(--text-muted)]">
                                {p.caption}
                                {p.location ? ` · ${p.location}` : ''}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}
                </>
              )}

              {/* ════════════════ Hiring process ════════════════ */}
              {activeTab === 'hiring' && company.interviewProcess && (
                <Card padding="lg">
                  <h2 className="mb-3 text-lg font-bold text-[var(--text)]">Hiring process</h2>
                  <p className="text-sm leading-relaxed whitespace-pre-line text-[var(--text-secondary)]">
                    {company.interviewProcess}
                  </p>
                </Card>
              )}

              {/* ════════════════ Jobs ════════════════
                  Filterable + paginated. Filter pills auto-populate
                  from this company's actual job-set so visitors only
                  see options that exist (per Phase 19 + the "dynamic
                  filter options" brief). */}
              {activeTab === 'jobs' && (
                <CompanyJobsTab
                  slug={slug}
                  company={{
                    id: company.id,
                    slug: company.slug,
                    companyName: company.companyName,
                    logo: company.logo,
                    isVerified: company.isVerified,
                  }}
                  isGuest
                />
              )}
            </div>

            <aside className="space-y-6">
              <Card padding="lg">
                <h3 className="mb-2 text-xs font-bold tracking-wider text-[var(--text-muted)] uppercase">
                  Quick facts
                </h3>
                <dl className="space-y-2 text-sm">
                  {company.foundedYear && (
                    <div className="flex justify-between">
                      <dt className="text-[var(--text-muted)]">Founded</dt>
                      <dd className="font-medium text-[var(--text)]">{company.foundedYear}</dd>
                    </div>
                  )}
                  {company.companySize && (
                    <div className="flex justify-between">
                      <dt className="text-[var(--text-muted)]">Size</dt>
                      <dd className="font-medium text-[var(--text)]">{company.companySize}</dd>
                    </div>
                  )}
                  {company.industry && (
                    <div className="flex justify-between">
                      <dt className="text-[var(--text-muted)]">Industry</dt>
                      <dd className="font-medium text-[var(--text)]">{company.industry}</dd>
                    </div>
                  )}
                  {(company.city || company.headquarters) && (
                    <div className="flex justify-between">
                      <dt className="text-[var(--text-muted)]">Location</dt>
                      <dd className="font-medium text-[var(--text)]">
                        {company.city ?? company.headquarters}
                      </dd>
                    </div>
                  )}
                </dl>
              </Card>
            </aside>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
