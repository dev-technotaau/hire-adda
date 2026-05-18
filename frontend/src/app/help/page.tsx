'use client';

import Breadcrumbs from '@/components/common/Breadcrumbs';
import PublicLayout from '@/components/layout/PublicLayout';
import JsonLd from '@/components/seo/JsonLd';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Tooltip from '@/components/ui/Tooltip';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { articleSchema, breadcrumbSchema, faqPageSchema, graph } from '@/lib/json-ld';
import {
  ChevronDown,
  Mail,
  MessageCircle,
  Phone,
  Search,
  Sparkles,
  TicketCheck,
} from 'lucide-react';
import Link from 'next/link';
import Fuse from 'fuse.js';
import { useMemo, useState } from 'react';
import {
  CATEGORY_LABELS,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  getFaqsForLocale,
  type FaqCategory,
  type FaqEntry,
  type LocaleCode,
} from '@/data/faqs';
import { useFaqLocale } from '@/hooks/use-faq-locale';
import {
  EMPLOYER_HELPLINE,
  EMPLOYER_HELPLINE_HOURS,
  GENERIC_HELPLINE,
  GENERIC_HELPLINE_HOURS,
  SUPPORT_EMAIL,
} from '@/constants/support';

type CategoryTab = 'all' | FaqCategory;

const TABS: { key: CategoryTab; label: Record<LocaleCode, string> }[] = [
  {
    key: 'all',
    label: { en: 'All', hi: 'सभी', ta: 'அனைத்தும்', te: 'అన్నీ', bn: 'সব', mr: 'सर्व' },
  },
  { key: 'general', label: CATEGORY_LABELS.general },
  { key: 'candidates', label: CATEGORY_LABELS.candidates },
  { key: 'employers', label: CATEGORY_LABELS.employers },
  { key: 'vendors', label: CATEGORY_LABELS.vendors },
  { key: 'billing-payments', label: CATEGORY_LABELS['billing-payments'] },
  { key: 'account-security', label: CATEGORY_LABELS['account-security'] },
];

