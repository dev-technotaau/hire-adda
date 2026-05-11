'use client';

import { Check, Star } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { formatPaise, PLAN_BILLING_LABELS, type Plan } from '@/types/billing';

interface PlanCardProps {
  plan: Plan;
  /** Highlight a single plan as the recommended one even if `plan.highlight` is false. */
  forceHighlight?: boolean;
  /** Per-card primary CTA text. Default depends on plan type. */
  ctaText?: string;
  /** Override the CTA destination. Default = /billing/checkout/<code> for paid, /auth/register for free. */
  ctaHref?: string;
  /**
   * When true, the CTA switches to the upgrade flow (`/billing/upgrade/<code>`)
   * which previews pro-rata credit + carry-forward instead of starting a fresh
   * checkout. Used when the user already has an active plan.
   */
  upgradeMode?: boolean;
  /**
   * When true, this card is being shown immediately after employer onboarding.
   * Free plans send the user to the dashboard (the EMP_FREE entitlement was
   * auto-granted at signup), and the label is "Continue with Free Plan".
   */
  onboardingMode?: boolean;
  className?: string;
}

export default function PlanCard({
  plan,
  forceHighlight,
  ctaText,
  ctaHref,
  upgradeMode,
  onboardingMode,
  className,
}: PlanCardProps) {
  const highlight = forceHighlight ?? plan.highlight;

  // Decide CTA target
  const isFree = plan.basePricePaise === 0 && !plan.requiresQuote;
  const requiresQuote = plan.requiresQuote;
  const defaultHref = requiresQuote
    ? '/billing/quote'
    : isFree
      ? onboardingMode
        ? '/employer'
        : '/auth/register/employer'
      : upgradeMode
        ? `/billing/upgrade/${encodeURIComponent(plan.code)}`
        : `/billing/checkout/${encodeURIComponent(plan.code)}`;
  const href = ctaHref ?? defaultHref;
  const label =
    ctaText ??
    (requiresQuote
      ? 'Contact Sales'
      : isFree
        ? onboardingMode
          ? 'Continue with Free Plan'
          : 'Start Free'
        : upgradeMode
          ? `Upgrade to ${plan.name}`
          : `Buy ${plan.name}`);

  // Human-readable price string
  let priceLine: string;
  if (requiresQuote) {
    priceLine = 'Custom';
  } else if (plan.basePricePaise === 0) {
    priceLine = 'Free';
  } else {
    priceLine = formatPaise(plan.basePricePaise, plan.currency);
  }
  const cycleSuffix = requiresQuote
    ? ''
    : plan.basePricePaise === 0
      ? ''
      : PLAN_BILLING_LABELS[plan.billingCycle];

  // Validity blurb
  const validityLine =
    plan.billingCycle === 'MONTHLY'
      ? 'Auto-renewed monthly'
      : plan.validityDays
        ? `${plan.validityDays} days validity`
        : 'Custom validity';

  return (
    <Card
      variant={highlight ? 'elevated' : 'bordered'}
      padding="lg"
      className={cn(
        'relative flex h-full flex-col gap-5 transition-transform',
        highlight && 'border-primary ring-primary/30 ring-2 md:scale-[1.02]',
        className,
      )}
    >
      {plan.badgeText && (
        <div
          className={cn(
            'absolute -top-3 right-4 rounded-full px-3 py-1 text-xs font-semibold shadow-sm',
            highlight ? 'bg-primary text-white' : 'bg-[var(--bg-secondary)] text-[var(--text)]',
          )}
        >
          <span className="inline-flex items-center gap-1">
            {highlight && <Star className="h-3 w-3 fill-current" />}
            {plan.badgeText}
          </span>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-xl font-bold text-[var(--text)]">{plan.name}</h3>
        {plan.shortDescription && (
          <p className="text-sm text-[var(--text-muted)]">{plan.shortDescription}</p>
        )}
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-extrabold text-[var(--text)]">{priceLine}</span>
        {cycleSuffix && (
          <span className="text-sm font-medium text-[var(--text-muted)]">{cycleSuffix}</span>
        )}
      </div>

      <p className="text-xs text-[var(--text-muted)]">
        {validityLine}
        {plan.basePricePaise > 0 && ' · Tax inclusive'}
      </p>

      <ul className="flex-1 space-y-2 text-sm">
        {plan.features
          .filter((f) => f.included)
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((f) => (
            <li key={f.key} className="flex items-start gap-2">
              <Check className="text-primary mt-0.5 h-4 w-4 flex-none" />
              <span className="text-[var(--text)]">{f.label}</span>
            </li>
          ))}
      </ul>

      <Link href={href} className="mt-auto block">
        <Button variant={highlight ? 'primary' : 'outline'} className="w-full" aria-label={label}>
          {label}
        </Button>
      </Link>
    </Card>
  );
}
