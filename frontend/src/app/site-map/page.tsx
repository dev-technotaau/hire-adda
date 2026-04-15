import Breadcrumbs from '@/components/common/Breadcrumbs';
import PublicLayout from '@/components/layout/PublicLayout';
import JsonLd from '@/components/seo/JsonLd';
import { generateMetadata as buildMetadata } from '@/components/common/SEO';
import Tooltip from '@/components/ui/Tooltip';
import { breadcrumbSchema, webPageSchema } from '@/lib/json-ld';
import {
  Briefcase,
  Building2,
  FileText,
  Gauge,
  Home,
  Info,
  KeyRound,
  LifeBuoy,
  Lock,
  LogIn,
  Mail,
  Map,
  Scale,
  ScrollText,
  Settings2,
  Sparkles,
  Users,
  UserPlus,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = buildMetadata({
  title: 'Site Map',
  description:
    'Complete site map of Hire Adda — find every page on the site in one place. Browse public pages, account entry points, legal information, and developer resources.',
  keywords: ['hire adda site map', 'sitemap', 'all pages', 'site index', 'navigation'],
  url: '/site-map',
});

type LinkItem = {
  label: string;
  href: string;
  description: string;
  external?: boolean;
  badge?: 'soon' | 'private' | 'raw';
};

type Section = {
  icon: typeof Home;
  title: string;
  accent: string;
  description: string;
  links: LinkItem[];
};

const SECTIONS: Section[] = [
  {
    icon: Home,
    title: 'Main',
    accent: 'text-primary bg-primary-light',
    description: 'Core public pages — what the site is and how to reach us.',
    links: [
      { label: 'Home', href: '/', description: 'Landing page and search entry' },
      {
        label: 'About',
        href: '/about',
        description: 'Mission, story, team and values',
      },
      { label: 'Contact', href: '/contact', description: 'Reach the support team' },
      {
        label: 'Help & FAQ',
        href: '/help',
        description: 'Answers to common questions',
      },
    ],
  },
  {
    icon: LogIn,
    title: 'Get Started',
    accent: 'text-success bg-success-light',
    description: 'Sign in or create an account to unlock the platform.',
    links: [
      { label: 'Login', href: '/auth/login', description: 'Existing users' },
      {
        label: 'Register',
        href: '/auth/register',
        description: 'New candidates and employers',
      },
      {
        label: 'Forgot Password',
        href: '/auth/forgot-password',
        description: 'Reset via email link',
      },
    ],
  },
  {
    icon: Users,
    title: 'For Candidates',
    accent: 'text-secondary bg-secondary-light',
    description:
      'Features available once you sign in as a candidate. All links redirect to login if you are not yet authenticated.',
    links: [
      {
        label: 'Candidate Dashboard',
        href: '/candidate',
        description: 'Overview of applications, saved jobs and recommendations',
        badge: 'private',
      },
      {
        label: 'Job Search',
        href: '/candidate/jobs',
        description: 'Find and apply to jobs with smart filters',
        badge: 'private',
      },
      {
        label: 'Profile',
        href: '/candidate/profile',
        description: 'Edit your professional profile and resume',
        badge: 'private',
      },
      {
        label: 'Applications',
        href: '/candidate/applications',
        description: 'Track submitted applications and their status',
        badge: 'private',
      },
    ],
  },
  {
    icon: Briefcase,
    title: 'For Employers',
    accent: 'text-accent bg-accent-light',
    description:
      'Features available once you sign in as an employer. All links redirect to login if you are not yet authenticated.',
    links: [
      {
        label: 'Employer Dashboard',
        href: '/employer',
        description: 'Overview of jobs, applicants and team',
        badge: 'private',
      },
      {
        label: 'Post a Job',
        href: '/employer/jobs/new',
        description: 'Create a new job listing',
        badge: 'private',
      },
      {
        label: 'My Jobs',
        href: '/employer/jobs',
        description: 'Manage your active and closed job posts',
        badge: 'private',
      },
      {
        label: 'Candidates',
        href: '/employer/candidates',
        description: 'Shortlist and review applicants',
        badge: 'private',
      },
      {
        label: 'Company Profile',
        href: '/employer/profile',
        description: 'Edit your company page',
        badge: 'private',
      },
    ],
  },
  {
    icon: Sparkles,
    title: 'Coming Soon',
    accent: 'text-warning bg-warning-light',
    description: 'Public pages in active development — launching soon.',
    links: [
      {
        label: 'Browse Jobs',
        href: '/jobs',
        description: 'Public job listings without signing in',
        badge: 'soon',
      },
      {
        label: 'Browse Companies',
        href: '/companies',
        description: 'Explore company profiles and open roles',
        badge: 'soon',
      },
    ],
  },
  {
    icon: Scale,
    title: 'Legal & Policies',
    accent: 'text-info bg-info-light',
    description: 'Terms that govern your use of Hire Adda and explain how we handle your data.',
    links: [
      {
        label: 'Privacy Policy',
        href: '/privacy',
        description: 'How we collect, use and protect your data',
      },
      { label: 'Terms of Service', href: '/terms', description: 'Rules of the road' },
      {
        label: 'Cookie Policy',
        href: '/cookie-policy',
        description: 'What cookies we use and why',
      },
      {
        label: 'Refund Policy',
        href: '/refund-policy',
        description: 'When and how refunds are issued',
      },
      {
        label: 'Accessibility',
        href: '/accessibility',
        description: 'Our commitment to WCAG 2.1 AA',
      },
      {
        label: 'Disclaimer',
        href: '/disclaimer',
        description: 'Limitations of content and liability',
      },
    ],
  },
  {
    icon: Settings2,
    title: 'Developer & Crawler Resources',
    accent: 'text-[var(--text-secondary)] bg-[var(--bg-tertiary)]',
    description:
      'Machine-readable files for search engines, password managers, email clients and native apps.',
    links: [
      {
        label: 'XML Sitemap',
        href: '/sitemap.xml',
        description: 'Search-engine sitemap index (crawlers)',
        badge: 'raw',
      },
      {
        label: 'robots.txt',
        href: '/robots.txt',
        description: 'Crawler policy with per-agent rules',
        badge: 'raw',
      },
      {
        label: 'humans.txt',
        href: '/humans.txt',
        description: 'Team and technology credits',
        badge: 'raw',
      },
      {
        label: 'Security Policy',
        href: '/.well-known/security.txt',
        description: 'How to report a vulnerability',
        badge: 'raw',
      },
      {
        label: 'MTA-STS Policy',
        href: '/.well-known/mta-sts.txt',
        description: 'Email transport security policy',
        badge: 'raw',
      },
      {
        label: 'Change Password',
        href: '/.well-known/change-password',
        description: 'RFC 8615 — password-manager endpoint',
        badge: 'raw',
      },
    ],
  },
];

const BADGE_STYLES: Record<NonNullable<LinkItem['badge']>, { label: string; className: string }> = {
  soon: {
    label: 'Coming soon',
    className: 'bg-warning-light text-[var(--warning-dark)]',
  },
  private: {
    label: 'Login required',
    className: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
  },
  raw: {
    label: 'Raw file',
    className: 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]',
  },
};

