// Trigger CI/CD rebuild — refresh ghcr-credentials after VPS reboot (token expired during downtime)
// Trigger CI/CD rebuild again — full pipeline (backend + frontend builds + deploy-k8s)
// Trigger CI/CD rebuild — verify deploy-k8s SSH after MaxAuthTries fix and IdentitiesOnly flag
import AuthHomeRedirect from '@/components/common/AuthHomeRedirect';
import StatsSection from '@/components/common/StatsSection';
import PublicLayout from '@/components/layout/PublicLayout';
import JsonLd from '@/components/seo/JsonLd';
import { generateMetadata as buildMetadata } from '@/components/common/SEO';
import Button from '@/components/ui/Button';
import Tooltip from '@/components/ui/Tooltip';
import {
  graph,
  siteNavigationSchema,
  webPageSchema,
  ORGANIZATION_ID,
  WEBSITE_ID,
} from '@/lib/json-ld';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  Award,
  BadgeCheck,
  BarChart3,
  Bell,
  Building2,
  CheckCircle,
  ChevronDown,
  Code,
  Eye,
  FileText,
  Globe,
  GraduationCap,
  Headphones,
  Lock,
  Megaphone,
  MessageSquare,
  PenTool,
  Search,
  Shield,
  Star,
  Stethoscope,
  Target,
  Truck,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import HeroJobSearchBar from '@/components/job-search/HeroJobSearchBar';
import JobSearchHistoryChips from '@/components/job-search/JobSearchHistoryChips';
// Discovery widgets (Sections 1–4 of the homepage discovery layer).
import JobsCategoriesChipsSection from '@/components/home/JobsCategoriesChipsSection';
import TopCompanyCategoriesSlider from '@/components/home/TopCompanyCategoriesSlider';
import FeaturedCompaniesSlider from '@/components/home/FeaturedCompaniesSlider';
import PopularRolesGrid from '@/components/home/PopularRolesGrid';

export const metadata: Metadata = buildMetadata({
  title: "Hire Adda — India's Leading Job Portal & Recruitment Platform",
  description:
    "Find your dream job or hire top talent on India's AI-powered recruitment platform. Verified employers, smart matching, and quick apply.",
  keywords: [
    'jobs',
    'careers',
    'recruitment',
    'hiring',
    'job portal',
    'India jobs',
    'hire adda',
    'job search',
    'hire talent',
    'AI recruitment',
  ],
  url: '/',
});

/**
 * Homepage structured-data graph — emitted as a single `@graph` so Google
 * sees the entity cross-references (WebPage belongs to WebSite, about
 * Organization). Keeps payload compact vs. 4 separate <script> tags.
 *
 * Layout.tsx already ships Organization + WebSite + WebApplication
 * sitewide; here we add the homepage-specific WebPage + primary nav.
 */
const homeJsonLd = graph(
  webPageSchema({
    url: '/',
    name: "Hire Adda — India's Leading Job Portal & Recruitment Platform",
    description:
      "Find your dream job or hire top talent on India's AI-powered recruitment platform. Verified employers, smart matching, and quick apply.",
    speakableCssSelectors: ['h1', '.hero-subtitle', '[data-speakable]'],
    primaryImage: '/images/og-home.png',
  }),
  // Primary navigation — drives SERP sitelinks under the top brand result.
  siteNavigationSchema([
    { name: 'Jobs', url: '/candidate/jobs' },
    { name: 'Companies', url: '/companies' },
    { name: 'About', url: '/about' },
    { name: 'Help', url: '/help' },
    { name: 'Contact', url: '/contact' },
    { name: 'Site Map', url: '/sitemap' },
    { name: 'Login', url: '/auth/login' },
    { name: 'Register', url: '/auth/register' },
  ]),
  // Explicit SearchAction bound to the search form on the hero — gives
  // Google Sitelinks Search Box the exact URL template with the
  // `required` query-input hint.
  {
    '@context': 'https://schema.org',
    '@type': 'SearchAction',
    '@id': `${WEBSITE_ID}#hero-search`,
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://hireadda.in'}/candidate/jobs?search={search_term_string}&location={location_string}`,
      actionPlatform: [
        'https://schema.org/DesktopWebPlatform',
        'https://schema.org/MobileWebPlatform',
      ],
    },
    'query-input': ['required name=search_term_string', 'name=location_string'],
    inLanguage: 'en-IN',
    potentialAction: { '@id': ORGANIZATION_ID },
  },
);

