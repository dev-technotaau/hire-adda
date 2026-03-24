import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help Center | Hire Adda',
  description:
    'Find answers to common questions about using Hire Adda. Browse FAQs and get support.',
  keywords: ['help', 'FAQ', 'support', 'hire adda help center'],
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