function TOTAL_LINK_COUNT(): number {
  return SECTIONS.reduce((n, s) => n + s.links.length, 0);
}

export default function SitemapPage() {
  const totalLinks = TOTAL_LINK_COUNT();
  const breadcrumb = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Site Map', url: '/site-map' },
  ]);
  const webPage = webPageSchema({
    url: '/site-map',
    name: 'Site Map',
    description:
      'Complete site map of Hire Adda — every public page, account entry point, and developer resource.',
    breadcrumb,
  });

  return (
    <PublicLayout>
      <JsonLd id="jsonld-sitemap-webpage" data={webPage} />
      <JsonLd id="jsonld-sitemap-breadcrumb" data={breadcrumb} />

      {/* Hero */}
      <section className="from-primary-50 relative overflow-hidden bg-gradient-to-br via-white to-[var(--accent-light)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="bg-primary-light mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl">
              <Map className="text-primary h-7 w-7" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-[var(--text)] sm:text-5xl lg:text-6xl">
              Site <span className="text-primary">Map</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--text-secondary)] sm:text-xl">
              Every page on Hire Adda, organised in one place. {totalLinks} destinations across{' '}
              {SECTIONS.length} categories — from marketing pages to developer resources.
            </p>
          </div>
        </div>
      </section>

      {/* Breadcrumbs */}
      <div className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ name: 'Site Map' }]} withSchema={false} />
        </div>
      </div>

      {/* Sections */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:gap-10">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.title}
                className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:p-8"
              >
                <div className="mb-4 flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${section.accent}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-[var(--text)] sm:text-2xl">
                      {section.title}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">{section.description}</p>
                  </div>
                </div>

                <ul className="mt-4 space-y-2">
                  {section.links.map((link) => {
                    const badge = link.badge ? BADGE_STYLES[link.badge] : null;
                    const LinkIcon = pickLinkIcon(link.label);
                    const linkContent = (
                      <>
                        <LinkIcon className="h-4 w-4 shrink-0 text-[var(--text-muted)] group-hover:text-[var(--primary)]" />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-[var(--text)] group-hover:text-[var(--primary)]">
                              {link.label}
                            </span>
                            {badge && (
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase ${badge.className}`}
                              >
                                {badge.label}
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 block text-xs text-[var(--text-muted)]">
                            {link.description}
                          </span>
                        </span>
                      </>
                    );

                    return (
                      <li key={link.href}>
                        <Tooltip content={`Open ${link.label}`}>
                          <Link
                            href={link.href}
                            className="group flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-[var(--bg-secondary)]"
                            {...(link.external
                              ? { target: '_blank', rel: 'noopener noreferrer' }
                              : {})}
                          >
                            {linkContent}
                          </Link>
                        </Tooltip>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="mt-12 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-secondary)] p-6 text-center text-sm text-[var(--text-muted)] sm:p-8">
          <p>
            Looking for something you can&apos;t find?{' '}
            <Link href="/contact" className="text-primary hover:underline">
              Get in touch
            </Link>{' '}
            or explore our{' '}
            <Link href="/help" className="text-primary hover:underline">
              Help Center
            </Link>
            .
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}

/**
 * Pick a small icon by label heuristic — keeps the markup visually varied
 * without hand-assigning an icon to every single link.
 */
function pickLinkIcon(label: string) {
  const l = label.toLowerCase();
  if (l.includes('dashboard')) return Gauge;
  if (l.includes('login') || l.includes('password')) return KeyRound;
  if (l.includes('register')) return UserPlus;
  if (l.includes('profile')) return Users;
  if (l.includes('contact') || l.includes('mail')) return Mail;
  if (l.includes('help') || l.includes('support')) return LifeBuoy;
  if (l.includes('home')) return Home;
  if (l.includes('about')) return Info;
  if (l.includes('job')) return Briefcase;
  if (l.includes('compan')) return Building2;
  if (l.includes('privacy') || l.includes('security') || l.includes('mta')) return Lock;
  if (l.includes('terms') || l.includes('policy') || l.includes('disclaimer')) return ScrollText;
  return FileText;
}
