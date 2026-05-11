import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import PublicLayout from '@/components/layout/PublicLayout';
import { generateMetadata as buildMetadata } from '@/components/common/SEO';
import AuthSupportFooter from '@/components/support/AuthSupportFooter';
import PageFaqSection from '@/components/support/PageFaqSection';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbSchema, graph, productSchema, webPageSchema } from '@/lib/json-ld';
import { PLAN_CATEGORY_LABELS, type Plan, formatPaise } from '@/types/billing';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import type { FaqAudience } from '@/data/faqs';

export const revalidate = 300;

async function fetchPlanBySlug(slug: string): Promise<Plan | null> {
  const apiBase =
    process.env.BACKEND_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000/api/v1';
  try {
    const res = await fetch(`${apiBase}/plans/slug/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const body = await res.json();
    return (body?.data as Plan) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const plan = await fetchPlanBySlug(slug);
  if (!plan) {
    return buildMetadata({ title: 'Plan not found', url: `/pricing/${slug}` });
  }
  return buildMetadata({
    title: `${plan.name} — Plan Details`,
    description:
      plan.shortDescription ||
      `Get the ${plan.name} plan from Hire Adda. ${formatPaise(plan.basePricePaise)}${plan.validityDays ? ` for ${plan.validityDays} days` : ''}.`,
    url: `/pricing/${slug}`,
  });
}

export default async function PlanDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const plan = await fetchPlanBySlug(slug);
  if (!plan) notFound();

  const categoryLabel = PLAN_CATEGORY_LABELS[plan.category] ?? plan.category;

  // Derive support audience from plan category — employer-side categories
  // surface the dedicated employer helpline; candidate / vendor get the
  // generic support channel.
  const audience: FaqAudience =
    plan.category === 'CANDIDATE_PREMIUM'
      ? 'candidate'
      : plan.category === 'VENDOR_CONNECT'
        ? 'vendor'
        : 'employer';

  // JSON-LD: WebPage + Breadcrumb + Product schema with full Offer.
  // Powers the price-rich SERP card + Google Shopping-style preview.
  const planUrl = `/pricing/${plan.slug}`;
  const planJsonLd = graph(
    webPageSchema({
      url: planUrl,
      name: `${plan.name} — Hire Adda`,
      description:
        plan.shortDescription ??
        `${plan.name} plan from Hire Adda — ${formatPaise(plan.basePricePaise)}${plan.validityDays ? ` for ${plan.validityDays} days` : ''}.`,
      speakableCssSelectors: ['h1', '[data-speakable]'],
    }),
    breadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Pricing', url: '/pricing' },
      { name: plan.name, url: planUrl },
    ]),
    productSchema({
      url: planUrl,
      name: plan.name,
      description:
        plan.shortDescription ??
        `${plan.name} — ${categoryLabel} subscription plan from Hire Adda.`,
      category: plan.category,
      sku: plan.code,
      offers: {
        pricePaise: plan.basePricePaise,
        currency: plan.currency,
        availability: 'https://schema.org/InStock',
        url: planUrl,
      },
    }),
  );

  return (
    <PublicLayout>
      <JsonLd id="jsonld-pricing-plan" data={planJsonLd} />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <Link
          href="/pricing"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text)]"
        >
          ← Back to all plans
        </Link>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-8 sm:p-10">
          <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold tracking-wide text-blue-700 uppercase">
            {categoryLabel}
          </span>
          <h1 className="mt-4 text-3xl font-bold text-[var(--text)] sm:text-4xl">{plan.name}</h1>
          {plan.shortDescription ? (
            <p className="mt-3 text-base leading-relaxed text-[var(--text-secondary)]">
              {plan.shortDescription}
            </p>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-baseline sm:gap-4">
            <span className="text-4xl font-extrabold text-[var(--text)] sm:text-5xl">
              {formatPaise(plan.basePricePaise)}
            </span>
            {plan.validityDays ? (
              <span className="text-base text-[var(--text-secondary)]">
                / {plan.validityDays} days
              </span>
            ) : null}
            {plan.gstInclusive ? (
              <span className="ml-auto inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                <ShieldCheck size={14} /> GST inclusive
              </span>
            ) : null}
          </div>

          {plan.requiresQuote ? (
            <Link
              href="/billing/quote"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-blue-700"
            >
              Request a Custom Quote
              <ArrowRight size={18} />
            </Link>
          ) : (
            <Link
              href={`/billing/checkout/${encodeURIComponent(plan.code)}`}
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-blue-700"
            >
              Subscribe Now
              <ArrowRight size={18} />
            </Link>
          )}
        </div>

        {plan.features && plan.features.length > 0 ? (
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-[var(--text)]">What&apos;s included</h2>
            <ul className="mt-4 space-y-3">
              {plan.features
                .filter((f) => f.included)
                .map((f) => (
                  <li key={f.key} className="flex items-start gap-3 text-sm text-[var(--text)]">
                    <CheckCircle2 className="mt-0.5 flex-shrink-0 text-emerald-500" size={18} />
                    <span>
                      <strong>{f.label}</strong>
                      {f.kind === 'COUNTABLE' && f.countableLimit
                        ? ` — up to ${f.countableLimit}`
                        : ''}
                      {f.description ? (
                        <span className="block text-[var(--text-secondary)]">{f.description}</span>
                      ) : null}
                    </span>
                  </li>
                ))}
            </ul>
          </section>
        ) : null}

        {plan.descriptionHtml ? (
          <section
            className="prose prose-sm dark:prose-invert mt-10 max-w-none text-[var(--text)]"
            dangerouslySetInnerHTML={{ __html: plan.descriptionHtml }}
          />
        ) : null}

        <div className="mt-12 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 text-sm text-[var(--text-secondary)]">
          <strong className="block text-[var(--text)]">Need help deciding?</strong>
          Talk to our team — we&apos;ll help you pick the right plan for your hiring volume.
          <Link href="/contact" className="ml-1 font-medium text-blue-600 hover:underline">
            Contact us →
          </Link>
        </div>

        <AuthSupportFooter
          pageContext="pricing-detail"
          audience={audience}
          defaultCategory="BILLING"
        />
      </main>

      <PageFaqSection
        pageContext="pricing-detail"
        audience={audience}
        heading={`${plan.name} — FAQ`}
        subheading="Common questions about this plan, billing, and what's included."
        jsonLdId={`jsonld-faq-pricing-${slug}`}
      />
    </PublicLayout>
  );
}
