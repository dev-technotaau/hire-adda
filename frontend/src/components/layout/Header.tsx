'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Settings,
  LayoutDashboard,
  Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useUnreadCount } from '@/hooks/use-notifications';
import { useUIStore } from '@/store/ui.store';
import { ROUTES, ROLE_DASHBOARDS } from '@/constants/routes';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Tooltip from '@/components/ui/Tooltip';
import Logo from '@/components/common/Logo';
import type { Role } from '@/types/auth';

const publicNavItems = [
  { label: 'Home', href: ROUTES.PUBLIC.HOME },
  { label: 'About', href: ROUTES.PUBLIC.ABOUT },
  { label: 'Contact', href: ROUTES.PUBLIC.CONTACT },
  { label: 'Help', href: ROUTES.PUBLIC.HELP },
];

export default function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { data: unreadData } = useUnreadCount();
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const unreadCount = unreadData?.data?.count || 0;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    queueMicrotask(() => {
      setMobileMenuOpen(false);
      setUserMenuOpen(false);
    });
  }, [pathname, setMobileMenuOpen]);

  // Close user menu on Escape key
  const handleEscapeKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false);
        setMobileMenuOpen(false);
      }
    },
    [setMobileMenuOpen],
  );

  useEffect(() => {
    if (userMenuOpen || mobileMenuOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [userMenuOpen, mobileMenuOpen, handleEscapeKey]);

  const dashboardPath = user?.role ? ROLE_DASHBOARDS[user.role as Role] : '/';

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        scrolled
          ? 'border-b border-[var(--border)] bg-white/80 shadow-sm backdrop-blur-lg'
          : 'bg-white',
      )}
    >
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Logo />

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {publicNavItems.map((item) => (
            <Tooltip key={item.href} content={`Go to ${item.label}`}>
              <Link
                href={item.href}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-primary-light text-primary'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]',
                )}
              >
                {item.label}
              </Link>
            </Tooltip>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              {/* Notifications */}
              <Tooltip content="View notifications">
                <Link
                  href={ROUTES.NOTIFICATIONS}
                  className="relative rounded-lg p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]"
                  aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="bg-error absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-medium text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
              </Tooltip>

              {/* User Menu */}
              <div className="relative">
                <Tooltip content="Open user menu">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-[var(--bg-secondary)]"
                  >
                    <Avatar
                      src={user.avatar}
                      firstName={user.firstName}
                      lastName={user.lastName}
                      size="sm"
                    />
                    <span className="hidden text-sm font-medium text-[var(--text)] lg:block">
                      {user.firstName}
                    </span>
                    <ChevronDown
                      className={cn(
                        'hidden h-4 w-4 text-[var(--text-muted)] transition-transform lg:block',
                        userMenuOpen && 'rotate-180',
                      )}
                    />
                  </button>
                </Tooltip>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="animate-scale-in absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-lg">
                      <div className="border-b border-[var(--border)] px-4 py-3">
                        <p className="text-sm font-medium text-[var(--text)]">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">{user.email}</p>
                      </div>
                      <Link
                        href={dashboardPath}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                      <Link
                        href={`${dashboardPath}/profile`}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                      <Link
                        href={`${dashboardPath}/settings`}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                      <div className="border-t border-[var(--border)]">
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            logout();
                          }}
                          className="text-error hover:bg-error-light flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href={ROUTES.AUTH.LOGIN}>
                <Button variant="ghost" size="sm" tooltip="Sign in to your account">
                  Login
                </Button>
              </Link>
              <Link href={ROUTES.AUTH.REGISTER}>
                <Button size="sm" tooltip="Create a new account">
                  Register
                </Button>
              </Link>
              <div className="mx-1 h-6 w-px bg-[var(--border)]" />
              <Link href={`${ROUTES.AUTH.LOGIN}?tab=employer`}>
                <Button variant="highlight" size="sm" tooltip="Sign in as an employer">
                  <Briefcase className="mr-1.5 h-3.5 w-3.5" />
                  Employer Login
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <Tooltip content={mobileMenuOpen ? 'Close menu' : 'Open menu'}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] md:hidden"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav"
          className="animate-slide-down border-t border-[var(--border)] bg-white md:hidden"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <nav className="flex flex-col px-4 py-3">
            {publicNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-primary-light text-primary'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]',
                )}
              >
                {item.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <div className="mt-3 flex flex-col gap-2 border-t border-[var(--border)] pt-3">
                <Link href={ROUTES.AUTH.LOGIN}>
                  <Button variant="outline" fullWidth>
                    Login
                  </Button>
                </Link>
                <Link href={ROUTES.AUTH.REGISTER}>
                  <Button fullWidth>Register</Button>
                </Link>
                <Link href={`${ROUTES.AUTH.LOGIN}?tab=employer`}>
                  <Button variant="ghost" fullWidth>
                    <Briefcase className="mr-1.5 h-4 w-4" />
                    Employer Login
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