// ---------------------------------------------------------------------------
// Server-side data fetching
// ---------------------------------------------------------------------------

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface PublicStats {
  activeJobs: number;
  companies: number;
  candidates: number;
  placements: number;
}

async function fetchPublicStats(): Promise<PublicStats> {
  try {
    const res = await fetch(`${API_URL}/public/stats`, { next: { revalidate: 600 } });
    if (!res.ok) return { activeJobs: 0, companies: 0, candidates: 0, placements: 0 };
    const json = await res.json();
    return json.data ?? { activeJobs: 0, companies: 0, candidates: 0, placements: 0 };
  } catch {
    return { activeJobs: 0, companies: 0, candidates: 0, placements: 0 };
  }
}

async function fetchCategoryCounts(): Promise<Record<string, number>> {
  try {
    const res = await fetch(`${API_URL}/public/jobs/category-counts`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) return {};
    const json = await res.json();
    return json.data ?? {};
  } catch {
    return {};
  }
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}k+`;
  if (n > 0) return `${n}+`;
  return '0';
}

// Maps each display category to possible department values (case-insensitive match)
const categoryKeywords: Record<string, string[]> = {
  'Technology & IT': ['technology', 'it', 'engineering', 'software', 'tech', 'development'],
  'Finance & Accounting': ['finance', 'accounting', 'banking', 'financial'],
  'Design & Creative': ['design', 'creative', 'ux', 'ui', 'graphic'],
  'Marketing & Sales': ['marketing', 'sales', 'business development', 'growth'],
  'Customer Support': ['customer support', 'support', 'customer service', 'service'],
  'Education & Training': ['education', 'training', 'learning', 'teaching'],
  'Healthcare & Pharma': ['healthcare', 'pharma', 'medical', 'health', 'pharmaceutical'],
  'Operations & Logistics': ['operations', 'logistics', 'supply chain', 'warehouse'],
};

function getCategoryCount(categoryTitle: string, departmentCounts: Record<string, number>): number {
  const keywords = categoryKeywords[categoryTitle] ?? [];
  let total = 0;
  for (const [dept, count] of Object.entries(departmentCounts)) {
    const lower = dept.toLowerCase();
    if (keywords.some((kw) => lower.includes(kw))) {
      total += count;
    }
  }
  return total;
}

// ---------------------------------------------------------------------------
// Static Data
// ---------------------------------------------------------------------------

const howItWorks = [
  {
    step: '1',
    title: 'Create Your Profile',
    description:
      'Sign up for free and build your professional profile with your skills, experience, and career preferences. Upload your resume for AI-powered parsing.',
    icon: Users,
  },
  {
    step: '2',
    title: 'Discover Opportunities',
    description:
      'Browse verified jobs or let our AI matching engine find the perfect opportunities tailored to your skills and aspirations.',
    icon: Search,
  },
  {
    step: '3',
    title: 'Get Hired',
    description:
      'Apply with a single click, connect with employers directly, track your applications in real-time, and land your dream job.',
    icon: Award,
  },
];

const featureColorMap = {
  primary: { bg: 'bg-primary-light', text: 'text-primary' },
  secondary: { bg: 'bg-secondary-light', text: 'text-secondary' },
  accent: { bg: 'bg-accent-light', text: 'text-accent' },
} as const;

const features = [
  {
    icon: Target,
    title: 'AI-Powered Matching',
    color: 'primary' as const,
    description:
      'Our machine learning engine analyzes your profile to recommend the most relevant opportunities with precision.',
  },
  {
    icon: BadgeCheck,
    title: 'Verified Employers',
    color: 'primary' as const,
    description:
      'Every company undergoes a thorough verification process to ensure a safe and trustworthy platform.',
  },
  {
    icon: Zap,
    title: 'Quick Apply',
    color: 'secondary' as const,
    description:
      'Apply to multiple jobs with a single click using your saved profile and parsed resume.',
  },
  {
    icon: FileText,
    title: 'AI Resume Parsing',
    color: 'accent' as const,
    description:
      'Upload your resume and our Document AI extracts skills, experience, and qualifications automatically.',
  },
  {
    icon: Bell,
    title: 'Smart Job Alerts',
    color: 'secondary' as const,
    description:
      'Get notified instantly when new jobs match your criteria via email, push, or WhatsApp.',
  },
  {
    icon: BarChart3,
    title: 'Career Analytics',
    color: 'accent' as const,
    description:
      'Track profile views, application status, and compare salaries with detailed insights.',
  },
  {
    icon: Lock,
    title: 'Privacy & Security',
    color: 'primary' as const,
    description:
      'Enterprise-grade security with CSRF protection, encrypted data, and full GDPR compliance.',
  },
  {
    icon: MessageSquare,
    title: 'Real-Time Chat',
    color: 'accent' as const,
    description:
      'Connect instantly with employers and candidates through our built-in messaging platform.',
  },
];

const candidateBenefits = [
  'AI-powered job recommendations based on your skills and preferences',
  'One-click Quick Apply with your saved profile and resume',
  'Real-time application tracking and status updates',
  'Salary insights and career growth analytics',
  'Smart job alerts via email, push notifications, and WhatsApp',
  'Resume parsing powered by Google Document AI',
];

const employerBenefits = [
  'Post jobs and reach qualified candidates instantly',
  'AI-powered candidate matching and ranking',
  'Verified employer badge to build trust with candidates',
  'Advanced search filters with Elasticsearch integration',
  'Real-time analytics dashboard with hiring funnel metrics',
  'Webhook integrations with your existing ATS and tools',
];

const jobCategories = [
  { icon: Code, title: 'Technology & IT', color: 'bg-blue-50 text-blue-600' },
  { icon: BarChart3, title: 'Finance & Accounting', color: 'bg-emerald-50 text-emerald-600' },
  { icon: PenTool, title: 'Design & Creative', color: 'bg-purple-50 text-purple-600' },
  { icon: Megaphone, title: 'Marketing & Sales', color: 'bg-orange-50 text-orange-600' },
  { icon: Headphones, title: 'Customer Support', color: 'bg-pink-50 text-pink-600' },
  { icon: GraduationCap, title: 'Education & Training', color: 'bg-yellow-50 text-yellow-700' },
  { icon: Stethoscope, title: 'Healthcare & Pharma', color: 'bg-red-50 text-red-600' },
  { icon: Truck, title: 'Operations & Logistics', color: 'bg-teal-50 text-teal-600' },
];

const testimonials = [
  {
    quote:
      "Hire Adda's AI matching found me a role that perfectly aligned with my skills. I got 3 interview calls within the first week of signing up!",
    name: 'Kavitha Nair',
    role: 'Software Engineer',
    company: 'Now at Razorpay',
    rating: 5,
  },
  {
    quote:
      "As an HR head, I've tried many platforms. Hire Adda stands out with verified candidates, smart search, and real-time analytics. Our time-to-hire dropped by 40%.",
    name: 'Rajesh Iyer',
    role: 'Head of HR',
    company: 'Freshworks',
    rating: 5,
  },
  {
    quote:
      'The Quick Apply feature and job alerts saved me hours every week. I landed my dream product role in just 3 weeks. Highly recommend!',
    name: 'Sneha Gupta',
    role: 'Product Manager',
    company: 'Now at PhonePe',
    rating: 5,
  },
];

const securityPoints = [
  {
    icon: Lock,
    title: 'End-to-End Encryption',
    description: 'All data is encrypted in transit and at rest using AES-256 encryption.',
  },
  {
    icon: Shield,
    title: 'GDPR & Data Privacy Compliant',
    description: 'Full compliance with data protection regulations. You control your data.',
  },
  {
    icon: UserCheck,
    title: 'Verified Employers Only',
    description: 'Every employer undergoes document verification before posting jobs.',
  },
  {
    icon: Eye,
    title: 'Transparent Data Practices',
    description: 'Clear privacy policy with full visibility into how your data is used.',
  },
];

const trustBadges = [
  { icon: Shield, value: '99.9%', label: 'Uptime SLA' },
  { icon: Lock, value: 'AES-256', label: 'Encryption Standard' },
  { icon: Globe, value: 'GDPR', label: 'Privacy Compliant' },
  { icon: CheckCircle, value: 'SOC 2', label: 'Security Certified' },
];

const faqs = [
  {
    question: 'Is Hire Adda free for job seekers?',
    answer:
      'Yes, Hire Adda is completely free for job seekers. You can create a profile, search for jobs, apply to unlimited positions, and access career insights at no cost whatsoever.',
  },
  {
    question: 'How does the AI-powered job matching work?',
    answer:
      'Our matching engine analyzes your profile, skills, experience, and preferences, then uses machine learning algorithms to rank and recommend jobs that best fit your career goals. The more you use the platform, the smarter the recommendations become.',
  },
  {
    question: 'Are all employers verified on the platform?',
    answer:
      'Yes, every employer on Hire Adda undergoes a verification process that includes document checks and business validation. Verified employers display a blue badge on their profile, giving you confidence that the job listings are legitimate.',
  },
  {
    question: 'How can I post a job as an employer?',
    answer:
      'Register as an employer, complete your company profile, and submit it for verification. Once verified, you can post jobs from your dashboard. We offer a free plan with up to 3 active job postings, and premium plans for unlimited access and advanced features.',
  },
  {
    question: 'What makes Hire Adda different from other job portals?',
    answer:
      'Hire Adda combines AI-powered matching, verified employers, real-time analytics, and multi-channel notifications (email, push, WhatsApp) in one platform. Our focus on trust, technology, and user experience sets us apart from traditional job boards.',
  },
  {
    question: 'Can I track my application status in real-time?',
    answer:
      'Absolutely. Your dashboard shows real-time status updates for every application you submit. You will also receive instant notifications via email, push, or WhatsApp when an employer views your profile, shortlists you, or schedules an interview.',
  },
];

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default async function Home() {
  const [stats, categoryCounts] = await Promise.all([fetchPublicStats(), fetchCategoryCounts()]);

  return (
    <PublicLayout>
      <AuthHomeRedirect />
      {/* Homepage structured-data graph — WebPage + SiteNavigationElement
          + dedicated hero SearchAction. Sitewide Organization + WebSite +
          WebApplication are already in layout.tsx. */}
      <JsonLd id="jsonld-home" data={homeJsonLd} />

      {/* ================================================================
                SECTION 1: Hero (Enhanced)
            ================================================================ */}
      {/* NOTE: `overflow-hidden` is intentionally NOT on the <section>.
          The hero search bar (keyword / location / experience) renders
          floating dropdowns that extend below the section — clipping them
          at the section boundary was a previous UX bug. Decorative blobs
          are wrapped in their own overflow-hidden container below so they
          stay contained without affecting child overflow. */}
      <section className="from-primary-100 to-accent-light relative bg-gradient-to-br via-white">
        {/* Decorative blobs — contained in a pointer-events-none wrapper
            with overflow-hidden so they don't bleed into adjacent sections
            but ALSO don't clip the search bar's autosuggest popovers. */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="bg-primary/5 absolute -top-40 -right-40 h-80 w-80 rounded-full blur-3xl" />
          <div className="bg-accent/5 absolute -bottom-40 -left-40 h-80 w-80 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left: Text */}
            <div>
              <span className="bg-primary-light text-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
                <Zap className="h-3.5 w-3.5" /> AI-Powered Job Portal
              </span>

              <h1 className="mt-6 text-4xl font-bold tracking-tight text-[var(--text)] sm:text-5xl lg:text-6xl">
                Find Your <span className="text-primary whitespace-nowrap">Dream Job,</span>{' '}
                <br className="hidden sm:block" />
                Build Your Future
              </h1>

              <p className="hero-subtitle mt-6 max-w-xl text-lg text-[var(--text-secondary)] sm:text-xl">
                Connect with top companies and discover opportunities that match your skills.
                Whether you&apos;re hiring or looking for your next role, Hire Adda has you covered.
              </p>

              <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row">
                <Tooltip content="Create your free account and start your job search">
                  <Link href="/auth/register/candidate">
                    <Button size="lg" rightIcon={<ArrowRight className="h-5 w-5" />}>
                      Get Started
                    </Button>
                  </Link>
                </Tooltip>
                <Tooltip content="Register as an employer and post job listings">
                  <Link href="/auth/register/employer">
                    <Button variant="highlight" size="lg">
                      Post a Job
                    </Button>
                  </Link>
                </Tooltip>
              </div>

              {/* Trust badges — real numbers */}
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--text-muted)]">
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-[var(--success)]" />{' '}
                  {formatNumber(stats.companies)} Companies
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-[var(--success)]" />{' '}
                  {formatNumber(stats.candidates)} Candidates
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-[var(--success)]" /> Verified & Secure
                </span>
              </div>
            </div>

            {/* Right: Hero illustration */}
            <div className="hidden lg:block">
              <Image
                src="/images/hero-illustration.svg"
                alt="Hire Adda platform preview"
                width={600}
                height={500}
                className="w-full"
                priority
                fetchPriority="high"
              />
            </div>
          </div>

          {/* Public hero search bar (Phase 9) — placed as a full-width
              row BELOW the 2-column heading/illustration grid so the
              keyword + location + experience + Search button each get
              comfortable width on desktop (~1280 px canvas) instead of
              fighting for the ~640 px of the constrained left column.
              Submitting navigates to /jobs?q=&location=&experienceMin/Max=
              so the user lands on the public listing surface with their
              search pre-applied. */}
          <div className="mt-12 sm:mt-14 lg:mt-16">
            <HeroJobSearchBar destination="/jobs" />
            <JobSearchHistoryChips type="JOB" destination="/jobs" className="mt-3" hideWhenEmpty />
          </div>
        </div>
      </section>

      {/* ================================================================
                DISCOVERY LAYER (4 sections): chips · top-categories ·
                featured companies · popular roles. Drive guests deeper
                into the public job/company surfaces without a search.
            ================================================================ */}
      {/* Section 1 — Jobs in Demand + Popular Categories chips (no heading) */}
      <div className="bg-white">
        <JobsCategoriesChipsSection />
      </div>

      {/* Section 2 — Top Companies Hiring Now (per-category slider) */}
      <div className="bg-[var(--bg-secondary)]">
        <TopCompanyCategoriesSlider />
      </div>

      {/* Section 3 — Featured Companies Actively Hiring */}
      <div className="bg-white">
        <FeaturedCompaniesSlider />
      </div>

      {/* Section 4 — Discover Jobs Across Popular Roles */}
      <div className="bg-[var(--bg-secondary)]">
        <PopularRolesGrid />
      </div>

      {/* ================================================================
                SECTION 1.5: Hiring solutions (per pricing-guide §"Best Website Home Options")
            ================================================================ */}
      <section className="bg-[var(--bg)] py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <span className="bg-primary-light text-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
              Choose Hiring Solution
            </span>
            <h2 className="mt-4 text-3xl font-bold text-[var(--text)] sm:text-4xl">
              Hire your way
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-[var(--text-secondary)]">
              Four ways to find the right talent — pick the one that fits your stage.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: 'Post a Job',
                href: '/employer/jobs/new',
                desc: 'Free job post in 2 minutes — reach thousands of candidates.',
                icon: FileText,
                badge: 'Start free',
                accent: {
                  iconBg: 'bg-blue-50',
                  iconText: 'text-blue-600',
                  iconRing: 'ring-blue-200',
                  badgeBg: 'bg-blue-50',
                  badgeText: 'text-blue-700',
                  badgeRing: 'ring-blue-200',
                  topAccent: 'before:bg-blue-500',
                },
              },
              {
                title: 'Search CV Database',
                href: '/pricing/employer#employer_cv_database',
                desc: 'Filter the Talent Vault, unlock contact details, hire faster.',
                icon: Search,
                badge: 'From ₹1,999',
                accent: {
                  iconBg: 'bg-emerald-50',
                  iconText: 'text-emerald-600',
                  iconRing: 'ring-emerald-200',
                  badgeBg: 'bg-emerald-50',
                  badgeText: 'text-emerald-700',
                  badgeRing: 'ring-emerald-200',
                  topAccent: 'before:bg-emerald-500',
                },
              },
              {
                title: 'Assisted Hiring',
                href: '/pricing/employer#employer_assisted_hiring',
                desc: 'Our team finds 4-5 matching CVs for your role in 7 days.',
                icon: Headphones,
                badge: '₹1,499 / role',
                accent: {
                  iconBg: 'bg-amber-50',
                  iconText: 'text-amber-600',
                  iconRing: 'ring-amber-200',
                  badgeBg: 'bg-amber-50',
                  badgeText: 'text-amber-700',
                  badgeRing: 'ring-amber-200',
                  topAccent: 'before:bg-amber-500',
                },
              },
              {
                title: 'Find Recruitment Partners',
                href: '/vendors',
                desc: 'Browse vetted staffing agencies and send hiring leads.',
                icon: Users,
                badge: 'Browse free',
                accent: {
                  iconBg: 'bg-purple-50',
                  iconText: 'text-purple-600',
                  iconRing: 'ring-purple-200',
                  badgeBg: 'bg-purple-50',
                  badgeText: 'text-purple-700',
                  badgeRing: 'ring-purple-200',
                  topAccent: 'before:bg-purple-500',
                },
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.title}
                  href={card.href}
                  className={cn(
                    // Card shell — rounded, bordered, shadow-sm baseline.
                    'group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm transition-all duration-200',
                    // Hover: subtle lift + stronger shadow + primary border tint.
                    'hover:-translate-y-1 hover:border-[var(--text-muted)]/30 hover:shadow-xl',
                    // Top accent stripe — `before:` pseudo-element grows from
                    // 0 → full width on hover for a confident reveal.
                    'before:absolute before:inset-x-0 before:top-0 before:h-1 before:origin-left before:scale-x-0 before:rounded-t-2xl before:transition-transform before:duration-300 group-hover:before:scale-x-100',
                    card.accent.topAccent,
                  )}
                >
                  {/* Top row: icon + value chip */}
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div
                      className={cn(
                        'flex h-12 w-12 flex-none items-center justify-center rounded-xl ring-1 transition-transform duration-200 ring-inset group-hover:scale-110',
                        card.accent.iconBg,
                        card.accent.iconText,
                        card.accent.iconRing,
                      )}
                      aria-hidden="true"
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <span
                      className={cn(
                        'inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset',
                        card.accent.badgeBg,
                        card.accent.badgeText,
                        card.accent.badgeRing,
                      )}
                    >
                      {card.badge}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold tracking-tight text-[var(--text)] sm:text-xl">
                    {card.title}
                  </h3>

                  {/* Description */}
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {card.desc}
                  </p>

                  {/* CTA — arrow slides right on hover, color shifts to primary */}
                  <span className="group-hover:text-primary mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text)] transition-colors">
                    Learn more
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================
                SECTION 2: Stats (Card Variant)
            ================================================================ */}
      <section className="border-y border-[var(--border)] bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-[var(--text)] sm:text-4xl">
              Platform at a Glance
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[var(--text-secondary)]">
              Growing every day as more professionals and companies choose Hire Adda
            </p>
          </div>
          <StatsSection variant="card" />
        </div>
      </section>

      {/* ================================================================
                SECTION 3: How It Works (Improved)
            ================================================================ */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <span className="bg-primary-light text-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
              Simple Process
            </span>
            <h2 className="mt-4 text-3xl font-bold text-[var(--text)] sm:text-4xl">
              How Hire Adda Works
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[var(--text-secondary)]">
              Get started in just three simple steps &mdash; whether you&apos;re looking for a job
              or hiring talent
            </p>
          </div>
          <div className="relative grid gap-8 md:grid-cols-3">
            {/* Connecting dashed line (desktop only) */}
            <div className="absolute top-10 right-[16.67%] left-[16.67%] hidden h-0.5 border-t-2 border-dashed border-[var(--border)] md:block" />

            {howItWorks.map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="bg-primary-light mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl shadow-sm">
                  <item.icon className="text-primary h-9 w-9" />
                </div>
                <span className="bg-primary mb-2 inline-block rounded-full px-3 py-0.5 text-xs font-bold text-white">
                  Step {item.step}
                </span>
                <h3 className="mb-3 text-xl font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="text-[var(--text-secondary)]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
                SECTION 4: Features (Expanded to 8)
            ================================================================ */}
      <section className="bg-[var(--bg-secondary)] py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <span className="bg-secondary-light text-secondary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
              Platform Features
            </span>
            <h2 className="mt-4 text-3xl font-bold text-[var(--text)] sm:text-4xl">
              Why Choose Hire Adda?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[var(--text-secondary)]">
              Enterprise-grade tools and features for a seamless hiring experience
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const fc = featureColorMap[feature.color];
              return (
                <div
                  key={feature.title}
                  className="hover:border-primary/30 rounded-xl border border-[var(--border)] bg-white p-6 transition-all hover:shadow-md"
                >
                  <div
                    className={`${fc.bg} mb-4 flex h-12 w-12 items-center justify-center rounded-xl`}
                  >
                    <feature.icon className={`${fc.text} h-6 w-6`} />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-[var(--text)]">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================
                SECTION 5: For Candidates / For Employers
            ================================================================ */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-[var(--text)] sm:text-4xl">
              Built for Everyone in the Hiring Journey
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[var(--text-secondary)]">
              Whether you&apos;re looking for your next opportunity or your next great hire
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* For Candidates */}
            <div className="from-primary-50 rounded-2xl border border-[var(--border)] bg-gradient-to-br to-white p-8 sm:p-10">
              <div className="bg-primary-light mb-6 flex h-14 w-14 items-center justify-center rounded-xl">
                <Users className="text-primary h-7 w-7" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-[var(--text)]">For Job Seekers</h3>
              <p className="mb-6 text-[var(--text-secondary)]">
                Everything you need to find and land your dream job
              </p>
              <ul className="mb-8 space-y-3">
                {candidateBenefits.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-3 text-sm text-[var(--text-secondary)]"
                  >
                    <CheckCircle className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
              <Tooltip content="Sign up and find your dream job">
                <Link href="/auth/register/candidate">
                  <Button size="lg" rightIcon={<ArrowRight className="h-5 w-5" />}>
                    Start Your Job Search
                  </Button>
                </Link>
              </Tooltip>
            </div>

            {/* For Employers */}
            <div className="from-accent-light rounded-2xl border border-[var(--border)] bg-gradient-to-br to-white p-8 sm:p-10">
              <div className="bg-accent-light mb-6 flex h-14 w-14 items-center justify-center rounded-xl">
                <Building2 className="text-accent h-7 w-7" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-[var(--text)]">For Employers</h3>
              <p className="mb-6 text-[var(--text-secondary)]">
                Powerful tools to find, evaluate, and hire the best talent
              </p>
              <ul className="mb-8 space-y-3">
                {employerBenefits.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-3 text-sm text-[var(--text-secondary)]"
                  >
                    <CheckCircle className="text-accent mt-0.5 h-4 w-4 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
              <Tooltip content="Register as an employer and start hiring">
                <Link href="/auth/register/employer">
                  <Button
                    size="lg"
                    className="bg-accent hover:bg-accent-hover text-white"
                    rightIcon={<ArrowRight className="h-5 w-5" />}
                  >
                    Start Hiring Today
                  </Button>
                </Link>
              </Tooltip>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
                SECTION 6: Popular Job Categories (real counts)
            ================================================================ */}
      <section className="bg-[var(--bg-secondary)] py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-[var(--text)] sm:text-4xl">
              Popular Job Categories
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[var(--text-secondary)]">
              Explore opportunities across India&apos;s fastest-growing industries
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {jobCategories.map((cat) => {
              const [bgColor, textColor] = cat.color.split(' ');
              const count = getCategoryCount(cat.title, categoryCounts);
              return (
                <Link
                  href="/auth/register/candidate"
                  key={cat.title}
                  title={`Browse ${cat.title} jobs`}
                  className="group hover:border-primary/30 rounded-xl border border-[var(--border)] bg-white p-5 transition-all hover:shadow-md"
                >
                  <div
                    className={cn(
                      'mb-3 flex h-11 w-11 items-center justify-center rounded-lg',
                      bgColor,
                    )}
                  >
                    <cat.icon className={cn('h-5 w-5', textColor)} />
                  </div>
                  <h3 className="group-hover:text-primary font-semibold text-[var(--text)] transition-colors">
                    {cat.title}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    {count > 0 ? `${count} active ${count === 1 ? 'job' : 'jobs'}` : 'Browse jobs'}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================
                SECTION 7: Testimonials
            ================================================================ */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-[var(--text)] sm:text-4xl">
              What Our Users Say
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[var(--text-secondary)]">
              Hear from professionals and employers who found success on Hire Adda
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-xl border border-[var(--border)] bg-white p-6 sm:p-8"
              >
                {/* Star rating */}
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[var(--warning)] text-[var(--warning)]" />
                  ))}
                </div>
                <blockquote className="leading-relaxed text-[var(--text-secondary)]">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="mt-6 flex items-center gap-3">
                  <div className="bg-primary-light flex h-10 w-10 items-center justify-center rounded-full">
                    <span className="text-primary text-sm font-bold">
                      {t.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text)]">{t.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {t.role} &middot; {t.company}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
                SECTION 8: Security & Trust
            ================================================================ */}
      <section className="bg-[var(--bg-secondary)] py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left: Text */}
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--success-light)] px-3 py-1 text-xs font-semibold text-[var(--success-dark)]">
                <Shield className="h-3.5 w-3.5" /> Enterprise-Grade Security
              </span>
              <h2 className="mt-4 text-3xl font-bold text-[var(--text)] sm:text-4xl">
                Your Data is Safe With Us
              </h2>
              <p className="mt-4 text-lg text-[var(--text-secondary)]">
                Hire Adda is built with enterprise-level security from the ground up. We protect
                your personal information and career data with industry-leading practices.
              </p>
              <ul className="mt-8 space-y-4">
                {securityPoints.map((point) => (
                  <li key={point.title} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--success-light)]">
                      <point.icon className="h-4 w-4 text-[var(--success)]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[var(--text)]">{point.title}</h4>
                      <p className="text-sm text-[var(--text-secondary)]">{point.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: Trust badges */}
            <div className="grid grid-cols-2 gap-4">
              {trustBadges.map((badge) => (
                <div
                  key={badge.label}
                  className="rounded-xl border border-[var(--border)] bg-white p-6 text-center"
                >
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--bg-secondary)] shadow-sm">
                    <badge.icon className="text-primary h-6 w-6" />
                  </div>
                  <div className="text-2xl font-bold text-[var(--text)]">{badge.value}</div>
                  <div className="mt-1 text-xs text-[var(--text-muted)]">{badge.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
                SECTION 9: FAQ
            ================================================================ */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-[var(--text)] sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[var(--text-secondary)]">
              Got questions? We have answers. If you can&apos;t find what you&apos;re looking for,{' '}
              <Link
                href="/contact"
                title="Go to contact page"
                className="text-primary hover:underline"
              >
                contact us
              </Link>
              .
            </p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] transition-shadow hover:shadow-sm"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-4 font-medium text-[var(--text)] [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <ChevronDown className="h-5 w-5 shrink-0 text-[var(--text-muted)] transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="border-t border-[var(--border)] px-6 py-4">
                  <p className="leading-relaxed text-[var(--text-secondary)]">{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
                SECTION 10: Final CTA
            ================================================================ */}
      <section className="bg-primary py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to Take the Next Step?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            Join thousands of professionals and companies who trust Hire Adda for smarter hiring and
            career growth.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Tooltip content="Sign up for a free Hire Adda account">
              <Link href="/auth/register/candidate">
                <Button
                  size="lg"
                  className="text-primary bg-white hover:bg-white/90"
                  rightIcon={<ArrowRight className="h-5 w-5" />}
                >
                  Create Free Account
                </Button>
              </Link>
            </Tooltip>
            <Tooltip content="Register as an employer and find top talent">
              <Link href="/auth/register/employer">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  Hire Talent
                </Button>
              </Link>
            </Tooltip>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
