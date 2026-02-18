'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import DashboardHeader from './DashboardHeader';
import MobileSidebar from './MobileSidebar';
import Sidebar from './Sidebar';
import { useAuth } from '@/hooks/use-auth';
import Spinner from '@/components/ui/Spinner';
import { ROUTES } from '@/constants/routes';

interface DashboardLayoutProps {
    children: React.ReactNode;
    requiredRole?: string[];
}

export default function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/super-admin');
            const loginUrl = isAdminPath ? ROUTES.PORTAL.LOGIN : '/auth/login';
            router.push(`${loginUrl}?redirect=${encodeURIComponent(window.location.pathname)}`);
        }
    }, [isLoading, isAuthenticated, router, pathname]);

    useEffect(() => {
        if (!isLoading && isAuthenticated && requiredRole && user?.role) {
            if (!requiredRole.includes(user.role)) {
                router.push('/');
            }
        }
    }, [isLoading, isAuthenticated, requiredRole, user, router]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[var(--bg-secondary)]">
            <DashboardHeader />
            <MobileSidebar />
            <div className="flex">
                <Sidebar />
                <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