export default function HelpPage() {
  const { locale, setLocale } = useFaqLocale();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<CategoryTab>('all');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const user = useAuthStore((s) => s.user);

  const allFaqs = useMemo<FaqEntry[]>(() => getFaqsForLocale(locale), [locale]);

  const fuse = useMemo(
    () =>
      new Fuse(allFaqs, {
        keys: [
          { name: 'question', weight: 0.5 },
          { name: 'answer', weight: 0.2 },
          { name: 'keywords', weight: 0.3 },
        ],
        threshold: 0.4,
        includeScore: true,
        minMatchCharLength: 2,
      }),
    [allFaqs],
  );

  // Apply tab filter then search.
  const filteredFaqs = useMemo<FaqEntry[]>(() => {
    const tabbed = activeTab === 'all' ? allFaqs : allFaqs.filter((f) => f.category === activeTab);
    const q = searchQuery.trim();
    if (!q) return tabbed;
    // Restrict the fuzzy search to tab-filtered IDs so the search respects
    // the tab. Build an id-set for O(1) lookups.
    const allowed = new Set(tabbed.map((f) => f.id));
    return fuse
      .search(q)
      .map((r) => r.item)
      .filter((f) => allowed.has(f.id));
  }, [activeTab, allFaqs, searchQuery, fuse]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // JSON-LD: full FAQPage with every visible FAQ. We always emit the
  // English corpus in the schema (search engines crawl one canonical
  // language; hreflang on the URL signals translations). FAQs are kept in
  // a single graph alongside Article + Breadcrumb schema for E-A-T.
  const englishFaqs = useMemo(() => getFaqsForLocale(DEFAULT_LOCALE), []);
  const helpJsonLd = useMemo(
    () =>
      graph(
        faqPageSchema(englishFaqs.map((f) => ({ question: f.question, answer: f.answer }))),
        articleSchema({
          url: '/help',
          headline: 'Hire Adda Help Center — Frequently Asked Questions',
          description:
            'Curated answers to the most common questions about using Hire Adda — account setup, job search, applications, password reset, billing, and more.',
          datePublished: '2026-01-01T00:00:00+05:30',
          dateModified: '2026-04-01T00:00:00+05:30',
          authorName: 'Hire Adda Editorial Team',
          authorUrl: '/about',
          articleSection: 'Help & Support',
          keywords: ['help', 'FAQ', 'support', 'job search help', 'employer help', 'billing'],
          speakableCssSelectors: ['h1', '.hero-subtitle'],
        }),
        breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Help & FAQ', url: '/help' },
        ]),
      ),
    [englishFaqs],
  );

  return (
    <PublicLayout>
      <JsonLd id="jsonld-help" data={helpJsonLd} />

      {/* Hero */}
      <section className="from-primary-50 relative overflow-hidden bg-gradient-to-br via-white to-[var(--accent-light)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-[var(--text)] sm:text-5xl">
              Help <span className="text-primary">Center</span>
            </h1>
            <p className="hero-subtitle mx-auto mt-6 max-w-2xl text-lg text-[var(--text-secondary)]">
              Find answers to common questions about using Hire Adda. Can&apos;t find what
              you&apos;re looking for? Contact our support team.
            </p>

            {/* E-A-T signals — author byline, last-reviewed, reviewer team. */}
            <div className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
              <span>
                By{' '}
                <Link href="/about" className="text-primary hover:underline">
                  Hire Adda Editorial Team
                </Link>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Last reviewed: <time dateTime="2026-04-01">April 1, 2026</time>
              </span>
              <span aria-hidden="true">·</span>
              <span>Reviewed by Support &amp; Trust team</span>
            </div>

            {/* Search + Language picker row */}
            <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-[1fr_auto]">
              <div className="relative">
                <div className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[var(--text-muted)]">
                  <Search className="h-5 w-5" />
                </div>
                <input
                  type="search"
                  placeholder='Try "forgot password", "GST invoice", "post a job"...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="focus:border-primary focus:ring-primary/20 h-12 w-full rounded-xl border border-[var(--border)] bg-white pr-4 pl-12 text-[var(--text)] shadow-sm transition-colors duration-200 placeholder:text-[var(--text-muted)] focus:ring-2 focus:outline-none"
                  aria-label="Search FAQs"
                />
                <span className="text-primary pointer-events-none absolute top-1/2 right-3 inline-flex -translate-y-1/2 items-center gap-1 text-xs font-medium">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI search
                </span>
              </div>
              {/* Language switcher — uses the shared custom Select
                  instead of the native dropdown so styling /
                  caret-rotation / open-state ring match every other
                  form control on the site. `min-w-[160px]` keeps the
                  trigger wide enough that the longest native label
                  (e.g. "മലയാളം") doesn't truncate.
                  The visually-hidden <label htmlFor> gives the
                  trigger button an accessible name for screen
                  readers without printing visible label chrome. */}
              <div className="min-w-[160px]">
                <label htmlFor="help-language-select" className="sr-only">
                  Language
                </label>
                <Select
                  id="help-language-select"
                  value={locale}
                  onChange={(v) => setLocale(v as LocaleCode)}
                  options={SUPPORTED_LOCALES.map((l) => ({
                    value: l.code,
                    label: l.nativeLabel,
                  }))}
                  size="lg"
                  clearable={false}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabbed FAQ Section */}
      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Tabs */}
          <div className="mb-8 flex flex-wrap gap-2 border-b border-[var(--border)] pb-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const count =
                tab.key === 'all'
                  ? allFaqs.length
                  : allFaqs.filter((f) => f.category === tab.key).length;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text)]'
                  }`}
                >
                  {tab.label[locale]}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      isActive
                        ? 'bg-primary-light text-primary'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="text-2xl font-bold text-[var(--text)]">
              {activeTab === 'all'
                ? 'Frequently Asked Questions'
                : TABS.find((t) => t.key === activeTab)?.label[locale]}
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              {filteredFaqs.length === 0
                ? 'No results found. Try a different search term.'
                : `${filteredFaqs.length} ${filteredFaqs.length === 1 ? 'question' : 'questions'}`}
            </p>
          </div>

          <div className="space-y-3">
            {filteredFaqs.map((faq) => {
              const isOpen = openItems.has(faq.id);
              return (
                <div
                  key={faq.id}
                  id={`faq-${faq.id}`}
                  className="rounded-xl border border-[var(--border)] bg-white transition-shadow hover:shadow-sm"
                >
                  <button
                    onClick={() => toggleItem(faq.id)}
                    className="flex w-full items-start justify-between gap-4 px-6 py-4 text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                        {CATEGORY_LABELS[faq.category][locale]}
                      </p>
                      <p className="mt-0.5 font-medium text-[var(--text)]">{faq.question}</p>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-[var(--text-muted)] transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {/* Animated collapse — height + opacity tween via
                      framer-motion. height: 0 → auto needs
                      `overflow: hidden` on the motion wrapper so the
                      inner content doesn't bleed out during the
                      transition. The custom cubic-bezier is the
                      Material "decelerated-easing" curve — feels
                      smooth without being sluggish. Opacity fades
                      slightly faster than height grows so the text
                      is fully readable by the time the height
                      settles. */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          height: { duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] },
                          opacity: { duration: 0.2, ease: 'easeOut' },
                        }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div className="border-t border-[var(--border)] px-6 py-4">
                          <p className="leading-relaxed text-[var(--text-secondary)]">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Logged-in User Ticket Section */}
      {user && (
        <section className="border-t border-[var(--border)] bg-white py-12">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <div className="bg-primary-light mx-auto flex h-14 w-14 items-center justify-center rounded-xl">
              <TicketCheck className="text-primary h-7 w-7" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-[var(--text)]">
              Need Personalized Support?
            </h2>
            <p className="mt-2 text-[var(--text-secondary)]">
              Create a support ticket to track your issue and get a dedicated response from our
              team.
            </p>
            <Tooltip content="View your support tickets and create new ones">
              <Link
                href={user.role === 'EMPLOYER' ? '/employer/help' : '/candidate/help'}
                className="mt-4 inline-block"
              >
                <Button size="lg">Go to My Support Dashboard</Button>
              </Link>
            </Tooltip>
          </div>
        </section>
      )}

      {/* Support Contact Section */}
      <section className="border-t border-[var(--border)] bg-[var(--bg-secondary)] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-[var(--text)] sm:text-3xl">Still Need Help?</h2>
            <p className="mx-auto mt-3 max-w-xl text-[var(--text-secondary)]">
              Our support team is ready to assist you. Reach out through any of the channels below.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-[var(--border)] bg-white p-6 text-center">
              <div className="bg-primary-light mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                <Mail className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-semibold text-[var(--text)]">Email Support</h3>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-primary mt-1 block text-sm hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Response within 24 hours</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-white p-6 text-center">
              <div className="bg-primary-light mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                <Phone className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-semibold text-[var(--text)]">Phone Support</h3>
              <a
                href={GENERIC_HELPLINE.href}
                className="text-primary mt-1 block text-sm hover:underline"
              >
                {GENERIC_HELPLINE.display}
              </a>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{GENERIC_HELPLINE_HOURS}</p>
            </div>
            <div className="border-l-primary rounded-xl border border-l-4 border-[var(--border)] bg-white p-6 text-center">
              <div className="bg-primary-light mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                <Phone className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-semibold text-[var(--text)]">Employer Helpline</h3>
              <a
                href={EMPLOYER_HELPLINE.href}
                className="text-primary mt-1 block text-sm font-semibold hover:underline"
              >
                {EMPLOYER_HELPLINE.display}
              </a>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{EMPLOYER_HELPLINE_HOURS}</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-white p-6 text-center">
              <div className="bg-primary-light mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                <MessageCircle className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-semibold text-[var(--text)]">Contact Form</h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Send us a detailed message</p>
              <Tooltip content="Send us a message via the contact form">
                <Link href="/contact" className="mt-2 inline-block">
                  <Button variant="link" size="sm">
                    Go to Contact Page
                  </Button>
                </Link>
              </Tooltip>
            </div>
          </div>
        </div>
      </section>

      {/* Breadcrumbs — bottom placement. */}
      <div className="border-t border-[var(--border)] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ name: 'Help & FAQ' }]} withSchema={false} />
        </div>
      </div>
    </PublicLayout>
  );
}
