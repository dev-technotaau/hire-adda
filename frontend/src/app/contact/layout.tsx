import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Contact Us | Talent Bridge',
    description: 'Get in touch with the Talent Bridge team. We\'re here to help with your job search or hiring needs.',
    keywords: ['contact talent bridge', 'support', 'help', 'customer service'],
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
    return children;
}
