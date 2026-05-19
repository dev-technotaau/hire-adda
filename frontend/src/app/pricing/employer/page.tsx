import type { Metadata } from 'next';
import Link from 'next/link';
import PublicLayout from '@/components/layout/PublicLayout';
import PricingSections, { EMPLOYER_PRICING_SECTIONS } from '@/components/billing/PricingSections';
import PricingFAQ from '@/components/billing/PricingFAQ';
import AuthSupportFooter from '@/components/support/AuthSupportFooter';
import PageFaqSection from '@/components/support/PageFaqSection';
import EmployerHelplineBanner from '@/components/support/EmployerHelplineBanner';
import { fetchPublicPlans } from '@/lib/pricing.server';
import { generateMetadata as buildMetadata } from '@/components/common/SEO';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbSchema, graph, serviceSchema } from '@/lib/json-ld';
import { ArrowRight, Building2 } from 'lucide-react';

export const metadata: Metadata = buildMetadata({
  title: 'Employer Pricing — Job Posts, CV Database & Assisted Hiring',
  description:
    'Hire Adda employer plans — start with a free job post or scale with Standard, Premium, CV Database, Enterprise, and Assisted Hiring plans.',
  url: '/pricing/employer',
});

export const revalidate = 300;

export default async function EmployerPricingPage({
  searchParams,
}: {
  searchParams?: Promise<{ upgrade?: string }>;
}) {
  const plans = await fetchPublicPlans();
  const params = (await searchParams) ?? {};
  const upgradeMode = params.upgrade === '1';

  // Filter plans to only the employer categories rendered by this page so
  // empty-state / counts reflect what the user actually sees.
  const employerCategories = new Set(EMPLOYER_PRICING_SECTIONS.map((s) => s.category));
  const employerPlans = plans.filter((p) => employerCategories.has(p.category));

  // Service schema — surfaces the dedicated employer helpline as structured
  // data so it can appear in Google Knowledge Panels and Service rich
  // results when users search for "hire adda employer support phone" etc.
  // Builds an Offer for each plan so the SERP card can list pricing.
  const employerServiceJsonLd = graph(
    serviceSchema({
      name: 'Hire Adda — Employer Hiring Solutions',
      description:
        'End-to-end recruitment platform for Indian employers — job posts, CV database, assisted hiring, and team-managed accounts. Dedicated helpline (+91 73740 11333) for sales and support, Mon–Sat 9 AM – 6 PM IST.',
      url: '/pricing/employer',
      serviceType: 'Recruitment & Talent Acquisition',
      audienceType: 'Employer',
      telephone: { display: '+91 73740 11333', uri: '+91-7374011333' },
      hours: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '09:00',
        closes: '18:00',
      },
      offers: employerPlans
        .filter((p) => !p.requiresQuote && p.basePricePaise > 0)
        .map((p) => ({
          name: p.name,
          pricePaise: p.basePricePaise,
          currency: p.currency,
          url: `/pricing/${p.slug}`,
        })),
    }),
    breadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Pricing', url: '/pricing' },
      { name: 'Employer', url: '/pricing/employer' },
    ]),
  );

  return (
    <PublicLayout>
      <JsonLd id="jsonld-pricing-employer-service" data={employerServiceJsonLd} />
      <div className="bg-[var(--bg)]">
        <EmployerHelplineBanner />

        {/* Hero */}
        <section className="bg-gradient-to-b from-[var(--bg-secondary)] to-[var(--bg)] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <span className="bg-primary-light text-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
              <Building2 className="h-3.5 w-3.5" />
              For employers
            </span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[var(--text)] sm:text-5xl">
              Hire faster with the right plan
            </h1>
            <p className="mt-5 text-lg text-[var(--text-muted)]">
              Free job posts to start, or scale up with paid plans for top visibility, CV database
              access, and assisted sourcing — pay only for what you need.
            </p>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              All prices include 18% GST · UPI, cards, netbanking, wallets, EMI · Optional
              auto-renew via eMandate / UPI AutoPay
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
              <Link
                href="/pricing/candidate"
                className="hover:border-primary hover:text-primary inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-white px-4 py-1.5 font-medium text-[var(--text)] transition-colors dark:bg-[var(--bg-secondary)]"
              >
                Looking for candidate plans? <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/pricing"
                className="hover:border-primary hover:text-primary inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-white px-4 py-1.5 font-medium text-[var(--text)] transition-colors dark:bg-[var(--bg-secondary)]"
              >
                See all plans <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        <PricingSections
          plans={employerPlans}
          sections={EMPLOYER_PRICING_SECTIONS}
          upgradeMode={upgradeMode}
        />

        {employerPlans.length === 0 && (
          <section className="px-4 py-24 text-center sm:px-6 lg:px-8">
            <p className="text-[var(--text-muted)]">
              Plans are loading. If this persists, please refresh the page.
            </p>
          </section>
        )}

        {/* Curated employer-pricing FAQ — driven by shared FAQ corpus
            (employer + billing FAQs filtered for this page context). */}
        <PageFaqSection
          pageContext="pricing-employer"
          audience="employer"
          heading="Employer Pricing FAQ"
          subheading="Quick answers about plans, billing, and what each tier includes."
          jsonLdId="jsonld-faq-pricing-employer"
        />

        <PricingFAQ />

        {/* Employer-only support strip — helpline + modal triggers. */}
        <section className="bg-white px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <AuthSupportFooter
              pageContext="pricing-employer"
              audience="employer"
              defaultCategory="BILLING"
            />
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
