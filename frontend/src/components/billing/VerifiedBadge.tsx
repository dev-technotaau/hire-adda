'use client';

import { BadgeCheck, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEntitlements } from '@/hooks/use-entitlements';
import { useUpgradeModal } from '@/components/billing/UpgradeModal';

interface Props {
  /**
   * When true, the *current user* is the candidate being shown — render a
   * "Get verified" CTA pill if they don't have Premium. When false (e.g.
   * employer viewing someone else's profile), render NOTHING for unverified
   * candidates.
   */
  isOwnProfile?: boolean;
  /**
   * If known externally (e.g. derived from a public candidate row), pass it
   * here. When omitted, falls back to the current user's entitlement
   * snapshot. Recruiter-facing pages should always pass this explicitly.
   */
  isVerified?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: { icon: 14, badge: 'px-1.5 py-0.5 text-[10px]', gap: 'gap-1' },
  md: { icon: 16, badge: 'px-2 py-0.5 text-[11px]', gap: 'gap-1.5' },
  lg: { icon: 18, badge: 'px-2.5 py-1 text-xs', gap: 'gap-1.5' },
};

/**
 * Verified candidate badge — drives a major Premium-conversion lever.
 *
 * Behaviour:
 *   - Verified user → solid blue badge with checkmark + "Verified" label.
 *   - Free user looking at their own profile → faded outline badge with
 *     a "Get verified" pill that opens the upgrade modal targeted at
 *     `feature.candidate_verified_badge`.
 *   - Free user looked at by someone else → renders nothing (we only show
 *     a positive trust signal; the absence is the implicit message).
 */
export default function VerifiedBadge({
  isOwnProfile = false,
  isVerified,
  size = 'md',
  className,
}: Props) {
  const { hasFeature } = useEntitlements();
  const upgrade = useUpgradeModal();

  // Source of truth: prefer explicit prop, else entitlement snapshot.
  const verified =
    typeof isVerified === 'boolean' ? isVerified : hasFeature('feature.candidate_verified_badge');
  const sizing = SIZES[size];

  if (verified) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full bg-blue-100 font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-200',
          sizing.badge,
          sizing.gap,
          className,
        )}
        title="Verified candidate — Hire Adda Premium"
      >
        <BadgeCheck size={sizing.icon} className="text-blue-600" strokeWidth={2.5} />
        Verified
      </span>
    );
  }

  // Free user — only render the upsell pill on their OWN profile.
  if (!isOwnProfile) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => upgrade.open({ feature: 'feature.candidate_verified_badge' })}
        className={cn(
          'inline-flex items-center rounded-full border border-dashed border-amber-400 bg-amber-50 font-semibold text-amber-700 transition-all hover:border-amber-500 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-200',
          sizing.badge,
          sizing.gap,
          className,
        )}
        title="Get verified with Premium — recruiters trust verified profiles 3× more"
      >
        <ShieldCheck size={sizing.icon} className="text-amber-600" />
        Get Verified
      </button>
      {upgrade.modal}
    </>
  );
}
