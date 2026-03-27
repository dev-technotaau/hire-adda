'use client';

import PublicLayout from '@/components/layout/PublicLayout';
import Button from '@/components/ui/Button';
import Tooltip from '@/components/ui/Tooltip';
import { useAuthStore } from '@/store/auth.store';
import { ChevronDown, Mail, MessageCircle, Phone, Search, TicketCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const faqs = [
  {
    id: 1,
    question: 'How do I create an account on Hire Adda?',
    answer:
      'Creating an account is simple and free. Click the "Get Started" or "Sign Up" button on the homepage. You can register using your email address and password, or sign up quickly using your Google or LinkedIn account. Once registered, you will be guided through completing your profile with your skills, experience, and job preferences.',
  },
  {
    id: 2,
    question: 'How do I apply for jobs on the platform?',
    answer:
      'Once you have created your profile, browse jobs using the search bar or explore curated listings on your dashboard. When you find a job you are interested in, click the "Apply" button on the job detail page. Your profile and resume will be shared with the employer. You can also enable "Quick Apply" to apply to multiple positions with a single click using your saved profile.',
  },
  {
    id: 3,
    question: 'How do I post a job as an employer?',
    answer:
      'Register as an employer and complete your company profile with details like company name, description, industry, and location. Once verified, navigate to your employer dashboard and click "Post a Job." Fill in the job title, description, required skills, salary range, and other details. Your listing will go live after a brief moderation review to ensure quality.',
  },
  {
    id: 4,
    question: 'How do I update my profile information?',
    answer:
      'Log in to your account and navigate to your profile page from the dashboard. You can edit your personal information, work experience, education, skills, and preferences at any time. Click "Edit Profile" to make changes, and remember to save once you are done. Keeping your profile updated helps our matching engine find better opportunities for you.',
  },
  {
    id: 5,
    question: 'How do I reset my password?',
    answer:
      'If you have forgotten your password, click "Forgot Password" on the login page. Enter the email address associated with your account, and we will send you a password reset link. The link is valid for 1 hour. Click it to set a new password. If you do not receive the email, check your spam folder or contact our support team for assistance.',
  },
  {
    id: 6,
    question: 'How do I delete my account?',
    answer:
      'You can request account deletion from your account settings page. Navigate to Settings, then scroll to the "Danger Zone" section and click "Delete Account." You will be asked to confirm your decision. Please note that account deletion is permanent and all your data, including applications, saved jobs, and messages, will be permanently removed within 30 days.',
  },
  {
    id: 7,
    question: 'How do I contact customer support?',
    answer:
      'You can reach our support team through multiple channels. Email us at support@hireadda.in, call our toll-free number at +91 1800-123-4567 (Mon-Fri, 9 AM - 6 PM IST), or visit our Contact page to send a message directly. We also offer in-app chat support for logged-in users. Our team typically responds within 24 hours.',
  },
  {
    id: 8,
    question: 'How do I report a suspicious or fraudulent job posting?',
    answer:
      'If you encounter a job listing that appears fraudulent, misleading, or suspicious, click the "Report" button on the job detail page. Select the reason for reporting and provide any additional details. Our moderation team reviews all reports within 24-48 hours. You can also email reports directly to safety@hireadda.in for urgent concerns.',
  },
  {
    id: 9,
    question: 'Is Hire Adda free to use? What are the pricing plans?',
    answer:
      'Hire Adda is completely free for job seekers. You can create a profile, search for jobs, and apply to unlimited positions at no cost. For employers, we offer a free plan that allows up to 3 active job postings. Premium plans start at INR 2,999/month and include features like unlimited postings, advanced candidate search, analytics dashboard, and priority support.',
  },
  {
    id: 10,
    question: 'Is there a Hire Adda mobile app available?',
    answer:
      'We are currently developing native mobile apps for both Android and iOS, expected to launch in Q3 2026. In the meantime, our website is fully responsive and works seamlessly on mobile browsers. You can add Hire Adda to your home screen for an app-like experience. We also support push notifications through your browser to keep you updated on new matches and application status.',
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());
  const user = useAuthStore((s: { user: { role: string } | null }) => s.user);

  const toggleItem = (id: number) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredFaqs = faqs.filter((faq) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return faq.question.toLowerCase().includes(query) || faq.answer.toLowerCase().includes(query);
  });

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="from-primary-50 relative overflow-hidden bg-gradient-to-br via-white to-[var(--accent-light)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-[var(--text)] sm:text-5xl">
              Help <span className="text-primary">Center</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--text-secondary)]">
              Find answers to common questions about using Hire Adda. Can&apos;t find what
              you&apos;re looking for? Contact our support team.
            </p>

            {/* Search Bar */}
            <div className="relative mx-auto mt-8 max-w-xl">
              <div className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[var(--text-muted)]">
                <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                placeholder="Search for help topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="focus:border-primary focus:ring-primary/20 h-12 w-full rounded-xl border border-[var(--border)] bg-white pr-4 pl-12 text-[var(--text)] shadow-sm transition-colors duration-200 placeholder:text-[var(--text-muted)] focus:ring-2 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-[var(--text)]">Frequently Asked Questions</h2>
            <p className="mt-2 text-[var(--text-secondary)]">
              {filteredFaqs.length === 0
                ? 'No results found. Try a different search term.'
                : `Showing ${filteredFaqs.length} of ${faqs.length} questions`}
            </p>
          </div>

          <div className="space-y-3">
            {filteredFaqs.map((faq) => {
              const isOpen = openItems.has(faq.id);
              return (
                <div
                  key={faq.id}
                  className="rounded-xl border border-[var(--border)] bg-white transition-shadow hover:shadow-sm"
                >
                  <button
                    onClick={() => toggleItem(faq.id)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
                  >
                    <span className="font-medium text-[var(--text)]">{faq.question}</span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="border-t border-[var(--border)] px-6 py-4">
                      <p className="leading-relaxed text-[var(--text-secondary)]">{faq.answer}</p>
                    </div>
                  )}
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
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--border)] bg-white p-6 text-center">
              <div className="bg-primary-light mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                <Mail className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-semibold text-[var(--text)]">Email Support</h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">support@hireadda.in</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Response within 24 hours</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-white p-6 text-center">
              <div className="bg-primary-light mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                <Phone className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-semibold text-[var(--text)]">Phone Support</h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">+91 1800-123-4567</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Mon-Fri, 9 AM - 6 PM IST</p>
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
    </PublicLayout>
  );
}
