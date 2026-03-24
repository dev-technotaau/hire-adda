import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | Hire Adda',
  description:
    "Get in touch with the Hire Adda team. We're here to help with your job search or hiring needs.",
  keywords: ['contact hire adda', 'support', 'help', 'customer service'],
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
