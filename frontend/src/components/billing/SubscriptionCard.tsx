import Link from 'next/link';
import { CheckCircle2, Pause, XCircle, AlertTriangle } from 'lucide-react';
import type { SubscriptionListItem } from '@/types/subscription';
import { formatPaise } from '@/types/billing';

interface Props {
  subscription: SubscriptionListItem;
}

const STATUS_TONE: Record<
  string,
  { color: string; bg: string; icon: React.ComponentType<{ size?: number }>; label: string }
> = {
  ACTIVE: {
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    icon: CheckCircle2,
    label: 'Active',
  },
  AUTHENTICATED: {
    color: 'text-blue-700',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: CheckCircle2,
    label: 'Authenticated',
  },
  PAUSED: {
    color: 'text-amber-700',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    icon: Pause,
    label: 'Paused',
  },
  HALTED: {
    color: 'text-red-700',
    bg: 'bg-red-50 dark:bg-red-900/20',
    icon: AlertTriangle,
    label: 'Halted',
  },
  CANCELLED: {
    color: 'text-gray-700',
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    icon: XCircle,
    label: 'Cancelled',
  },
  PENDING_CANCEL: {
    color: 'text-amber-700',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    icon: AlertTriangle,
    label: 'Cancel scheduled',
  },
  COMPLETED: {
    color: 'text-gray-700',
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    icon: CheckCircle2,
    label: 'Completed',
  },
  EXPIRED: {
    color: 'text-gray-700',
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    icon: XCircle,
    label: 'Expired',
  },
  CREATED: {
    color: 'text-amber-700',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    icon: AlertTriangle,
    label: 'Pending',
  },
};

export default function SubscriptionCard({ subscription }: Props) {
  const tone = STATUS_TONE[subscription.status] ?? STATUS_TONE.CREATED;
  const Icon = tone.icon;
  const planName = subscription.plan?.name ?? 'Plan';

  return (
    <Link
      href={`/billing/subscriptions/${subscription.id}`}
      className="block rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5 transition hover:border-blue-500 hover:bg-[var(--bg)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-[var(--text)]">{planName}</h3>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {subscription.shortUrl ? 'Razorpay subscription' : 'Local subscription'}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${tone.bg} ${tone.color}`}
        >
          <Icon size={12} />
          {tone.label}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-xs text-[var(--text-secondary)]">Auto-renew</dt>
          <dd className="font-medium text-[var(--text)]">
            {subscription.autoRenew ? 'On' : 'Off'}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--text-secondary)]">Next charge</dt>
          <dd className="font-medium text-[var(--text)]">
            {subscription.nextChargeAt
              ? new Date(subscription.nextChargeAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--text-secondary)]">Cycles paid</dt>
          <dd className="font-medium text-[var(--text)]">
            {subscription.paidCount}/{subscription.totalCount ?? '∞'}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--text-secondary)]">Period ends</dt>
          <dd className="font-medium text-[var(--text)]">
            {subscription.currentEnd
              ? new Date(subscription.currentEnd).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : '—'}
          </dd>
        </div>
      </dl>

      {subscription.plan?.basePricePaise ? (
        <p className="mt-4 text-base font-semibold text-[var(--text)]">
          {formatPaise(subscription.plan.basePricePaise, subscription.plan.currency)}
        </p>
      ) : null}
    </Link>
  );
}
