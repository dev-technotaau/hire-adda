import PublicLayout from '@/components/layout/PublicLayout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy',
  description:
    'Understand the Hire Adda refund and cancellation policy for premium plans and paid services.',
};

const sections = [
  {
    title: 'Overview',
    content:
      'Hire Adda is committed to providing a fair and transparent refund process for all paid services on our platform. This Refund Policy applies to all premium subscriptions, paid job postings, featured listings, and any other paid services purchased through Hire Adda. Job seekers who use our free services are not affected by this policy. By purchasing any paid service, you agree to the terms outlined in this policy.',
  },
  {
    title: 'Free Services for Job Seekers',
    content:
      'Hire Adda is completely free for job seekers. All candidate features including profile creation, job search, job applications, AI-powered recommendations, and messaging are provided at no cost. Since no payment is collected from job seekers, this refund policy does not apply to candidate accounts. If you have been charged for any candidate service, please contact our support team immediately at support@Hire Adda.in for a full refund.',
  },
  {
    title: 'Employer Subscription Plans',
    content:
      'Employer premium plans are billed on a monthly or annual basis. You may cancel your subscription at any time from your account settings. If you cancel within the first 7 days of a new subscription or renewal, you are eligible for a full refund. Cancellations made after 7 days will not be refunded, but you will continue to have access to premium features until the end of your current billing period. Downgrading from a higher-tier plan to a lower-tier plan will take effect at the start of your next billing cycle; no partial refunds are provided for the current period.',
  },
  {
    title: 'Individual Job Posting Purchases',
    content:
      'If you purchase individual job postings or featured listing credits outside of a subscription plan, refunds are available under the following conditions: (a) if the job posting was not published due to a platform error, you will receive a full refund or credit; (b) if you request a refund within 24 hours of purchase and the posting has not yet received any applications, a full refund will be issued; (c) if a job posting is removed by our moderation team for a policy violation, no refund will be issued. Unused job posting credits remain valid for 12 months from the date of purchase.',
  },
  {
    title: 'Refund Process',
    content:
      'To request a refund, contact our support team at billing@hireadda.in or submit a support ticket through your dashboard with the subject line "Refund Request." Please include your account email, the transaction ID or invoice number, and the reason for your refund request. Our billing team will review your request within 3-5 business days. Approved refunds will be processed to the original payment method within 7-10 business days. You will receive an email confirmation once the refund has been initiated.',
  },
  {
    title: 'Non-Refundable Items',
    content:
      'The following are not eligible for refunds: (a) subscription fees after the 7-day cancellation window; (b) job postings that have been live for more than 24 hours and have received applications; (c) featured listing upgrades that have already been activated; (d) accounts suspended or terminated for violation of our Terms of Service; (e) any promotional or discounted purchases unless explicitly stated in the promotion terms. Background verification services, once initiated, are non-refundable regardless of the outcome.',
  },
  {
    title: 'Disputes and Chargebacks',
    content:
      'If you believe a charge is incorrect or unauthorized, please contact our support team before initiating a chargeback with your bank or payment provider. We are committed to resolving billing disputes quickly and fairly. Initiating a chargeback without first contacting us may result in a delay in resolution and possible suspension of your account pending investigation. We reserve the right to contest chargebacks that we believe are unwarranted.',
  },
  {
    title: 'Changes to This Policy',
    content:
      'Hire Adda reserves the right to modify this Refund Policy at any time. Changes will be posted on this page with an updated "Last updated" date. Material changes will be communicated to active subscribers via email. The revised policy will apply to all purchases made after the effective date of the change. Purchases made before the change will be governed by the policy in effect at the time of purchase.',
  },
  {
    title: 'Contact Us',
    content:
      'For billing inquiries and refund requests, email us at billing@hireadda.in. For general support, contact support@hireadda.in or call +91 1800-123-4567 (Mon-Fri, 9 AM - 6 PM IST). You may also write to us at Hire Adda Technologies Pvt. Ltd., 4th Floor, Tower B, Koramangala 4th Block, Bangalore, Karnataka 560034, India.',
  },
];

export default function RefundPolicyPage() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="from-primary-50 relative overflow-hidden bg-gradient-to-br via-white to-[var(--accent-light)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-[var(--text)] sm:text-5xl">
              Refund Policy
            </h1>
            <p className="mt-4 text-[var(--text-secondary)]">Last updated: February 2026</p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-[var(--border)] bg-white p-6 sm:p-10">
            <p className="leading-relaxed text-[var(--text-secondary)]">
              This Refund Policy governs all paid services offered by Hire Adda Technologies Pvt.
              Ltd. (&quot;Hire Adda,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). We
              aim to be fair and transparent in all billing matters. Please read this policy
              carefully before making any purchase on our platform.
            </p>

            <div className="mt-10 space-y-10">
              {sections.map((section, index) => (
                <div key={section.title}>
                  <h2 className="text-xl font-semibold text-[var(--text)]">
                    {index + 1}. {section.title}
                  </h2>
                  <p className="mt-3 leading-relaxed text-[var(--text-secondary)]">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10 border-t border-[var(--border)] pt-6">
              <p className="text-sm text-[var(--text-muted)]">
                This Refund Policy is effective as of February 1, 2026. Hire Adda Technologies Pvt.
                Ltd. is registered under the laws of India with its registered office in Bangalore,
                Karnataka. All refund decisions are at the sole discretion of Hire Adda and are
                final.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
