import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: {
        template: '%s | Talent Bridge',
        default: 'Authentication | Talent Bridge',
    },
    description: 'Sign in or create your account on Talent Bridge to find jobs or hire talent.',
    robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return children;
}
