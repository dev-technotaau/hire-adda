import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: {
        template: '%s | Employer Portal — Talent Bridge',
        default: 'Employer Dashboard | Talent Bridge',
    },
    description: 'Post jobs, manage applications, and find top candidates on Talent Bridge.',
    robots: { index: false, follow: false },
};

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
    return children;
}
