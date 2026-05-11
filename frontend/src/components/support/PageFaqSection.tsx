'use client';

/**
 * PageFaqSection — embedded FAQ block tailored to a specific landing page.
 *
 * Pulls FAQs from the shared corpus filtered by `pageContext` + `audience`,
 * with the same fuzzy search + locale picker the modal uses. Each section
 * emits its own FAQPage JSON-LD with only the visible questions, so search
 * engines pick up rich-result eligibility per landing page (e.g. /pricing/
 * employer's "Employer Pricing FAQ" gets its own SERP card).
 *
 * Pages with their own dedicated FAQ block (PricingFAQ on /pricing) should
 * NOT use this component — duplicated FAQPage schema confuses Google.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Fuse from 'fuse.js';
import { ChevronDown, Search, Sparkles } from 'lucide-react';
import JsonLd from '@/components/seo/JsonLd';
import { faqPageSchema } from '@/lib/json-ld';
import {
  CATEGORY_LABELS,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  getFaqsForPage,
  type FaqAudience,
  type FaqEntry,
  type FaqPageContext,
  type LocaleCode,
} from '@/data/faqs';
import { useFaqLocale } from '@/hooks/use-faq-locale';

interface PageFaqSectionProps {
  pageContext: FaqPageContext;
  audience?: FaqAudience;
  /** Heading override. Default: "Frequently Asked Questions". */
  heading?: string;
  /** Sub-heading copy under the H2. */
  subheading?: string;
  /** Cap visible FAQs (e.g. show top 10 on a marketing page). */
  limit?: number;
  /** Stable id for the JsonLd block — must be unique across the page. */
  jsonLdId?: string;
  className?: string;
}

export default function PageFaqSection({
  pageContext,
  audience = 'all',
  heading = 'Frequently Asked Questions',
  subheading,
  limit,
  jsonLdId,
  className,
}: PageFaqSectionProps) {
  const { locale, setLocale } = useFaqLocale();
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const faqs = useMemo<FaqEntry[]>(
    () => getFaqsForPage(pageContext, { locale, audience, limit }),
    [pageContext, locale, audience, limit],
  );

  const fuse = useMemo(
    () =>
      new Fuse(faqs, {
        keys: [
          { name: 'question', weight: 0.5 },
          { name: 'answer', weight: 0.2 },
          { name: 'keywords', weight: 0.3 },
        ],
        threshold: 0.4,
        includeScore: true,
        minMatchCharLength: 2,
      }),
    [faqs],
  );

  const visible = useMemo<FaqEntry[]>(() => {
    const q = query.trim();
    if (!q) return faqs;
    return fuse.search(q).map((r) => r.item);
  }, [query, fuse, faqs]);

  // SEO: emit FAQPage schema with the canonical English wording so the
  // schema is locale-independent and matches what we serve to Googlebot.
  const englishFaqs = useMemo(
    () => getFaqsForPage(pageContext, { locale: DEFAULT_LOCALE, audience, limit }),
    [pageContext, audience, limit],
  );
  const schema = useMemo(
    () => faqPageSchema(englishFaqs.map((f) => ({ question: f.question, answer: f.answer }))),
    [englishFaqs],
  );

  if (faqs.length === 0) return null;

  const id = jsonLdId ?? `jsonld-faq-${pageContext}`;

  return (
    <section className={`bg-[var(--bg-secondary)] py-16 ${className ?? ''}`}>
      <JsonLd id={id} data={schema} />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text)] sm:text-3xl">{heading}</h2>
            {subheading && (
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{subheading}</p>
            )}
          </div>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as LocaleCode)}
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

        <div className="relative mb-4">
          <div className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--text-muted)]">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="search"
            placeholder="Search this section..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="focus:border-primary focus:ring-primary/20 w-full rounded-lg border border-[var(--border)] bg-white py-2 pr-10 pl-9 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:outline-none"
            aria-label="Search this FAQ section"
          />
          <span className="text-primary pointer-events-none absolute top-1/2 right-3 inline-flex -translate-y-1/2 items-center gap-1 text-[10px] font-medium">
            <Sparkles className="h-3 w-3" />
            AI
          </span>
        </div>

        <div className="space-y-2">
          {visible.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--border)] bg-white px-4 py-6 text-center text-sm text-[var(--text-muted)]">
              No matches in this section. Try the{' '}
              <Link href="/help" className="text-primary hover:underline">
                full FAQ
              </Link>{' '}
              instead.
            </p>
          ) : (
            visible.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="overflow-hidden rounded-xl border border-[var(--border)] bg-white"
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-[var(--bg-secondary)]"
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                        {CATEGORY_LABELS[faq.category][locale]}
                      </p>
                      <p className="mt-0.5 font-medium text-[var(--text)]">{faq.question}</p>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="border-t border-[var(--border)] bg-[var(--bg-secondary)]/40 px-5 py-4 text-sm leading-relaxed text-[var(--text-secondary)]">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
          Looking for something else?{' '}
          <Link href={`/help?lang=${locale}`} className="text-primary hover:underline">
            Browse all FAQs
          </Link>
        </p>
      </div>
    </section>
  );
}
