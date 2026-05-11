'use client';

/**
 * Footer mega-section — 3 stacked sections above the existing Footer:
 *
 *   Section 1: Find Jobs (CuratedType.JOB_LOCATION)
 *   Section 2: Popular Jobs (CuratedType.JOB_DEMAND + JOB_CATEGORY collapsed)
 *   Section 3: Jobs by Department (CuratedType.JOB_DEPARTMENT)
 *
 * Each section:
 *   - 5-column grid on desktop, collapses to 2 / 1 column on smaller widths.
 *   - Default 5 rows visible (so 25 items at most).
 *   - "View More" expands to show every row; "View Less" collapses back.
 *   - Click any link → same destination as the header mega-menu (drives
 *     through the curatedHref helper internally).
 *
 * Sections are separated by a thin horizontal divider for visual rhythm.
 * Data fetched once via TanStack Query (10min staleTime).
 */

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { curatedService, type CuratedListing, type CuratedType } from '@/services/curated.service';
import { curatedHref } from '@/lib/curated-href';

const ROWS_DEFAULT = 5;
const COLUMNS = 5;

interface SectionProps {
  heading: string;
  items: CuratedListing[];
}

function FooterSection({ heading, items }: SectionProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleCount = expanded ? items.length : Math.min(items.length, COLUMNS * ROWS_DEFAULT);
  const visible = items.slice(0, visibleCount);
  const hasMore = items.length > COLUMNS * ROWS_DEFAULT;

  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8">
      <h3 className="mb-5 text-sm font-bold tracking-wider text-[var(--text)] uppercase">
        {heading}
      </h3>
      <ul className="grid gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-5">
        {visible.map((item) => (
          <li key={item.id}>
            <Link
              href={curatedHref(item)}
              className="block rounded text-xs text-[var(--text-secondary)] transition-colors hover:text-[var(--primary)] sm:text-sm"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      {hasMore && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-primary inline-flex items-center gap-1 text-xs font-semibold hover:underline"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3" />
                View less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                View more
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}

export default function FooterMegaSection() {
  const { data } = useQuery({
    queryKey: ['curated-footer'],
    queryFn: () => curatedService.footer(),
    staleTime: 10 * 60 * 1000,
  });

  const findJobs = (data?.JOB_LOCATION ?? []) as CuratedListing[];
  const popularJobs = [
    ...((data?.JOB_DEMAND ?? []) as CuratedListing[]),
    ...((data?.JOB_CATEGORY ?? []) as CuratedListing[]),
  ].slice(0, 50);
  const byDepartment = (data?.JOB_DEPARTMENT ?? []) as CuratedListing[];

  // Hide entirely if curated data hasn't loaded yet — nothing to show.
  const hasAnyData = findJobs.length > 0 || popularJobs.length > 0 || byDepartment.length > 0;
  if (!hasAnyData) return null;

  return (
    <div className="bg-[var(--bg-secondary)]">
      <div className="mx-auto max-w-7xl">
        {findJobs.length > 0 && <FooterSection heading="Find Jobs" items={findJobs} />}
        {findJobs.length > 0 && popularJobs.length > 0 && (
          <hr className="mx-4 border-[var(--border)] sm:mx-6 lg:mx-8" />
        )}
        {popularJobs.length > 0 && <FooterSection heading="Popular Jobs" items={popularJobs} />}
        {popularJobs.length > 0 && byDepartment.length > 0 && (
          <hr className="mx-4 border-[var(--border)] sm:mx-6 lg:mx-8" />
        )}
        {byDepartment.length > 0 && (
          <FooterSection heading="Jobs by Department" items={byDepartment} />
        )}
      </div>
      <hr className="border-[var(--border)]" />
    </div>
  );
}
