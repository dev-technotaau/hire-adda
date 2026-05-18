'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  Building2,
  GraduationCap,
  Tag,
  Users,
  Info,
  Mail,
  HelpCircle,
  Home,
  BookOpen,
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
import BillingAlertBadge from '@/components/billing/BillingAlertBadge';
import NavMegaMenu, { MobileNavMegaMenu } from '@/components/layout/NavMegaMenu';
import type { Role } from '@/types/auth';

// Home stays as the only top-level public link. About / Contact /
// Help collapsed into the Resources dropdown below to stop the
// header from feeling cluttered next to Jobs / Companies / Pricing.
// Those three routes still exist and remain reachable from
// Resources + the footer + sitemap — nothing was deleted.
//
// Each item carries its own lucide icon so the nav is visually
// uniform with Jobs / Companies (which render their trigger via
// NavMegaMenu's `Icon` prop) and the Pricing + Resources triggers
// below — every top-level item shows an icon next to its label.
const publicNavItems: { label: string; href: string; icon: typeof Home }[] = [
  { label: 'Home', href: ROUTES.PUBLIC.HOME, icon: Home },
];

interface ResourcesMenuChild {
  label: string;
  sublabel: string;
  href: string;
  icon: typeof Info;
}

const resourcesMenuItems: ResourcesMenuChild[] = [
  {
    label: 'About',
    sublabel: 'Our story, mission and the team behind Hire Adda',
    href: ROUTES.PUBLIC.ABOUT,
    icon: Info,
  },
  {
    label: 'Contact',
    sublabel: 'Reach out to sales, support or the partnerships team',
    href: ROUTES.PUBLIC.CONTACT,
    icon: Mail,
  },
  {
    label: 'Help Centre',
    sublabel: 'FAQs, guides and troubleshooting for every workflow',
    href: ROUTES.PUBLIC.HELP,
    icon: HelpCircle,
  },
];

interface PricingMenuChild {
  label: string;
  sublabel: string;
  href: string;
  icon: typeof Building2;
  badge?: string;
}

const pricingMenuItems: PricingMenuChild[] = [
  {
    label: 'For Employers',
    sublabel: 'Job Posts, CV Database & Assisted Hiring',
    href: ROUTES.BILLING.PRICING_EMPLOYER,
    icon: Building2,
    badge: 'Buy Now',
  },
  {
    label: 'For Candidates',
    sublabel: 'Premium Profile, Verified Badge & Top Visibility',
    href: ROUTES.BILLING.PRICING_CANDIDATE,
    icon: GraduationCap,
  },
  {
    label: 'For Vendors',
    sublabel: 'Receive hiring leads & connect with clients (₹199/mo)',
    href: '/pricing#vendor_connect',
    icon: Users,
  },
];

