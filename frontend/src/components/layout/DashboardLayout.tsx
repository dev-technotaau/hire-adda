'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import DashboardHeader from './DashboardHeader';
import MobileSidebar from './MobileSidebar';
import Sidebar from './Sidebar';
import EmployerPlanGuard from '@/components/billing/EmployerPlanGuard';
import { useAuth } from '@/hooks/use-auth';
import { useSessionTimeout } from '@/hooks/use-session-timeout';
import Spinner from '@/components/ui/Spinner';
import AdminMfaRequired from '@/components/auth/AdminMfaRequired';
import SuperAdminMfaSetup from '@/components/auth/SuperAdminMfaSetup';
import { ROUTES } from '@/constants/routes';

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole?: string[];
}

export default function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useSessionTimeout();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Pick the role-specific login surface based on which dashboard the
      // user is trying to reach. Admin/super-admin go to the portal; the
      // public roles each have their own dedicated login page; anything
      // else (e.g. /billing/*) falls back to the chooser at /auth/login.
      const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/super-admin');
      const loginUrl = isAdminPath
        ? ROUTES.PORTAL.LOGIN
        : pathname.startsWith('/employer')
          ? ROUTES.AUTH.LOGIN_EMPLOYER
          : pathname.startsWith('/candidate')
            ? ROUTES.AUTH.LOGIN_CANDIDATE
            : pathname.startsWith('/vendor')
              ? ROUTES.AUTH.LOGIN_VENDOR
              : ROUTES.AUTH.LOGIN;
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

  const isAdminRoute = requiredRole?.some((r) => r === 'ADMIN' || r === 'SUPER_ADMIN');
  if (isAdminRoute && !user.mfaEnabled) {
    if (user.role === 'ADMIN') return <AdminMfaRequired />;
    if (user.role === 'SUPER_ADMIN') return <SuperAdminMfaSetup />;
  }

  // Per payment.md: "employer shouldn't get access to dashboard or any
  // employer page until he purchase a plan". EmployerPlanGuard fires only
  // for EMPLOYER role pages and short-circuits to /pricing when the user
  // has no active entitlement. New employers are auto-granted EMP_FREE on
  // signup so this only triggers after expiry / revoke.
  const needsEmployerGuard = requiredRole?.length === 1 && requiredRole[0] === 'EMPLOYER';

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[var(--bg-secondary)]">
      <DashboardHeader />
      <MobileSidebar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-x-hidden p-4 sm:p-6 lg:p-8">
          {needsEmployerGuard ? <EmployerPlanGuard>{children}</EmployerPlanGuard> : children}
        </main>
      </div>
    </div>
  );
}
