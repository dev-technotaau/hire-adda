'use client';

/**
 * Public companies listing shell — analog of PublicJobListingShell.
 * Shared by /companies and the curated landings under /companies/*.
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Loader2, Filter as FilterIcon } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import PublicCompanyCard from './PublicCompanyCard';
import LoginToContinueBanner from '@/components/job-search/LoginToContinueBanner';
import InlineSignupCard from '@/components/job-search/InlineSignupCard';
import SidebarSignupCard from '@/components/job-search/SidebarSignupCard';
import StickyMobileBottomCta from '@/components/job-search/StickyMobileBottomCta';
import JobSearchHistoryChips from '@/components/job-search/JobSearchHistoryChips';
import { publicCompaniesService } from '@/services/public-companies.service';
import { useAuthStore } from '@/store/auth.store';

interface Props {
  initialFilters?: Record<string, string>;
  heroH1?: string;
  heroSubtitle?: string;
  seoIntro?: string;
}

const FILTER_KEYS = [
  'q',
  'industry',
  'location',
  'city',
  'cities',
  'size',
  'category',
  'isVerified',
  'hasOpenJobs',
  'featured',
  'sortBy',
] as const;

function paramsToFilters(sp: URLSearchParams): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of FILTER_KEYS) {
    const v = sp.get(k);
    if (v) out[k] = v;
  }
  return out;
}

function filtersToParams(filters: Record<string, string>, page: number): URLSearchParams {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v && v !== '') sp.set(k, v);
  }
  if (page > 1) sp.set('page', String(page));
  return sp;
}

export default function PublicCompanyListingShell({
  initialFilters,
  heroH1,
  heroSubtitle,
  seoIntro,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [filters, setFilters] = useState<Record<string, string>>(() => ({
    ...(initialFilters ?? {}),
    ...paramsToFilters(searchParams ?? new URLSearchParams()),
  }));
  const [page, setPage] = useState<number>(() => Number(searchParams?.get('page') ?? '1') || 1);

  useEffect(() => {
    const sp = filtersToParams(filters, page);
    const next = sp.toString();
    const current = searchParams?.toString() ?? '';
    if (next !== current) {
      router.replace(next ? `?${next}` : '?', { scroll: false });
    }
  }, [filters, page, router, searchParams]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['public-companies', filters, page],
    queryFn: () => publicCompaniesService.search({ ...filters, page, limit: 20 }),
    placeholderData: (prev) => prev,
  });

  const items = data?.items ?? [];
  const total = data?.pagination.total ?? 0;
  const cap = data?.pagination.cap;
  const loginRequired = data?.pagination.loginRequired;

  const cards = items.flatMap((it, i) => {
    const arr: Array<{ kind: 'company'; data: typeof it } | { kind: 'inline-cta' }> = [
      { kind: 'company', data: it },
    ];
    if (!isAuthenticated && (i + 1) % 8 === 0 && i !== items.length - 1) {
      arr.push({ kind: 'inline-cta' });
    }
    return arr;
  });

  return (
    <div className="bg-[var(--bg)]">
      <section className="bg-gradient-to-b from-[var(--bg-secondary)] to-[var(--bg)] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {filters.featured === 'true' && (
            <span className="bg-primary/10 text-primary mb-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wider uppercase">
              ★ Featured
            </span>
          )}
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text)] sm:text-4xl lg:text-5xl">
            {filters.featured === 'true'
              ? 'Featured Companies Hiring'
              : (heroH1 ?? 'Browse Companies')}
          </h1>
          {heroSubtitle && (
            <p className="hero-subtitle mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
              {heroSubtitle}
            </p>
          )}
          {seoIntro && (
            <p
              data-speakable="true"
              className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)]"
            >
              {seoIntro}
            </p>
          )}
          <div className="mt-6 grid gap-2 sm:grid-cols-[2fr_1.5fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <Input
                type="search"
                placeholder="Company name, industry, or tagline"
                value={filters.q ?? ''}
                onChange={(e) => {
                  setFilters((p) => ({ ...p, q: e.target.value }));
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <div className="relative">
              <MapPin className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <Input
                type="search"
                placeholder="Location (e.g. Bengaluru)"
                value={filters.location ?? ''}
                onChange={(e) => {
                  setFilters((p) => ({ ...p, location: e.target.value }));
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Search className="h-4 w-4" />}
              onClick={() => setPage(1)}
            >
              Search
            </Button>
          </div>

          {/* Recent searches chip carousel — hides itself when empty
              so users without history see a clean hero. */}
          <div className="mt-4">
            <JobSearchHistoryChips type="COMPANY" destination="/companies" hideWhenEmpty />
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[260px_1fr_300px]">
          <aside className="hidden flex-col gap-3 lg:flex">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
              <FilterIcon className="h-4 w-4" /> Filters
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-white p-4 text-xs text-[var(--text-muted)]">
              Refine via the search bar above, or tweak URL params (industry, size, isVerified,
              hasOpenJobs).
            </div>
          </aside>

          <div className="min-w-0">
            <p className="mb-4 text-sm text-[var(--text-secondary)]">
              {isLoading ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Loading…
                </span>
              ) : (
                <>
                  Showing <strong className="text-[var(--text)]">{items.length}</strong> of{' '}
                  <strong className="text-[var(--text)]">{total.toLocaleString('en-IN')}</strong>{' '}
                  {total === 1 ? 'company' : 'companies'}
                  {cap ? (
                    <span className="text-[var(--text-muted)]"> · capped at {cap} for guests</span>
                  ) : null}
                </>
              )}
            </p>

            {isLoading && items.length === 0 ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-2xl" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No matching companies"
                description="Try removing filters or broadening your search."
              />
            ) : (
              <ul className="space-y-3">
                {cards.map((c, i) =>
                  c.kind === 'inline-cta' ? (
                    <li key={`cta-${i}`}>
                      <InlineSignupCard
                        headline="Follow companies you love"
                        subheadline="Sign up free to follow companies and get notified about new openings."
                      />
                    </li>
                  ) : (
                    <li key={c.data.id}>
                      <PublicCompanyCard company={c.data} searchKeyword={filters.q} />
                    </li>
                  ),
                )}
              </ul>
            )}

            {loginRequired && <LoginToContinueBanner totalAvailable={total} shown={items.length} />}
            {isFetching && items.length > 0 && (
              <div className="mt-3 flex items-center justify-center gap-1 text-xs text-[var(--text-muted)]">
                <Loader2 className="h-3 w-3 animate-spin" /> Refreshing…
              </div>
            )}
            {!loginRequired && total > items.length && (
              <div className="mt-6 flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-sm text-[var(--text-muted)]">Page {page}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={items.length < 20}
                >
                  Next
                </Button>
              </div>
            )}
          </div>

          {!isAuthenticated && (
            <div>
              <SidebarSignupCard headline="Save companies you like" />
            </div>
          )}
        </div>
      </section>

      <StickyMobileBottomCta />
    </div>
  );
}
