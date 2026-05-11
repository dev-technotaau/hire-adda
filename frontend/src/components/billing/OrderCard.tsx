import Link from 'next/link';
import { CheckCircle2, Clock, XCircle, RotateCw } from 'lucide-react';
import type { OrderListItem } from '@/types/order';
import { formatPaise } from '@/types/billing';

interface Props {
  order: OrderListItem;
  href?: string;
}

const STATUS_TONE: Record<
  string,
  { color: string; bg: string; icon: React.ComponentType<{ size?: number }> }
> = {
  PAID: {
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    icon: CheckCircle2,
  },
  REFUNDED: { color: 'text-blue-700', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: RotateCw },
  PARTIALLY_REFUNDED: {
    color: 'text-blue-700',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: RotateCw,
  },
  CREATED: { color: 'text-amber-700', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: Clock },
  ATTEMPTED: { color: 'text-amber-700', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: Clock },
  FAILED: { color: 'text-red-700', bg: 'bg-red-50 dark:bg-red-900/20', icon: XCircle },
  CANCELLED: { color: 'text-gray-700', bg: 'bg-gray-50 dark:bg-gray-900/20', icon: XCircle },
  EXPIRED: { color: 'text-gray-700', bg: 'bg-gray-50 dark:bg-gray-900/20', icon: XCircle },
  REFUND_PENDING: { color: 'text-blue-700', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: RotateCw },
  DISPUTED: { color: 'text-red-700', bg: 'bg-red-50 dark:bg-red-900/20', icon: XCircle },
  FRAUD_FLAGGED: { color: 'text-red-700', bg: 'bg-red-50 dark:bg-red-900/20', icon: XCircle },
};

export default function OrderCard({ order, href }: Props) {
  const tone = STATUS_TONE[order.status] ?? STATUS_TONE.CREATED;
  const Icon = tone.icon;
  const planName = order.plan?.name ?? 'Plan purchase';

  const inner = (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-[var(--text)]">{planName}</h3>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          {new Date(order.createdAt).toLocaleString('en-IN')}
        </p>
        <p className="mt-2 text-base font-semibold text-[var(--text)]">
          {formatPaise(order.totalPaise)}
        </p>
      </div>
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${tone.bg} ${tone.color}`}
      >
        <Icon size={12} />
        {order.status.replace(/_/g, ' ')}
      </span>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 transition hover:border-blue-500 hover:bg-[var(--bg)]"
      >
        {inner}
      </Link>
    );
  }
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
      {inner}
    </div>
  );
}
