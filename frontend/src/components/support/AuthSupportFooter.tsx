'use client';

/**
 * AuthSupportFooter — the small "Need help?" strip rendered below auth
 * forms, pricing pages, and onboarding flows.
 *
 *   - Two buttons: "Help & FAQs" (HelpModal) and "Contact us" (ContactModal).
 *   - For `audience="employer"`, the modal triggers also surface the
 *     dedicated employer helpline (`EMPLOYER_HELPLINE`) with a tel: link
 *     and Mon-Sat hours.
 *   - `pageContext` is forwarded to HelpModal so each surface gets a
 *     curated FAQ slice.
 *   - `defaultCategory` is forwarded to ContactModal so triggers on
 *     billing pages pre-select the BILLING category, and so on.
 */

import { useState } from 'react';
import { HelpCircle, MessageCircle, Phone } from 'lucide-react';
import HelpModal from './HelpModal';
import ContactModal from './ContactModal';
import { EMPLOYER_HELPLINE, EMPLOYER_HELPLINE_HOURS } from '@/constants/support';
import type { FaqAudience, FaqPageContext } from '@/data/faqs';
import type { TicketCategory } from '@/types/ticket';

interface AuthSupportFooterProps {
  pageContext: FaqPageContext;
  audience?: FaqAudience;
  /** Hide the FAQ button when the host page already has a FAQ section. */
  showHelp?: boolean;
  /** Hide the Contact button on flows that own contact UX themselves. */
  showContact?: boolean;
  /** ContactModal pre-select. */
  defaultCategory?: TicketCategory;
  /** Compact rendering for cramped contexts (e.g. modal-style auth cards). */
  variant?: 'default' | 'compact';
  /** Optional extra Tailwind classes for the wrapper. */
  className?: string;
}

export default function AuthSupportFooter({
  pageContext,
  audience = 'all',
  showHelp = true,
  showContact = true,
  defaultCategory = 'GENERAL',
  variant = 'default',
  className,
}: AuthSupportFooterProps) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const isEmployer = audience === 'employer';

  return (
    <>
      <div
        className={`mt-6 flex flex-col items-center gap-3 ${className ?? ''}`}
        data-variant={variant}
      >
        {/* Employer helpline — shown only on employer surfaces. tel: link
            mobile-friendly + visible hours so users don't call after-hours. */}
        {isEmployer && (
          <a
            href={EMPLOYER_HELPLINE.href}
            className="hover:border-primary/40 flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 transition-colors"
          >
            <div className="bg-primary-light flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
              <Phone className="text-primary h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-xs text-[var(--text-muted)]">Employer helpline</p>
              <p className="text-sm font-semibold text-[var(--text)]">
                {EMPLOYER_HELPLINE.display}
              </p>
            </div>
            <span className="hidden text-xs text-[var(--text-muted)] sm:block">
              {EMPLOYER_HELPLINE_HOURS}
            </span>
          </a>
        )}

        {/* Help + Contact buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
          {showHelp && (
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="hover:border-primary hover:text-primary inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-[var(--text-secondary)] transition-colors"
            >
              <HelpCircle className="h-4 w-4" />
              Help & FAQs
            </button>
          )}
          {showContact && (
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="hover:border-primary hover:text-primary inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-[var(--text-secondary)] transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Contact us
            </button>
          )}
        </div>
      </div>

      {showHelp && (
        <HelpModal
          isOpen={helpOpen}
          onClose={() => setHelpOpen(false)}
          pageContext={pageContext}
          audience={audience}
        />
      )}
      {showContact && (
        <ContactModal
          isOpen={contactOpen}
          onClose={() => setContactOpen(false)}
          defaultCategory={defaultCategory}
          showEmployerHelpline={isEmployer}
        />
      )}
    </>
  );
}
