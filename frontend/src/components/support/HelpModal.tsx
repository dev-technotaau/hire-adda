'use client';

/**
 * HelpModal — page-aware FAQ search modal.
 *
 *   - Filters FAQs by `pageContext` + `audience` so each surface shows
 *     only relevant questions (login pages get auth + getting-started,
 *     pricing pages get billing + plan benefits, etc.).
 *   - Fuse.js fuzzy search across question, answer, and the per-FAQ
 *     `keywords` array — typo-tolerant + synonym-aware ("how to pay" →
 *     "billing-payment-methods" via keyword match).
 *   - Language picker switches the entire visible content + search
 *     index in real time. Choice persists across modals via
 *     `useFaqLocale`.
 *   - "View all FAQs" link to /help when the user wants the full
 *     corpus or to share a deep-link.
 */

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import Fuse from 'fuse.js';
import { ChevronDown, ExternalLink, Search, Sparkles } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { useFaqLocale } from '@/hooks/use-faq-locale';
import {
  CATEGORY_LABELS,
  SUPPORTED_LOCALES,
  getFaqsForPage,
  type FaqAudience,
  type FaqEntry,
  type FaqPageContext,
} from '@/data/faqs';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageContext: FaqPageContext;
  audience?: FaqAudience;
  /** Page-scoped title override. Default: "Help & FAQs". */
  title?: string;
}

export default function HelpModal({
  isOpen,
  onClose,
  pageContext,
  audience = 'all',
  title = 'Help & FAQs',
}: HelpModalProps) {
  const { locale, setLocale } = useFaqLocale();
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const faqs = useMemo<FaqEntry[]>(
    () => getFaqsForPage(pageContext, { locale, audience }),
    [pageContext, locale, audience],
  );

  const fuse = useMemo(
    () =>
      new Fuse(faqs, {
        keys: [
          { name: 'question', weight: 0.5 },
          { name: 'answer', weight: 0.2 },
          { name: 'keywords', weight: 0.3 },
        ],
        threshold: 0.4, // typo-tolerant — "paymentt" still matches "payment"
        includeScore: true,
        minMatchCharLength: 2,
      }),
    [faqs],
  );

  const visible: FaqEntry[] = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return faqs;
    return fuse.search(trimmed).map((r) => r.item);
  }, [query, fuse, faqs]);

  // Reset query + close any expanded entries when the modal opens fresh
  // or the page context changes — feels cleaner across nav.
  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery('');
      setOpenId(null);
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      {/* Language picker + AI badge */}
      <div className="-mt-2 mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-primary inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-secondary)] px-3 py-1 text-xs font-medium">
          <Sparkles className="h-3.5 w-3.5" />
          AI-powered search
        </div>
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value as typeof locale)}
          aria-label="Language"
          className="focus:border-primary focus:ring-primary/20 rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--text)] focus:ring-2 focus:outline-none"
        >
          {SUPPORTED_LOCALES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.nativeLabel}
            </option>
          ))}
        </select>
      </div>

      {/* Search */}
      <Input
        type="search"
        placeholder="Try: 'how to pay', 'forgot password', 'CV unlock'..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        leftIcon={<Search className="h-4 w-4" />}
        aria-label="Search FAQs"
      />

      <p className="mt-3 mb-2 text-xs text-[var(--text-muted)]">
        {query.trim() === ''
          ? `Showing ${faqs.length} relevant ${faqs.length === 1 ? 'question' : 'questions'} for this page`
          : `${visible.length} of ${faqs.length} match "${query.trim()}"`}
      </p>

      {/* Results */}
      <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
        {visible.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-6 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              No matches found. Try different words or{' '}
              <Link href="/help" className="text-primary hover:underline" onClick={onClose}>
                browse all FAQs
              </Link>
              .
            </p>
          </div>
        ) : (
          visible.map((faq) => {
            const isOpen = openId === faq.id;
            const categoryLabel = CATEGORY_LABELS[faq.category][locale];
            return (
              <div
                key={faq.id}
                className="overflow-hidden rounded-xl border border-[var(--border)] bg-white"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--bg-secondary)]"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium tracking-wide text-[var(--text-muted)] uppercase">
                      {categoryLabel}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-[var(--text)]">
                      {faq.question}
                    </p>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-[var(--border)] bg-[var(--bg-secondary)]/40 px-4 py-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4 text-xs">
        <Link
          href={`/help?lang=${locale}`}
          onClick={onClose}
          className="text-primary inline-flex items-center gap-1 hover:underline"
        >
          View all FAQs <ExternalLink className="h-3 w-3" />
        </Link>
        <Link
          href="/contact"
          onClick={onClose}
          className="text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          Still need help? Contact us →
        </Link>
      </div>
    </Modal>
  );
}
