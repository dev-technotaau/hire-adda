'use client';

import Link from 'next/link';
import { useEntitlements } from '@/hooks/use-entitlements';
import { usePricingHref } from '@/lib/pricing-href';
import type { ResourceUnit } from '@/types/entitlement';

interface Props {
  /** Resource units to show in the bar. Defaults to JOB_POST + CV_UNLOCK + APPLICATIONS. */
  units?: ResourceUnit[];
  className?: string;
}

const UNIT_LABEL: Partial<Record<ResourceUnit, string>> = {
  JOB_POST: 'Job posts',
  CV_UNLOCK: 'CV unlocks',
  APPLICATIONS: 'Applications',
  SEARCH_RESULT: 'Searches',
  SEAT: 'Seats',
};

export default function QuotaBar({
  units = ['JOB_POST', 'CV_UNLOCK', 'APPLICATIONS'],
  className,
}: Props) {
  const { snapshot: snap, isLoading } = useEntitlements();
  const pricingHref = usePricingHref();
  if (isLoading || !snap) return null;
  if (!snap.hasAnyActive) {
    return (
      <Link
        href={pricingHref}
        // Background bumped to amber-100 (was amber-50) + text to
        // amber-950 (was amber-800) + ring-1 amber-300 for definition.
        // Previous combo was WCAG-AA on paper but visually faded into
        // the warm-toned dashboard chrome — the pill kept blending in.
        // Dark mode classes unchanged.
        className={`inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-950 ring-1 ring-amber-300 transition-colors ring-inset hover:bg-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-700/40 ${className ?? ''}`}
      >
        No active plan — Upgrade →
      </Link>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ''}`}>
      {units.map((unit) => {
        const r = snap.resources[unit];
        if (!r) return null;
        const remaining = r.totalRemaining;
        const tone =
          remaining === 0
            ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
            : remaining <= Math.max(1, Math.floor((r.totalAllocated ?? 0) * 0.2))
              ? 'bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300'
              : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
        return (
          <span
            key={unit}
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}
            title={`${r.totalRemaining} remaining of ${r.totalAllocated}`}
          >
            {UNIT_LABEL[unit] ?? unit}: <strong>{remaining}</strong>
          </span>
        );
      })}
    </div>
  );
}
