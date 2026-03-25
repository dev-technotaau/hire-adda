import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import Logo from '@/components/common/Logo';
import Tooltip from '@/components/ui/Tooltip';
import ManageCookiesButton from '@/components/common/ManageCookiesButton';

const footerLinks = {
  company: [
    { label: 'About Us', href: ROUTES.PUBLIC.ABOUT },
    { label: 'Contact Us', href: ROUTES.PUBLIC.CONTACT },
    { label: 'Careers', href: ROUTES.PUBLIC.CONTACT },
    { label: 'Press', href: ROUTES.PUBLIC.CONTACT },
  ],
  jobSeekers: [
    { label: 'Browse Jobs', href: ROUTES.AUTH.LOGIN },
    { label: 'Career Advice', href: ROUTES.PUBLIC.HELP },
    { label: 'Resume Builder', href: ROUTES.AUTH.LOGIN },
    { label: 'Salary Guide', href: ROUTES.PUBLIC.HELP },
  ],
  employers: [
    { label: 'Post a Job', href: ROUTES.AUTH.REGISTER },
    { label: 'Search Candidates', href: ROUTES.AUTH.LOGIN },
    { label: 'Pricing', href: ROUTES.PUBLIC.CONTACT },
    { label: 'Employer Resources', href: ROUTES.PUBLIC.HELP },
  ],
  support: [
    { label: 'Help Center', href: ROUTES.PUBLIC.HELP },
    { label: 'Privacy Policy', href: ROUTES.PUBLIC.PRIVACY },
    { label: 'Terms of Service', href: ROUTES.PUBLIC.TERMS },
    { label: 'Accessibility', href: ROUTES.PUBLIC.ACCESSIBILITY },
  ],
  legal: [
    { label: 'Cookie Policy', href: ROUTES.PUBLIC.COOKIE_POLICY },
    { label: 'Refund Policy', href: ROUTES.PUBLIC.REFUND_POLICY },
    { label: 'Disclaimer', href: ROUTES.PUBLIC.DISCLAIMER },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-secondary)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {/* Company */}
          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wider text-[var(--text)] uppercase">
              Company
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Tooltip content={`Go to ${link.label}`}>
                    <Link
                      href={link.href}
                      className="hover:text-primary text-sm text-[var(--text-secondary)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </Tooltip>
                </li>
              ))}
            </ul>
          </div>

          {/* Job Seekers */}
          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wider text-[var(--text)] uppercase">
              Job Seekers
            </h3>
            <ul className="space-y-3">
              {footerLinks.jobSeekers.map((link) => (
                <li key={link.label}>
                  <Tooltip content={`Go to ${link.label}`}>
                    <Link
                      href={link.href}
                      className="hover:text-primary text-sm text-[var(--text-secondary)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </Tooltip>
                </li>
              ))}
            </ul>
          </div>

          {/* Employers */}
          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wider text-[var(--text)] uppercase">
              Employers
            </h3>
            <ul className="space-y-3">
              {footerLinks.employers.map((link) => (
                <li key={link.label}>
                  <Tooltip content={`Go to ${link.label}`}>
                    <Link
                      href={link.href}
                      className="hover:text-secondary text-sm text-[var(--text-secondary)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </Tooltip>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wider text-[var(--text)] uppercase">
              Support
            </h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Tooltip content={`Go to ${link.label}`}>
                    <Link
                      href={link.href}
                      className="hover:text-primary text-sm text-[var(--text-secondary)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </Tooltip>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wider text-[var(--text)] uppercase">
              Legal
            </h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Tooltip content={`Go to ${link.label}`}>
                    <Link
                      href={link.href}
                      className="hover:text-primary text-sm text-[var(--text-secondary)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </Tooltip>
                </li>
              ))}
              <li>
                <ManageCookiesButton />
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] pt-8 sm:flex-row">
          <Logo size="sm" />
          <p className="text-sm text-[var(--text-muted)]">
            &copy; {new Date().getFullYear()} HireAdda. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
