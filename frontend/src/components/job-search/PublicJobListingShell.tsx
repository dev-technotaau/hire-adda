'use client';

/**
 * PublicJobListingShell — the shared experience powering /jobs and the
 * curated listing variants under /jobs/[...slug].
 *
 * Behaviour:
 *   - URL <-> filter state synced via query params.
 *   - Soft-walls guests at 30 results (LoginToContinueBanner shown after
 *     the 30th card, pagination disabled past page 1).
 *   - Records every successful search to SearchHistory (server-side) so
 *     the chip carousel stays warm.
 *   - Multiple guest CTAs interleaved: top sticky banner removed for
 *     simplicity, InlineSignupCard every 8 cards, SidebarSignupCard on
 *     the right rail (lg+), StickyMobileBottomCta on mobile.
 */

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Loader2, Filter as FilterIcon, SlidersHorizontal } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import PublicJobCard from './PublicJobCard';
import LoginToContinueBanner from './LoginToContinueBanner';
import InlineSignupCard from './InlineSignupCard';
import SidebarSignupCard from './SidebarSignupCard';
import StickyMobileBottomCta from './StickyMobileBottomCta';
import NarrowResultsCta from './NarrowResultsCta';
import ExitIntentSaveSearchModal from './ExitIntentSaveSearchModal';
import JobSearchHistoryChips from './JobSearchHistoryChips';
import KeywordSyntaxHelp from './KeywordSyntaxHelp';
import { publicJobsService } from '@/services/public-jobs.service';
import { searchHistoryService } from '@/services/search-history.service';
import { useAuthStore } from '@/store/auth.store';

interface Props {
  /** Initial filter preset from a curated landing slug (e.g. role+city). */
  initialFilters?: Record<string, string>;
  /** Override the page H1 — typically supplied by curated landings. */
  heroH1?: string;
  /** Optional sub-headline below the H1. */
  heroSubtitle?: string;
  /** When true, render an SEO-friendly intro paragraph above the results. */
  seoIntro?: string;
}

const FILTER_KEYS = [
  'q',
  'location',
  'cities',
  'skills',
  'designation',
  'experienceMin',
  'experienceMax',
  'workMode',
  'jobType',
  'industry',
  'department',
  'category',
  'qualification',
  'shiftType',
  'salaryMin',
  'salaryMax',
  'postedAfter',
  'sortBy',
] as const;

function paramsToFilters(sp: URLSearchParams): Record<string, string> {
  const filters: Record<string, string> = {};
  for (const k of FILTER_KEYS) {
    const v = sp.get(k);
    if (v) filters[k] = v;
  }
  return filters;
}

function filtersToParams(filters: Record<string, string>, page: number): URLSearchParams {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v && v !== '') sp.set(k, v);
  }
  if (page > 1) sp.set('page', String(page));
  return sp;
}

