'use client';

import Link from 'next/link';

interface BillingNavProps {
  active: string;
}

export default function BillingNav({ active }: BillingNavProps) {
  const items: { key: string; label: string; href: string }[] = [
    { key: 'dashboard', label: 'Dashboard', href: '/super-admin/billing' },
    { key: 'orders', label: 'Orders', href: '/super-admin/billing/orders' },
    { key: 'transactions', label: 'Transactions', href: '/super-admin/billing/transactions' },
    { key: 'subscriptions', label: 'Subscriptions', href: '/super-admin/billing/subscriptions' },
    { key: 'refunds', label: 'Refunds', href: '/super-admin/billing/refunds' },
    { key: 'settlements', label: 'Settlements', href: '/super-admin/billing/settlements' },
    { key: 'disputes', label: 'Disputes', href: '/super-admin/billing/disputes' },
    { key: 'plans', label: 'Plans', href: '/super-admin/billing/plans' },
    { key: 'coupons', label: 'Coupons', href: '/super-admin/billing/coupons' },
    { key: 'quotes', label: 'Quotes', href: '/super-admin/billing/quotes' },
    { key: 'fraud', label: 'Fraud', href: '/super-admin/billing/fraud' },
    { key: 'webhooks', label: 'Webhooks', href: '/super-admin/billing/webhooks' },
    { key: 'audit', label: 'Audit', href: '/super-admin/billing/audit' },
    { key: 'ledger', label: 'Ledger', href: '/super-admin/billing/ledger' },
    { key: 'users', label: 'Users', href: '/super-admin/billing/users' },
    { key: 'settings', label: 'Settings', href: '/super-admin/billing/settings' },
  ];
  return (
    <nav className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-2">
      {items.map((it) => (
        <Link
          key={it.key}
          href={it.href}
          className={`rounded-full px-3 py-1 text-sm transition-colors ${
            active === it.key
              ? 'bg-primary text-white'
              : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]'
          }`}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
