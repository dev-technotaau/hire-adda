'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Calendar, AlertCircle, CheckCircle2, Repeat } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { useEntitlements } from '@/hooks/use-entitlements';
import type { ResolvedEntitlement, ResourceUnit } from '@/types/entitlement';

const UNIT_LABELS: Partial<Record<ResourceUnit, string>> = {
  CV_UNLOCK: 'CV unlocks',
  JOB_POST: 'job posts',
  APPLICATIONS: 'applications',
  SEARCH_RESULT: 'search results',
  SEAT: 'seats',
  BOOST_DAYS: 'boost days',
  VENDOR_LEAD: 'leads',
  MATCHED_PROFILE_EMAIL: 'matched CVs',
  JOB_DAYS_LIVE: 'job listing days',
};

export default function CreditsDashboardPage() {
  const { snapshot, isLoading, isError, error, refetch } = useEntitlements();
  // Stable "now" timestamp for the render — keeps `EntitlementCard` pure.
  // Lazy-init once; entitlement-changed Socket events re-fetch and the page
  // re-renders with a fresh snapshot, but the day-count is acceptable to
  // round to render time within a session.
  const [renderedAt] = useState(() => Date.now());

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }
  if (isError) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-3xl px-4 py-10">
          <Card padding="lg">
            <p className="text-[var(--error)]">
              {(error as Error)?.message ?? 'Failed to load credits.'}
            </p>
            <Button variant="outline" className="mt-3" onClick={() => void refetch()}>
              Retry
            </Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const ents = snapshot?.entitlements ?? [];
  const totalsByUnit = snapshot?.resources ?? {};

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link
          href="/billing/orders"
          className="text-primary mb-6 inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back to billing
        </Link>

        <h1 className="text-3xl font-bold text-[var(--text)]">Credits &amp; quotas</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Live usage across your active plans. Updated in real time as you consume.
        </p>

        {ents.length === 0 ? (
          <Card padding="lg" className="mt-6 text-center">
            <Sparkles className="text-primary mx-auto h-10 w-10" />
            <h2 className="mt-3 text-lg font-semibold text-[var(--text)]">No active plan</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Pick a plan to start posting jobs, unlocking CVs, and accessing premium features.
            </p>
            <Link href="/pricing" className="mt-4 inline-block">
              <Button variant="primary">View plans</Button>
            </Link>
          </Card>
        ) : (
          <>
            {/* Aggregated totals */}
            {Object.keys(totalsByUnit).length > 0 && (
              <Card padding="lg" className="mt-6">
                <h2 className="mb-3 text-base font-semibold text-[var(--text)]">
                  Total remaining (across all active plans)
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {Object.entries(totalsByUnit).map(([unit, r]) => {
                    if (!r) return null;
                    const label =
                      UNIT_LABELS[unit as ResourceUnit] ?? unit.toLowerCase().replace(/_/g, ' ');
                    const pct =
                      r.totalAllocated === 0
                        ? 0
                        : Math.round((r.totalConsumed / r.totalAllocated) * 100);
                    const tone = pct >= 90 ? 'red' : pct >= 70 ? 'yellow' : 'primary';
                    return (
                      <div key={unit} className="rounded-lg border border-[var(--border)] p-3">
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm font-medium text-[var(--text-muted)]">
                            {label}
                          </span>
                          <span className="text-2xl font-bold text-[var(--text)]">
                            {r.totalRemaining}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)]">
                          of {r.totalAllocated} ({r.totalConsumed} used)
                        </p>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-secondary)]">
                          <div
                            className={`h-full rounded-full transition-all ${
                              tone === 'red'
                                ? 'bg-red-500'
                                : tone === 'yellow'
                                  ? 'bg-yellow-500'
                                  : 'bg-primary'
                            }`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Per-entitlement breakdown */}
            <h2 className="mt-6 mb-3 text-lg font-semibold text-[var(--text)]">Active plans</h2>
            <div className="space-y-3">
              {ents.map((ent) => (
                <EntitlementCard key={ent.id} ent={ent} now={renderedAt} />
              ))}
            </div>

            <Card padding="md" className="mt-6 border-blue-300 bg-blue-50">
              <div className="flex items-start gap-2 text-sm text-blue-900">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
                <p>
                  Quotas reset on each billing cycle. Unused units carry forward when you upgrade
                  (subject to per-resource caps).
                </p>
              </div>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function EntitlementCard({ ent, now }: { ent: ResolvedEntitlement; now: number }) {
  const expiry = new Date(ent.validUntil);
  const daysLeft = Math.max(0, Math.ceil((expiry.getTime() - now) / 86_400_000));
  const expiringSoon = daysLeft <= 7;
  const features = ent.features.filter((f) => f.included && f.kind === 'BOOLEAN').slice(0, 6);

  return (
    <Card padding="lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-[var(--text-muted)]">{ent.planCode}</p>
          <h3 className="text-xl font-bold text-[var(--text)]">{ent.planName}</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            <Calendar className="mr-1 inline h-3 w-3" />
            Valid till{' '}
            {expiry.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
            {expiringSoon && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-900">
                <AlertCircle className="h-3 w-3" /> {daysLeft} days left
              </span>
            )}
            {ent.autoRenew && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-900">
                <Repeat className="h-3 w-3" /> auto-renews
              </span>
            )}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-900">
          <CheckCircle2 className="h-3 w-3" /> active
        </span>
      </div>

      {ent.resources.length > 0 && (
        <div className="mt-4 space-y-3">
          {ent.resources.map((r) => {
            const label = UNIT_LABELS[r.unit] ?? r.unit.toLowerCase().replace(/_/g, ' ');
            const total = r.allocated + r.carriedForward;
            const pct = total === 0 ? 0 : Math.round((r.consumed / total) * 100);
            const tone = pct >= 90 ? 'red' : pct >= 70 ? 'yellow' : 'primary';
            return (
              <div key={r.unit}>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">{label}</span>
                  <span className="font-medium text-[var(--text)]">
                    {r.remaining}{' '}
                    <span className="text-[var(--text-muted)]">
                      of {total}
                      {r.carriedForward > 0 ? ` (incl. +${r.carriedForward} carried)` : ''}
                    </span>
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-secondary)]">
                  <div
                    className={`h-full rounded-full transition-all ${
                      tone === 'red'
                        ? 'bg-red-500'
                        : tone === 'yellow'
                          ? 'bg-yellow-500'
                          : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {features.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {features.map((f) => (
            <span
              key={f.key}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-secondary)] px-2 py-0.5 text-xs text-[var(--text)]"
            >
              <CheckCircle2 className="text-primary h-3 w-3" /> {f.label}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--border)] pt-3 text-sm">
        <Link href="/pricing">
          <Button variant="outline" size="sm">
            Upgrade
          </Button>
        </Link>
        {ent.autoRenew && (
          <Link href="/billing/subscriptions">
            <Button variant="outline" size="sm">
              Manage auto-renew
            </Button>
          </Link>
        )}
        <Link href="/billing/orders">
          <Button variant="outline" size="sm">
            Order history
          </Button>
        </Link>
      </div>
    </Card>
  );
}
