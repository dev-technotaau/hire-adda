import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Notifications | Talent Bridge',
    description: 'View and manage your notifications on Talent Bridge.',
    robots: { index: false, follow: false },
};

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
    return children;
}
