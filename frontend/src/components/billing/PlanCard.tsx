'use client';

import { Check, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
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

  // Decide CTA target (logic unchanged from previous implementation).
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

  // Human-readable price string (logic unchanged).
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

  // Validity blurb (logic unchanged).
  const validityLine =
    plan.billingCycle === 'MONTHLY'
      ? 'Auto-renewed monthly'
      : plan.validityDays
        ? `${plan.validityDays} days validity`
        : 'Custom validity';

  const includedFeatures = plan.features
    .filter((f) => f.included)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <article
      className={cn(
        // Base — clean white card with rounded corners. The `group` token
        // is used by the hover micro-interaction below.
        'group relative isolate flex h-full flex-col rounded-2xl bg-white',
        // Highlighted plans get a confident primary border + ring + shadow,
        // and bump up slightly on desktop so the eye anchors on them first.
        // Non-highlighted plans get a quiet border that warms on hover.
        highlight
          ? 'border-primary ring-primary/30 border-2 shadow-xl ring-2 lg:scale-[1.03]'
          : 'hover:border-primary/50 border border-[var(--border)] shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg',
        className,
      )}
    >
      {/* Soft top-gradient backdrop for highlighted plans — adds depth
          without overpowering the content. */}
      {highlight && (
        <div
          aria-hidden="true"
          className="from-primary/8 via-primary/3 pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 rounded-t-2xl bg-gradient-to-b to-transparent"
        />
      )}

      {/* Badge — centered ribbon for highlighted plans (premium feel),
          subtle pill top-right for everything else (custom, etc.). */}
      {plan.badgeText &&
        (highlight ? (
          <div className="absolute -top-3.5 left-1/2 z-10 -translate-x-1/2">
            <span className="bg-primary inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold tracking-wider text-white uppercase shadow-md">
              <Sparkles className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
              {plan.badgeText}
            </span>
          </div>
        ) : (
          <div className="absolute -top-3 right-5 z-10">
            <span className="inline-flex items-center rounded-full bg-[var(--bg-secondary)] px-3 py-1 text-xs font-semibold text-[var(--text)] shadow-sm ring-1 ring-[var(--border)]">
              {plan.badgeText}
            </span>
          </div>
        ))}

      {/* Card body — three vertical sections: header, price+CTA, features. */}
      <div className="flex flex-1 flex-col gap-6 p-6 sm:p-7">
        {/* ── Header — plan name + tagline ── */}
        <header className="space-y-2">
          <h3 className="text-xl font-bold tracking-tight text-[var(--text)]">{plan.name}</h3>
          {plan.shortDescription && (
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              {plan.shortDescription}
            </p>
          )}
        </header>

        {/* ── Price block — the dominating visual element ── */}
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-extrabold tracking-tight text-[var(--text)] sm:text-5xl">
              {priceLine}
            </span>
            {cycleSuffix && (
              <span className="text-sm font-medium text-[var(--text-muted)]">{cycleSuffix}</span>
            )}
          </div>
          {/* Validity + tax-inclusive — surfaced as quiet chips, not body text */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-full bg-[var(--bg-secondary)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
              {validityLine}
            </span>
            {plan.basePricePaise > 0 && (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200 ring-inset">
                GST inclusive
              </span>
            )}
            {requiresQuote && (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200 ring-inset">
                Quote-based
              </span>
            )}
          </div>
        </div>

        {/* ── Primary CTA — placed BEFORE features (modern SaaS pattern;
              keeps the action above the fold for plans with many features). */}
        <Link href={href} className="block">
          <Button
            variant={highlight ? 'primary' : 'outline'}
            size="lg"
            className="w-full"
            aria-label={label}
          >
            {label}
          </Button>
        </Link>

        {/* ── Divider before the feature list — gives the section a
              clear visual break without using a hairline that could
              read as a "container edge". */}
        <div className="-mx-6 border-t border-[var(--border)] sm:-mx-7" aria-hidden="true" />

        {/* ── Feature list — what you get ── */}
        <div className="flex flex-1 flex-col gap-3">
          <p className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
            What&apos;s included
          </p>
          <ul className="space-y-2.5">
            {includedFeatures.map((f) => (
              <li key={f.key} className="flex items-start gap-2.5 text-sm leading-snug">
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full',
                    highlight ? 'bg-primary text-white' : 'bg-primary/10 text-primary',
                  )}
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                <span className="text-[var(--text)]">{f.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