export default function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { data: unreadData } = useUnreadCount();
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [pricingMenuOpen, setPricingMenuOpen] = useState(false);
  const [resourcesMenuOpen, setResourcesMenuOpen] = useState(false);
  // Hover-open with 150 ms grace period — same pattern as NavMegaMenu
  // so cursor can travel from the trigger button to the dropdown panel
  // without the menu flickering closed.
  const pricingCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resourcesCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pricingMenuRef = useRef<HTMLDivElement>(null);
  const resourcesMenuRef = useRef<HTMLDivElement>(null);
  const cancelPricingClose = useCallback(() => {
    if (pricingCloseTimerRef.current) {
      clearTimeout(pricingCloseTimerRef.current);
      pricingCloseTimerRef.current = null;
    }
  }, []);
  const schedulePricingClose = useCallback(() => {
    cancelPricingClose();
    pricingCloseTimerRef.current = setTimeout(() => setPricingMenuOpen(false), 150);
  }, [cancelPricingClose]);
  const cancelResourcesClose = useCallback(() => {
    if (resourcesCloseTimerRef.current) {
      clearTimeout(resourcesCloseTimerRef.current);
      resourcesCloseTimerRef.current = null;
    }
  }, []);
  const scheduleResourcesClose = useCallback(() => {
    cancelResourcesClose();
    resourcesCloseTimerRef.current = setTimeout(() => setResourcesMenuOpen(false), 150);
  }, [cancelResourcesClose]);
  useEffect(
    () => () => {
      if (pricingCloseTimerRef.current) clearTimeout(pricingCloseTimerRef.current);
      if (resourcesCloseTimerRef.current) clearTimeout(resourcesCloseTimerRef.current);
    },
    [],
  );
  // Click-outside-to-close — replaces the old fullscreen <div fixed inset-0>
  // overlay that was a child of the wrapper and broke onMouseLeave (cursor
  // ended up on the overlay while still "inside" the wrapper subtree, so
  // hover-out never fired and the menu wouldn't auto-close).
  useEffect(() => {
    if (!pricingMenuOpen && !resourcesMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        pricingMenuOpen &&
        pricingMenuRef.current &&
        !pricingMenuRef.current.contains(e.target as Node)
      ) {
        setPricingMenuOpen(false);
      }
      if (
        resourcesMenuOpen &&
        resourcesMenuRef.current &&
        !resourcesMenuRef.current.contains(e.target as Node)
      ) {
        setResourcesMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [pricingMenuOpen, resourcesMenuOpen]);

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
      setPricingMenuOpen(false);
      setResourcesMenuOpen(false);
    });
  }, [pathname, setMobileMenuOpen]);

  // Close menus on Escape key
  const handleEscapeKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false);
        setMobileMenuOpen(false);
        setPricingMenuOpen(false);
        setResourcesMenuOpen(false);
      }
    },
    [setMobileMenuOpen],
  );

  useEffect(() => {
    if (userMenuOpen || mobileMenuOpen || pricingMenuOpen || resourcesMenuOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [userMenuOpen, mobileMenuOpen, pricingMenuOpen, resourcesMenuOpen, handleEscapeKey]);

  const dashboardPath = user?.role ? ROLE_DASHBOARDS[user.role as Role] : '/';

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        // The scroll-elevated state previously layered a 1px
        // border-b on top of the soft `shadow-sm`. The two visual
        // separators competed — the border read as a hard line
        // against the blurred backdrop while the shadow already
        // carries the elevation cue. Keeping the shadow + blur
        // gives the same "lifted" feel without the hairline that
        // popped in/out on every scroll direction reversal.
        scrolled ? 'bg-white/80 shadow-sm backdrop-blur-lg' : 'bg-white',
      )}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Logo />

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {publicNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Tooltip key={item.href} content={`Go to ${item.label}`}>
                <Link
                  href={item.href}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-primary-light text-primary'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </Tooltip>
            );
          })}

          {/* Jobs + Companies mega-menus (Phase 10). Sit between
              Home and the Pricing dropdown. */}
          <NavMegaMenu />

          {/* Pricing dropdown — split here between "About" and "Contact" so
              audience pages get a top-level entry without crowding the right-
              side login/register block. */}
          <div
            ref={pricingMenuRef}
            className="relative"
            onMouseEnter={() => {
              cancelPricingClose();
              setPricingMenuOpen(true);
            }}
            onMouseLeave={schedulePricingClose}
          >
            <button
              type="button"
              onClick={() => setPricingMenuOpen((v) => !v)}
              onFocus={() => {
                cancelPricingClose();
                setPricingMenuOpen(true);
              }}
              aria-expanded={pricingMenuOpen}
              aria-haspopup="menu"
              className={cn(
                'flex items-center gap-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                // Highlight when the dropdown is open OR when we're on a
                // pricing page — matches Jobs/Companies NavTrigger behavior.
                pricingMenuOpen || pathname.startsWith('/pricing')
                  ? 'bg-primary-light text-primary'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]',
              )}
            >
              <Tag className="h-4 w-4" />
              Pricing
              <ChevronDown
                className={cn('h-4 w-4 transition-transform', pricingMenuOpen && 'rotate-180')}
              />
            </button>
            {pricingMenuOpen && (
              <>
                <div
                  role="menu"
                  onMouseEnter={cancelPricingClose}
                  className="animate-scale-in absolute left-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-lg"
                >
                  {pricingMenuItems.map((child) => {
                    const Icon = child.icon;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setPricingMenuOpen(false)}
                        role="menuitem"
                        className="flex items-start gap-3 border-b border-[var(--border)] px-4 py-3 transition-colors last:border-b-0 hover:bg-[var(--bg-secondary)]"
                      >
                        <div className="bg-primary/10 text-primary flex h-9 w-9 flex-none items-center justify-center rounded-lg">
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[var(--text)]">
                              {child.label}
                            </span>
                            {child.badge && (
                              <span className="bg-primary inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
                                {child.badge}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                            {child.sublabel}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                  <Link
                    href={ROUTES.BILLING.PRICING}
                    onClick={() => setPricingMenuOpen(false)}
                    role="menuitem"
                    className="hover:text-primary flex items-center gap-2 bg-[var(--bg-secondary)] px-4 py-2.5 text-xs font-medium text-[var(--text-secondary)] transition-colors"
                  >
                    <Tag className="h-3.5 w-3.5" />
                    See all plans
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Resources dropdown — collapses About / Contact / Help into
              one trigger so the header doesn't feel cluttered next to
              Jobs / Companies / Pricing. Mirrors the Pricing dropdown's
              hover-with-grace + click-outside-to-close + ChevronDown
              rotation + role="menu" semantics so the three behave
              identically from a UX standpoint. */}
          <div
            ref={resourcesMenuRef}
            className="relative"
            onMouseEnter={() => {
              cancelResourcesClose();
              setResourcesMenuOpen(true);
            }}
            onMouseLeave={scheduleResourcesClose}
          >
            <button
              type="button"
              onClick={() => setResourcesMenuOpen((v) => !v)}
              onFocus={() => {
                cancelResourcesClose();
                setResourcesMenuOpen(true);
              }}
              aria-expanded={resourcesMenuOpen}
              aria-haspopup="menu"
              className={cn(
                'flex items-center gap-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                // Highlight when the dropdown is open OR when we're on
                // any of the resource pages. Same active-route logic
                // the Pricing trigger uses.
                resourcesMenuOpen ||
                  resourcesMenuItems.some((it) => pathname === it.href) ||
                  pathname.startsWith('/help/')
                  ? 'bg-primary-light text-primary'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]',
              )}
            >
              <BookOpen className="h-4 w-4" />
              Resources
              <ChevronDown
                className={cn('h-4 w-4 transition-transform', resourcesMenuOpen && 'rotate-180')}
              />
            </button>
            {resourcesMenuOpen && (
              <div
                role="menu"
                onMouseEnter={cancelResourcesClose}
                className="animate-scale-in absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-lg"
              >
                {resourcesMenuItems.map((child) => {
                  const Icon = child.icon;
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={() => setResourcesMenuOpen(false)}
                      role="menuitem"
                      className="flex items-start gap-3 border-b border-[var(--border)] px-4 py-3 transition-colors last:border-b-0 hover:bg-[var(--bg-secondary)]"
                    >
                      <div className="bg-primary/10 text-primary flex h-9 w-9 flex-none items-center justify-center rounded-lg">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-[var(--text)]">
                          {child.label}
                        </span>
                        <p className="mt-0.5 text-xs text-[var(--text-muted)]">{child.sublabel}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              {/* Billing alert (only when there's an actionable billing state) */}
              {(user.role === 'CANDIDATE' || user.role === 'EMPLOYER') && <BillingAlertBadge />}

              {/* Notifications */}
              <Tooltip content="View notifications">
                <Link
                  href={ROUTES.NOTIFICATIONS}
                  className="relative rounded-lg p-2.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]"
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
                    className="flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-[var(--bg-secondary)]"
                  >
                    <Avatar
                      src={user.avatar}
                      firstName={user.firstName}
                      lastName={user.lastName}
                      size="md"
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
              <Link href={ROUTES.AUTH.LOGIN_CANDIDATE}>
                <Button variant="ghost" size="md" tooltip="Sign in as a candidate">
                  Login
                </Button>
              </Link>
              <Link href={ROUTES.AUTH.REGISTER_CANDIDATE}>
                <Button size="md" tooltip="Create a candidate account">
                  Register
                </Button>
              </Link>
              <div className="mx-1 h-6 w-px bg-[var(--border)]" />
              <Link href={ROUTES.AUTH.LOGIN_EMPLOYER}>
                <Button variant="highlight" size="md" tooltip="Sign in as an employer">
                  <Briefcase className="mr-1.5 h-4 w-4" />
                  Employer Login
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <Tooltip content={mobileMenuOpen ? 'Close menu' : 'Open menu'}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] md:hidden"
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
            {publicNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-primary-light text-primary'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]',
                  )}
                >
                  <Icon className="h-4 w-4 flex-none" />
                  {item.label}
                </Link>
              );
            })}

            {/* Mobile Jobs + Companies accordion (Phase 10). */}
            <MobileNavMegaMenu onNavigate={() => setMobileMenuOpen(false)} />

            {/* Pricing section — header + indented audience-specific links */}
            <p className="mt-3 mb-1 flex items-center gap-1.5 px-3 text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
              <Tag className="h-3.5 w-3.5" />
              Pricing
            </p>
            {pricingMenuItems.map((child) => {
              const Icon = child.icon;
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    pathname === child.href
                      ? 'bg-primary-light text-primary'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]',
                  )}
                >
                  <Icon className="h-4 w-4 flex-none" />
                  <span className="flex-1">{child.label}</span>
                  {child.badge && (
                    <span className="bg-primary inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
                      {child.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            <Link
              href={ROUTES.BILLING.PRICING}
              className={cn(
                'rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                pathname === ROUTES.BILLING.PRICING
                  ? 'text-primary'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]',
              )}
            >
              See all plans →
            </Link>

            {/* Resources section — same trio (About / Contact / Help)
                that the desktop Resources dropdown renders, flattened
                into a labelled group so all routes remain reachable
                without a second tap on mobile. Matches the Pricing
                section's "header + indented links" shape just above. */}
            <p className="mt-3 mb-1 flex items-center gap-1.5 px-3 text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
              <BookOpen className="h-3.5 w-3.5" />
              Resources
            </p>
            {resourcesMenuItems.map((child) => {
              const Icon = child.icon;
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    pathname === child.href
                      ? 'bg-primary-light text-primary'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]',
                  )}
                >
                  <Icon className="h-4 w-4 flex-none" />
                  <span className="flex-1">{child.label}</span>
                </Link>
              );
            })}

            {!isAuthenticated && (
              <div className="mt-3 flex flex-col gap-2 border-t border-[var(--border)] pt-3">
                <Link href={ROUTES.AUTH.LOGIN_CANDIDATE}>
                  <Button variant="outline" fullWidth>
                    Login
                  </Button>
                </Link>
                <Link href={ROUTES.AUTH.REGISTER_CANDIDATE}>
                  <Button fullWidth>Register</Button>
                </Link>
                <Link href={ROUTES.AUTH.LOGIN_EMPLOYER}>
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
