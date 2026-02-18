import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: {
        template: '%s | Admin — Talent Bridge',
        default: 'Admin Dashboard | Talent Bridge',
    },
    robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return children;
}
