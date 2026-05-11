'use client';

/**
 * ReviewsByJobProfilesPreview — top-4 job-profile rows + "View all"
 * link. Embedded inside the company-detail Overview tab (public AND
 * private employer profile preview).
 *
 * Empty state: when the company has 0 reviews, render a single
 * encouragement row with "Be the first to review" copy.
 */
import Link from 'next/link';
import { Star, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TopJobProfile } from '@/types/review';

interface Props {
  companySlug: string;
  topJobProfiles: TopJobProfile[];
  totalReviews: number;
  hideWriteButton?: boolean;
  hideViewAll?: boolean;
}

export default function ReviewsByJobProfilesPreview({
  companySlug,
  topJobProfiles,
  totalReviews,
  hideViewAll,
}: Props) {
  const rows = topJobProfiles.slice(0, 4);
  const reviewsHref = `/companies/${encodeURIComponent(companySlug)}/reviews`;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-[var(--text)]">Reviews by job profiles</h3>
        {!hideViewAll && totalReviews > 0 && (
          <Link
            href={reviewsHref}
            className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:underline"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>

      {rows.length > 0 ? (
        <div className="divide-y divide-[var(--border)]">
          {rows.map((row) => (
            <Link
              key={row.designation}
              href={`${reviewsHref}?designation=${encodeURIComponent(row.designation)}`}
              className="-mx-1 flex items-center justify-between gap-3 rounded-md px-1 py-3 transition-colors hover:bg-[var(--bg-secondary)]"
            >
              <span className="truncate font-medium text-[var(--text)]">{row.designation}</span>
              <span className="flex shrink-0 items-center gap-2 text-sm text-[var(--text-secondary)]">
                <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:border-amber-700/30 dark:bg-amber-900/10 dark:text-amber-200">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {row.avgRating.toFixed(1)}
                </span>
                <span className="tabular-nums">
                  {row.count} {row.count === 1 ? 'review' : 'reviews'}
                </span>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-secondary)] py-8 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            No reviews yet — be the first to share your experience.
          </p>
        </div>
      )}
    </div>
  );
}
