import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: {
        template: '%s | Candidate Portal — Talent Bridge',
        default: 'Candidate Dashboard | Talent Bridge',
    },
    description: 'Manage your job applications, profile, and career opportunities on Talent Bridge.',
    robots: { index: false, follow: false },
};

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
    return children;
}
