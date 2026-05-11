'use client';

import { MessageCircle } from 'lucide-react';
import { useEntitlements } from '@/hooks/use-entitlements';
import { useUpgradeModal } from '@/components/billing/UpgradeModal';
import WhatsappSupportCard from '@/components/support/WhatsappSupportCard';

interface Props {
  /**
   * Drives both the entitlement check and the modal preset:
   *   - 'candidate' → `feature.whatsapp_priority` (CAND_PREMIUM)
   *   - 'employer'  → `feature.priority_support` (CVDB_PRO and above; falls
   *                    back to EMP_PREMIUM via the modal preset map)
   */
  role: 'candidate' | 'employer';
}

/**
 * Smart WhatsApp support strip.
 *
 *   - When the user already holds priority/standard WhatsApp support
 *     (`feature.whatsapp_priority` | `feature.whatsapp_support` |
 *     `feature.priority_support` | `feature.dedicated_support`), renders
 *     the real `WhatsappSupportCard` with the chat-link + number.
 *   - Otherwise falls back to the upsell banner that opens the upgrade
 *     modal (existing behaviour preserved for non-entitled users).
 *
 * Used on /candidate/help and /employer/help today; safe to drop in on
 * any page where you want to surface priority support contextually.
 */
export default function PriorityWhatsappBanner({ role }: Props) {
  const { hasFeature, isLoading } = useEntitlements();
  const upgrade = useUpgradeModal();

  // Hold paint until entitlements resolve to avoid a flash of the upsell
  // for already-entitled users.
  if (isLoading) return null;

  // Entitled? Show the real support card instead of the upsell.
  const hasWhatsappSupport =
    hasFeature('feature.whatsapp_priority') ||
    hasFeature('feature.whatsapp_support') ||
    hasFeature('feature.priority_support') ||
    hasFeature('feature.dedicated_support');
  if (hasWhatsappSupport) {
    return <WhatsappSupportCard />;
  }

  // Otherwise: upsell. Modal preset switches based on role.
  const featureKey =
    role === 'candidate' ? 'feature.whatsapp_priority' : 'feature.priority_support';

  const headline =
    role === 'candidate' ? 'Get priority WhatsApp support' : 'Get priority recruiter support';
  const subline =
    role === 'candidate'
      ? "Premium members get replies in under 30 minutes — much faster than the free tier's 24h SLA."
      : 'CV Pro and Premium employers get triaged ahead of free-tier requests across email + WhatsApp.';

  return (
    <>
      <button
        type="button"
        onClick={() => upgrade.open({ feature: featureKey })}
        className="group flex w-full items-start gap-3 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 text-left transition-colors hover:from-emerald-100 hover:to-teal-100 dark:border-emerald-900/30 dark:from-emerald-900/20 dark:to-teal-900/20"
      >
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-emerald-600 text-white shadow">
          <MessageCircle className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-emerald-900 dark:text-emerald-100">{headline}</p>
          <p className="mt-0.5 text-sm text-emerald-800 dark:text-emerald-200/80">{subline}</p>
        </div>
        <span className="hidden items-center gap-1 self-center rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-white transition-colors group-hover:bg-emerald-800 sm:inline-flex">
          See plans
        </span>
      </button>
      {upgrade.modal}
    </>
  );
}
