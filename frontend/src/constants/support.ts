/**
 * Support contact information used across modals, footers, and dashboard
 * widgets. Single source of truth — change a value here and it propagates
 * everywhere.
 *
 * The employer helpline is a separate, dedicated number for paying
 * customers (employers and recruiters). The generic helpline + email
 * remain the primary contacts for candidates, vendors, and pre-purchase
 * inquiries.
 */

export interface SupportPhone {
  /** Display value with country-code spacing for visual scan. */
  display: string;
  /** Tel-URI value (E.164, no spaces). */
  href: string;
}

export const SUPPORT_EMAIL = 'support@hireadda.in';

/**
 * Generic helpline shown on /help, /contact, and as the candidate /
 * vendor / pre-purchase support number. Toll-free.
 */
export const GENERIC_HELPLINE: SupportPhone = {
  display: '+91 1800-123-4567',
  href: 'tel:+9118001234567',
};

/**
 * Employer-only helpline. Surfaced on:
 *   - /pricing/employer
 *   - /auth/login/employer + /auth/register/employer
 *   - /employer dashboard
 *   - Employer onboarding
 *
 * Mon–Sat 09:00–18:00 IST. tel:-link only (no WhatsApp per business
 * preference).
 */
export const EMPLOYER_HELPLINE: SupportPhone = {
  display: '+91 73740 11333',
  href: 'tel:+917374011333',
};

export const EMPLOYER_HELPLINE_HOURS = 'Mon–Sat, 9:00 AM – 6:00 PM IST';
export const GENERIC_HELPLINE_HOURS = 'Mon–Fri, 9:00 AM – 6:00 PM IST';

/**
 * WhatsApp support channel.
 *
 * Surfaced ONLY to plans that include `feature.whatsapp_priority`,
 * `feature.whatsapp_support`, or `feature.priority_support`:
 *   - Candidate Premium (₹199)            → Priority WhatsApp Support
 *   - Employer Standard (₹499)            → WhatsApp Support
 *   - Employer Premium (₹999)             → Priority WhatsApp Support
 *   - CV Pro (₹3999)                      → Priority Support (incl. WhatsApp)
 *   - Assisted Hiring (₹1499)             → WhatsApp Support
 *   - Vendor Connect (₹199/mo)            → WhatsApp Support
 *
 * Priority tier (HIGH ticket priority on the backend, ≤30 min response
 * SLA in copy) vs Standard tier (HIGH priority but ≤24 h SLA copy) is
 * signalled by the feature flag set the user holds.
 */
export interface WhatsappContact {
  /** Display value with country-code spacing for visual scan. */
  display: string;
  /** wa.me/ deep-link form (no plus sign, includes country code). */
  href: string;
  /** Tel-URI form (E.164 with plus). */
  telHref: string;
  /** E.164 form for schema.org telephone fields. */
  e164: string;
}

export const WHATSAPP_SUPPORT: WhatsappContact = {
  display: '+91 80540 50551',
  href: 'https://wa.me/918054050551',
  telHref: 'tel:+918054050551',
  e164: '+91-8054050551',
};

export const WHATSAPP_PRIORITY_SLA = 'Replies typically within 30 minutes';
export const WHATSAPP_STANDARD_SLA = 'Replies typically within a few hours';
export const WHATSAPP_AVAILABILITY = 'Mon–Sat, 9:00 AM – 9:00 PM IST';

/**
 * Pre-filled WhatsApp message that opens when the user taps the chat
 * link. Includes the user's plan + ticket-priority context so the
 * support agent can triage instantly.
 */
export function buildWhatsappChatUrl(presetMessage?: string): string {
  if (!presetMessage) return WHATSAPP_SUPPORT.href;
  return `${WHATSAPP_SUPPORT.href}?text=${encodeURIComponent(presetMessage)}`;
}
