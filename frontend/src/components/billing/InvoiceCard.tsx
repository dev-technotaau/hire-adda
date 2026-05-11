import Link from 'next/link';
import { FileDown, Eye } from 'lucide-react';
import type { InvoiceListItem } from '@/hooks/use-invoices';
import { formatPaise } from '@/types/billing';

interface Props {
  invoice: InvoiceListItem;
}

const STATUS_TONE: Record<string, string> = {
  PAID: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
  ISSUED: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  DRAFT: 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300',
  VOIDED: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
  REFUNDED: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
};

export default function InvoiceCard({ invoice }: Props) {
  const tone = STATUS_TONE[invoice.status] ?? STATUS_TONE.DRAFT;
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-mono text-sm font-semibold text-[var(--text)]">
          {invoice.invoiceNumber}
        </h3>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          {invoice.issuedAt
            ? new Date(invoice.issuedAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : 'Not issued'}
        </p>
        <p className="mt-2 text-sm font-semibold text-[var(--text)]">
          {formatPaise(invoice.totalPaise)}
        </p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
          {invoice.status}
        </span>
        <div className="flex items-center gap-1">
          <Link
            href={`/billing/invoices/${invoice.id}`}
            className="inline-flex items-center gap-1 rounded-md p-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg)]"
          >
            <Eye size={14} />
          </Link>
          {invoice.pdfUrl ? (
            <a
              href={invoice.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-md p-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg)]"
            >
              <FileDown size={14} />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
