'use client';

/**
 * WhatsappSupportCard — surfaces the actual WhatsApp support channel to
 * users whose plan includes WhatsApp support.
 *
 * Tier detection is automatic from the entitlement snapshot:
 *   - `feature.whatsapp_priority` OR `feature.priority_support` OR
 *     `feature.dedicated_support`  → priority tier (≤30 min copy, badge)
 *   - `feature.whatsapp_support`   → standard tier (≤few hours copy)
 *   - none of the above            → renders nothing (use
 *                                    PriorityWhatsappBanner for upsell)
 *
 * Wrap in a host-page check before mounting if you want to skip the
 * fetch entirely for unauthenticated visitors.
 */

import { useMemo } from 'react';
import { MessageCircle, Phone, Sparkles } from 'lucide-react';
import { useEntitlements } from '@/hooks/use-entitlements';
import { useAuthStore } from '@/store/auth.store';
import {
  WHATSAPP_SUPPORT,
  WHATSAPP_PRIORITY_SLA,
  WHATSAPP_STANDARD_SLA,
  WHATSAPP_AVAILABILITY,
  buildWhatsappChatUrl,
} from '@/constants/support';

interface WhatsappSupportCardProps {
  /**
   * Override tier detection. Useful for places where you want to force
   * the priority styling (e.g. premium-only pages).
   */
  forceTier?: 'priority' | 'standard';
  /** Optional preset shown alongside the chat button. */
  contextLabel?: string;
  /** Compact rendering (smaller padding, no SLA strapline). */
  compact?: boolean;
  /** Wrapper class extension. */
  className?: string;
}

export default function WhatsappSupportCard({
  forceTier,
  contextLabel,
  compact = false,
  className,
}: WhatsappSupportCardProps) {
  const { hasFeature, isLoading } = useEntitlements();
  const user = useAuthStore((s) => s.user);

  const tier: 'priority' | 'standard' | null = useMemo(() => {
    if (forceTier) return forceTier;
    if (
      hasFeature('feature.whatsapp_priority') ||
      hasFeature('feature.priority_support') ||
      hasFeature('feature.dedicated_support')
    )
      return 'priority';
    if (hasFeature('feature.whatsapp_support')) return 'standard';
    return null;
  }, [hasFeature, forceTier]);

  // Don't render anything while loading (avoid flash) or for users who
  // don't hold any WhatsApp-support entitlement. The upsell banner is a
  // separate component used by the same hosting pages.
  if (isLoading || !tier) return null;

  // Pre-fill the WhatsApp chat with a tag the support agent can use to
  // triage. Includes plan tier and the user's name + email so they don't
  // have to re-state who they are.
  const presetMessage = (() => {
    const tierLabel = tier === 'priority' ? 'Priority' : 'Standard';
    const name = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email : '';
    const lines = [
      `Hi Hire Adda support — I have a question.`,
      `Tier: ${tierLabel}`,
      name ? `Name: ${name}` : '',
      user?.email ? `Email: ${user.email}` : '',
    ].filter(Boolean);
    return lines.join('\n');
  })();

  const sla = tier === 'priority' ? WHATSAPP_PRIORITY_SLA : WHATSAPP_STANDARD_SLA;
  const headline = tier === 'priority' ? 'Priority WhatsApp Support' : 'WhatsApp Support';
  const accent =
    tier === 'priority'
      ? 'border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 dark:border-emerald-900/30 dark:from-emerald-900/20 dark:to-teal-900/20'
      : 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/30 dark:bg-emerald-900/10';

  return (
    <div
      className={`flex w-full flex-col gap-3 rounded-xl border ${accent} ${
        compact ? 'p-3' : 'p-4'
      } ${className ?? ''}`}
      role="region"
      aria-label="WhatsApp support"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-emerald-600 text-white shadow">
          <MessageCircle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-emerald-900 dark:text-emerald-100">{headline}</p>
            {tier === 'priority' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-700 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
                <Sparkles className="h-3 w-3" />
                Priority
              </span>
            )}
          </div>
          {!compact && (
            <p className="mt-0.5 text-xs text-emerald-800 dark:text-emerald-200/80">
              {sla} · {WHATSAPP_AVAILABILITY}
            </p>
          )}
          {contextLabel && (
            <p className="mt-1 text-xs text-emerald-900/70 dark:text-emerald-200/60">
              {contextLabel}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <a
          href={buildWhatsappChatUrl(presetMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow"
        >
          <MessageCircle className="h-4 w-4" />
          Chat on WhatsApp
        </a>
        <a
          href={WHATSAPP_SUPPORT.telHref}
          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-white/60 px-3 py-1.5 text-sm font-medium text-emerald-900 transition-colors hover:bg-white dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-100"
        >
          <Phone className="h-3.5 w-3.5" />
          {WHATSAPP_SUPPORT.display}
        </a>
      </div>
    </div>
  );
}
