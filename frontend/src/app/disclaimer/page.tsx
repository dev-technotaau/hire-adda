import type { Metadata } from 'next';
import PublicLayout from '@/components/layout/PublicLayout';

export const metadata: Metadata = {
  title: 'Disclaimer',
  description:
    'Read the TalentBridge disclaimer regarding the use of our job portal platform and the information provided therein.',
};

const sections = [
  {
    title: 'General Disclaimer',
    content:
      'The information provided on the TalentBridge platform is for general informational purposes only. While we strive to keep the information accurate and up to date, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability of the platform or the information, products, services, or related content contained on the platform for any purpose. Any reliance you place on such information is strictly at your own risk.',
  },
  {
    title: 'No Employment Guarantee',
    content:
      'TalentBridge is a platform that connects job seekers with employers. We do not guarantee employment or hiring outcomes for any user. The job listings on our platform are posted by employers, and TalentBridge does not endorse, verify, or guarantee the accuracy of any job listing, salary information, company details, or employer claims. Candidates are advised to independently verify all job-related information before accepting any offer. Similarly, employers are responsible for independently evaluating candidates and verifying their qualifications, experience, and references.',
  },
  {
    title: 'Third-Party Content',
    content:
      'Our platform may contain links to third-party websites, services, or content that are not owned or controlled by TalentBridge. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services. We do not warrant the offerings of any third parties. You acknowledge and agree that TalentBridge shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with the use of or reliance on any content, goods, or services available on or through any third-party websites or services.',
  },
  {
    title: 'User-Generated Content',
    content:
      'The profiles, resumes, job listings, reviews, and other content posted by users on TalentBridge are the responsibility of the users who post them. TalentBridge does not endorse, guarantee, or assume responsibility for the accuracy, completeness, or legality of user-generated content. While we employ moderation practices to maintain content quality, we cannot review every piece of content in real time. If you encounter content that is inaccurate, misleading, or violates our guidelines, please report it using the reporting features on our platform.',
  },
  {
    title: 'AI and Automated Recommendations',
    content:
      'TalentBridge uses artificial intelligence and machine learning algorithms to provide job recommendations, candidate matching, and other automated features. These recommendations are based on the data available to us and our algorithmic models. They are provided as suggestions only and should not be treated as professional advice or guaranteed matches. The AI systems may not capture all relevant factors, and we encourage users to exercise their own judgment when making career or hiring decisions. We are not liable for any outcomes resulting from reliance on automated recommendations.',
  },
  {
    title: 'Professional Advice Disclaimer',
    content:
      'Nothing on the TalentBridge platform constitutes professional advice, whether legal, financial, career, or otherwise. The career-related content, salary information, company reviews, and other informational resources on our platform are provided for general guidance only. You should consult appropriate professional advisors for advice specific to your situation. TalentBridge does not replace professional career counseling, legal counsel, or financial advisory services.',
  },
  {
    title: 'Limitation of Liability',
    content:
      'In no event shall TalentBridge Technologies Pvt. Ltd., its directors, officers, employees, affiliates, or partners be liable to you or any third party for any indirect, consequential, incidental, special, or punitive damages, including lost profits, lost revenue, lost data, or business interruption, however caused and under any theory of liability, whether in contract, tort (including negligence), strict liability, or otherwise, even if we have been advised of the possibility of such damages. Our total liability for any claims arising out of or relating to this platform shall not exceed INR 10,000 or the amount you have paid us in the past 12 months, whichever is greater.',
  },
  {
    title: 'Indemnification',
    content:
      'You agree to indemnify, defend, and hold harmless TalentBridge Technologies Pvt. Ltd. and its officers, directors, employees, agents, affiliates, and partners from and against any claims, liabilities, damages, losses, and expenses, including reasonable legal fees, arising out of or in any way connected with your access to or use of the platform, your violation of these terms, your violation of any third-party right, or any content you submit to the platform.',
  },
  {
    title: 'Changes to This Disclaimer',
    content:
      'TalentBridge reserves the right to modify this Disclaimer at any time. Changes will be effective immediately upon posting to this page. Your continued use of the platform following any changes constitutes your acceptance of the revised Disclaimer. We encourage you to review this page periodically for the latest information.',
  },
  {
    title: 'Contact Us',
    content:
      'If you have any questions about this Disclaimer, please contact us at legal@talentbridge.com. For general inquiries, reach out to support@talentbridge.com or call +91 1800-123-4567 (Mon-Fri, 9 AM - 6 PM IST). You may also write to us at TalentBridge Technologies Pvt. Ltd., 4th Floor, Tower B, Koramangala 4th Block, Bangalore, Karnataka 560034, India.',
  },
];

export default function DisclaimerPage() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="from-primary-50 relative overflow-hidden bg-gradient-to-br via-white to-[var(--accent-light)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-[var(--text)] sm:text-5xl">
              Disclaimer
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
              This Disclaimer applies to all content and services provided by TalentBridge
              Technologies Pvt. Ltd. (&quot;TalentBridge,&quot; &quot;we,&quot; &quot;us,&quot; or
              &quot;our&quot;) through our platform. By accessing and using TalentBridge, you
              acknowledge that you have read, understood, and agree to be bound by this Disclaimer.
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
                This Disclaimer is effective as of February 1, 2026. TalentBridge Technologies Pvt.
                Ltd. is registered under the laws of India with its registered office in Bangalore,
                Karnataka. By using our platform, you acknowledge that you have read and understood
                this Disclaimer.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