export default function PublicJobListingShell({
  initialFilters,
  heroH1,
  heroSubtitle,
  seoIntro,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // URL-driven filter state (with optional curated overrides).
  const [filters, setFilters] = useState<Record<string, string>>(() => ({
    ...(initialFilters ?? {}),
    ...paramsToFilters(searchParams ?? new URLSearchParams()),
  }));
  const [page, setPage] = useState<number>(() => Number(searchParams?.get('page') ?? '1') || 1);

  // Sync filters → URL (replaceState — no history pollution).
  useEffect(() => {
    const sp = filtersToParams(filters, page);
    const next = sp.toString();
    const current = searchParams?.toString() ?? '';
    if (next !== current) {
      router.replace(next ? `?${next}` : '?', { scroll: false });
    }
  }, [filters, page, router, searchParams]);

  // Server query — drives the results list.
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['public-jobs', filters, page],
    queryFn: () =>
      publicJobsService.search({
        ...filters,
        page,
        limit: 20,
      }),
    placeholderData: (prev) => prev,
  });

  // Record search to history (best-effort, fire-and-forget).
  useEffect(() => {
    const hasAnyFilter = Object.values(filters).some((v) => !!v);
    if (!hasAnyFilter || !data) return;
    searchHistoryService
      .record({
        searchType: 'JOB',
        filters,
        query: filters.q,
        location: filters.location,
        resultsCount: data.pagination.total,
      })
      .catch(() => {});
  }, [filters, data]);

  const items = data?.items ?? [];
  const total = data?.pagination.total ?? 0;
  const cap = data?.pagination.cap;
  const loginRequired = data?.pagination.loginRequired;

  const onKeywordChange = (q: string) => {
    setFilters((prev) => ({ ...prev, q }));
    setPage(1);
  };
  const onLocationChange = (loc: string) => {
    setFilters((prev) => ({ ...prev, location: loc }));
    setPage(1);
  };

  const cards = useMemo(() => {
    const out: Array<{ kind: 'job'; data: (typeof items)[number] } | { kind: 'inline-cta' }> = [];
    items.forEach((it, i) => {
      out.push({ kind: 'job', data: it });
      // Interleave inline CTA every 8 cards for guests.
      if (!isAuthenticated && (i + 1) % 8 === 0 && i !== items.length - 1) {
        out.push({ kind: 'inline-cta' });
      }
    });
    return out;
  }, [items, isAuthenticated]);

  return (
    <div className="bg-[var(--bg)]">
      {/* Hero */}
      <section className="bg-gradient-to-b from-[var(--bg-secondary)] to-[var(--bg)] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text)] sm:text-4xl lg:text-5xl">
            {heroH1 ?? 'Find Jobs'}
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

          {/* Search bar — keyword + location + Search button */}
          <div className="mt-6 grid gap-2 sm:grid-cols-[2fr_1.5fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <Input
                type="search"
                placeholder="Job title, skills, or company"
                value={filters.q ?? ''}
                onChange={(e) => onKeywordChange(e.target.value)}
                className="pl-9"
              />
              <span className="absolute top-1/2 right-2 -translate-y-1/2">
                <KeywordSyntaxHelp />
              </span>
            </div>
            <div className="relative">
              <MapPin className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <Input
                type="search"
                placeholder="Location (e.g. Bengaluru)"
                value={filters.location ?? ''}
                onChange={(e) => onLocationChange(e.target.value)}
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

          {/* Search history chips */}
          <JobSearchHistoryChips type="JOB" destination="/jobs" className="mt-4" hideWhenEmpty />
        </div>
      </section>

      {/* Results + sidebar */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[260px_1fr_300px]">
          {/* Filters sidebar (left rail) — minimal v1, full filter panel
              wired in Phase 19 when we extract the candidate-page panel. */}
          <aside className="hidden flex-col gap-3 lg:flex">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-white p-4 text-xs text-[var(--text-muted)]">
              Refine with the search bar above, or tweak the URL params (skills, experienceMin,
              jobType, workMode, etc.) — full filter panel comes in the next iteration.
            </div>
          </aside>

          {/* Results column */}
          <div className="min-w-0">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-[var(--text-secondary)]">
                {isLoading ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Loading…
                  </span>
                ) : (
                  <>
                    Showing <strong className="text-[var(--text)]">{items.length}</strong> of{' '}
                    <strong className="text-[var(--text)]">{total.toLocaleString('en-IN')}</strong>{' '}
                    {total === 1 ? 'job' : 'jobs'}
                    {cap ? (
                      <span className="text-[var(--text-muted)]">
                        {' '}
                        · capped at {cap} for guests
                      </span>
                    ) : null}
                  </>
                )}
              </p>
              <button
                type="button"
                aria-label="Open filters"
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs text-[var(--text-secondary)] lg:hidden"
              >
                <FilterIcon className="h-3.5 w-3.5" />
                Filters
              </button>
            </div>

            {isLoading && items.length === 0 ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No matching jobs"
                description="Try removing some filters, broadening the location, or use simpler keywords."
              />
            ) : (
              <ul className="space-y-3">
                {cards.map((c, i) =>
                  c.kind === 'inline-cta' ? (
                    <li key={`cta-${i}`}>
                      <InlineSignupCard />
                    </li>
                  ) : (
                    <li key={c.data.id}>
                      <PublicJobCard
                        job={c.data}
                        searchKeyword={filters.q}
                        isGuest={!isAuthenticated}
                      />
                    </li>
                  ),
                )}
              </ul>
            )}

            {/* Soft-wall after 30 results for guests. */}
            {loginRequired && <LoginToContinueBanner totalAvailable={total} shown={items.length} />}
            {isFetching && items.length > 0 && (
              <div className="mt-3 flex items-center justify-center gap-1 text-xs text-[var(--text-muted)]">
                <Loader2 className="h-3 w-3 animate-spin" /> Refreshing…
              </div>
            )}

            {/* Pagination — disabled past page 1 for guests until they sign up. */}
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

          {/* Right-rail sidebar — guest CTAs */}
          {!isAuthenticated && (
            <div className="space-y-4">
              <SidebarSignupCard />
              {/* Niche-search CTA — visible only when filters narrow
                  results below 10. Encourages saved-search alerts. */}
              <NarrowResultsCta
                resultCount={data?.pagination?.total ?? 0}
                redirectIntent={
                  typeof window !== 'undefined'
                    ? window.location.pathname + window.location.search
                    : undefined
                }
              />
            </div>
          )}
        </div>
      </section>

      {/* Mobile sticky bottom CTA */}
      <StickyMobileBottomCta />

      {/* Exit-intent modal — capped to once per 30 days for guests. */}
      {!isAuthenticated && <ExitIntentSaveSearchModal searchSnapshot={{ type: 'JOB', filters }} />}
    </div>
  );
}
