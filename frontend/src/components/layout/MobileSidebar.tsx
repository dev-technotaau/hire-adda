'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, LogOut } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useUIStore } from '@/store/ui.store';
import { ROLE_DASHBOARDS } from '@/constants/routes';
import { ROLE_LABELS } from '@/constants/enums';
import { QUERY_KEYS } from '@/constants/config';
import { employerService } from '@/services/employer.service';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Tooltip from '@/components/ui/Tooltip';
import Logo from '@/components/common/Logo';
import { getNavItems } from './Sidebar';
import type { Role } from '@/types/auth';

const ROLE_BADGE_VARIANT: Record<string, 'info' | 'success' | 'warning' | 'error'> = {
  CANDIDATE: 'info',
  EMPLOYER: 'success',
  ADMIN: 'warning',
  SUPER_ADMIN: 'error',
};

export default function MobileSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  const { data: companyData } = useQuery({
    queryKey: QUERY_KEYS.EMPLOYERS.COMPANY,
    queryFn: () => employerService.getCompany(),
    enabled: user?.role === 'EMPLOYER',
    staleTime: 10 * 60 * 1000,
  });
  const companyLogo = companyData?.data?.logo;

  const dashboardPath = user?.role ? ROLE_DASHBOARDS[user.role as Role] : '/';
  const navItems = getNavItems(user?.role);

  // Close on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  // Close on Escape
  useEffect(() => {
    if (!sidebarOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [sidebarOpen, setSidebarOpen]);

  // Body scroll lock
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [sidebarOpen]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-[60] lg:hidden',
        sidebarOpen ? 'pointer-events-auto' : 'pointer-events-none',
      )}
    >
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300',
          sidebarOpen ? 'opacity-100' : 'opacity-0',
        )}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className={cn(
          'absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        {/* Header */}
        <div className="flex h-18 items-center justify-between border-b border-[var(--border)] px-4">
          <Logo size="sm" href={dashboardPath} />
          <Tooltip content="Close sidebar">
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </Tooltip>
        </div>

        {/* User info */}
        {user && (
          <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
            {companyLogo && (
              <img
                src={companyLogo}
                alt="Company"
                className="h-8 w-8 rounded-md border border-[var(--border)] object-contain"
              />
            )}
            <Avatar
              src={user.avatar}
              firstName={user.firstName}
              lastName={user.lastName}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--text)]">
                {user.firstName} {user.lastName}
              </p>
              <Badge variant={ROLE_BADGE_VARIANT[user.role] || 'info'} size="sm">
                {ROLE_LABELS[user.role] || user.role}
              </Badge>
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isDashboard = item.label === 'Dashboard';
              const isActive = isDashboard
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Tooltip content={`Navigate to ${item.label}`}>
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-primary-light text-primary'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]',
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </Tooltip>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-[var(--border)] p-3">
          <Tooltip content="Sign out of your account">
            <button
              onClick={() => {
                setSidebarOpen(false);
                logout();
              }}
              className="text-error hover:bg-error-light flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </Tooltip>
        </div>
      </aside>
    </div>
  );
}
