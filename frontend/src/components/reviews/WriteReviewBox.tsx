'use client';

/**
 * WriteReviewBox — bounded CTA that sits below the "Reviews by job
 * profiles" preview on the company detail page. Clicks through to the
 * dedicated write-review page (slug-aware so the form prefills).
 */
import Link from 'next/link';
import { PenLine, ArrowRight } from 'lucide-react';

interface Props {
  companySlug: string;
  companyName?: string;
}

export default function WriteReviewBox({ companySlug, companyName }: Props) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--primary)]/40 bg-[var(--primary)]/5 p-5 sm:p-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/15 text-[var(--primary)]">
            <PenLine className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[var(--text)]">Share your experience</h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Help candidates make informed career decisions
              {companyName ? ` about ${companyName}` : ''}. Reviews are anonymous.
            </p>
          </div>
        </div>
        <Link
          href={`/companies/${encodeURIComponent(companySlug)}/reviews/write`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white shadow transition-colors hover:bg-[var(--primary-dark,_#1d4ed8)]"
        >
          Write a review
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
