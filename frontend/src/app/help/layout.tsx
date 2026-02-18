import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Help Center | Talent Bridge',
    description: 'Find answers to common questions about using Talent Bridge. Browse FAQs and get support.',
    keywords: ['help', 'FAQ', 'support', 'talent bridge help center'],
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
    return children;
}
