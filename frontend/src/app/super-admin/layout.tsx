import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: {
        template: '%s | Super Admin — Talent Bridge',
        default: 'Super Admin Dashboard | Talent Bridge',
    },
    robots: { index: false, follow: false },
};

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
    return children;
}
