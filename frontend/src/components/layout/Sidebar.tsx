'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUnreadCount } from '@/hooks/use-notifications';
import {
  LayoutDashboard,
  User,
  Briefcase,
  FileText,
  Bookmark,
  Settings,
  Building2,
  Users,
  PlusCircle,
  BarChart3,
  Shield,
  ShieldCheck,
  ClipboardList,
  Search,
  ChevronLeft,
  ChevronRight,
  FileBarChart,
  HelpCircle,
  Mail,
  MessageSquare,
  ToggleLeft,
  Sparkles,
  Heart,
  Bell,
  Receipt,
  CreditCard,
  Repeat,
  Coins,
  Tag,
  DollarSign,
  AlertCircle,
  Headphones,
  ListPlus,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { ROUTES } from '@/constants/routes';
import Tooltip from '@/components/ui/Tooltip';
import { useEntitlements } from '@/hooks/use-entitlements';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /**
   * Optional feature key this nav item requires. When set, the item is
   * hidden from users whose active entitlement snapshot does not include
   * the feature. Items without a `requiresFeature` are always shown.
   *
   * Mirrors backend plan-gate keys (e.g. `feature.job_post`, `feature.cv_db_access`).
   */
  requiresFeature?: string;
  /**
   * When set, the sidebar fetches the unread count for this
   * notification category and renders a small badge next to the
   * label. 30s polling, pauses when tab is hidden — same as the
   * top-bar global notifications bell.
   */
  notificationCategory?: string;
}

const candidateNav: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.CANDIDATE.DASHBOARD, icon: LayoutDashboard },
  { label: 'Analytics', href: ROUTES.CANDIDATE.ANALYTICS, icon: BarChart3 },
  { label: 'Profile', href: ROUTES.CANDIDATE.PROFILE, icon: User },
  { label: 'Search Jobs', href: ROUTES.CANDIDATE.JOBS, icon: Search },
  { label: 'Find Companies', href: '/candidate/companies', icon: Building2 },
  {
    label: 'Following',
    href: '/candidate/following',
    icon: Heart,
    notificationCategory: 'followed_company_new_job',
  },
  { label: 'My reviews', href: '/candidate/reviews', icon: Star },
  { label: 'Recommendations', href: ROUTES.CANDIDATE.RECOMMENDATIONS, icon: Sparkles },
  { label: 'Applications', href: ROUTES.CANDIDATE.APPLICATIONS, icon: FileText },
  { label: 'Saved Jobs', href: ROUTES.CANDIDATE.SAVED_JOBS, icon: Bookmark },
  { label: 'Job Alerts', href: ROUTES.CANDIDATE.JOB_ALERTS, icon: Bell },
  { label: 'Verification', href: ROUTES.CANDIDATE.VERIFICATION, icon: ShieldCheck },
  { label: 'Help & Support', href: ROUTES.CANDIDATE.HELP, icon: HelpCircle },
  { label: 'Settings', href: ROUTES.CANDIDATE.SETTINGS, icon: Settings },
];

const employerNav: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.EMPLOYER.DASHBOARD, icon: LayoutDashboard },
  { label: 'Company Profile', href: ROUTES.EMPLOYER.PROFILE, icon: Building2 },
  {
    label: 'Post Job',
    href: ROUTES.EMPLOYER.POST_JOB,
    icon: PlusCircle,
    requiresFeature: 'feature.job_post',
  },
  {
    label: 'My Jobs',
    href: ROUTES.EMPLOYER.MY_JOBS,
    icon: Briefcase,
    requiresFeature: 'feature.job_post',
  },
  {
    label: 'Applications',
    href: ROUTES.EMPLOYER.APPLICATIONS,
    icon: ClipboardList,
    requiresFeature: 'feature.job_post',
  },
  {
    label: 'Find Candidates',
    href: ROUTES.EMPLOYER.CANDIDATES,
    icon: Users,
    requiresFeature: 'feature.cv_db_access',
  },
  {
    label: 'Saved Candidates',
    href: ROUTES.EMPLOYER.SAVED_CANDIDATES,
    icon: Bookmark,
    requiresFeature: 'feature.cv_db_access',
  },
  {
    label: 'Followers',
    href: '/employer/followers',
    icon: Heart,
    notificationCategory: 'company_follower',
  },
  {
    label: 'Reviews',
    href: '/employer/reviews',
    icon: Star,
    notificationCategory: 'company_new_review',
  },
  { label: 'Analytics', href: ROUTES.EMPLOYER.ANALYTICS, icon: BarChart3 },
  {
    label: 'Assisted Hiring',
    href: ROUTES.EMPLOYER.ASSISTED_HIRING,
    icon: Headphones,
    requiresFeature: 'feature.assisted_hiring',
  },
  { label: 'Team', href: ROUTES.EMPLOYER.TEAM, icon: Users },
  { label: 'Verification', href: ROUTES.EMPLOYER.VERIFICATION, icon: ShieldCheck },
  { label: 'Help & Support', href: ROUTES.EMPLOYER.HELP, icon: HelpCircle },
  { label: 'Settings', href: ROUTES.EMPLOYER.SETTINGS, icon: Settings },
];

const vendorNav: NavItem[] = [
  { label: 'Dashboard', href: '/vendor', icon: LayoutDashboard },
  { label: 'Lead inbox', href: '/vendor/leads', icon: Mail },
  { label: 'Business profile', href: '/vendor/profile', icon: Building2 },
];

const adminNav: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.ADMIN.DASHBOARD, icon: LayoutDashboard },
  { label: 'Users', href: ROUTES.ADMIN.USERS, icon: Users },
  { label: 'Jobs', href: ROUTES.ADMIN.JOBS, icon: Briefcase },
  { label: 'Applications', href: ROUTES.ADMIN.APPLICATIONS, icon: FileText },
  { label: 'Verifications', href: ROUTES.ADMIN.VERIFICATIONS, icon: ShieldCheck },
  { label: 'Moderation', href: ROUTES.ADMIN.MODERATION, icon: Shield },
  { label: 'Analytics', href: ROUTES.ADMIN.ANALYTICS, icon: BarChart3 },
  { label: 'Audit Logs', href: ROUTES.ADMIN.AUDIT_LOGS, icon: ClipboardList },
  { label: 'Reports', href: ROUTES.ADMIN.REPORTS, icon: FileBarChart },
  { label: 'Email Templates', href: ROUTES.ADMIN.EMAIL_TEMPLATES, icon: Mail },
  { label: 'Support Tickets', href: ROUTES.ADMIN.TICKETS, icon: MessageSquare },
  { label: 'Settings', href: ROUTES.ADMIN.SETTINGS, icon: Settings },
];

const superAdminNav: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.SUPER_ADMIN.DASHBOARD, icon: LayoutDashboard },
  { label: 'Manage Users', href: ROUTES.SUPER_ADMIN.USERS, icon: Users },
  { label: 'Manage Admins', href: ROUTES.SUPER_ADMIN.ADMINS, icon: Shield },
  { label: 'Jobs', href: ROUTES.SUPER_ADMIN.JOBS, icon: Briefcase },
  { label: 'Applications', href: ROUTES.ADMIN.APPLICATIONS, icon: FileText },
  { label: 'Verifications', href: ROUTES.ADMIN.VERIFICATIONS, icon: ShieldCheck },
  { label: 'Moderation', href: ROUTES.ADMIN.MODERATION, icon: Shield },
  { label: 'Platform Analytics', href: ROUTES.SUPER_ADMIN.ANALYTICS, icon: BarChart3 },
  { label: 'Teams', href: '/super-admin/teams', icon: Users },
  { label: 'Vendors', href: '/super-admin/vendors', icon: Building2 },
  { label: 'Assisted Hiring', href: '/super-admin/assisted-hiring', icon: Headphones },
  { label: 'Audit Logs', href: ROUTES.ADMIN.AUDIT_LOGS, icon: ClipboardList },
  { label: 'Reports', href: ROUTES.ADMIN.REPORTS, icon: FileBarChart },
  { label: 'Email Templates', href: ROUTES.ADMIN.EMAIL_TEMPLATES, icon: Mail },
  { label: 'Support Tickets', href: ROUTES.ADMIN.TICKETS, icon: MessageSquare },
  { label: 'Ticket Analytics', href: ROUTES.SUPER_ADMIN.TICKETS, icon: BarChart3 },
  { label: 'Feature Flags', href: ROUTES.SUPER_ADMIN.FEATURE_FLAGS, icon: ToggleLeft },
  { label: 'Curated Listings', href: '/super-admin/curated-listings', icon: ListPlus },
  { label: 'Follow Graph', href: '/super-admin/follows', icon: Heart },
  {
    label: 'Reviews',
    href: '/super-admin/reviews',
    icon: Star,
    notificationCategory: 'review_auto_flagged',
  },
  { label: 'System Config', href: ROUTES.SUPER_ADMIN.CONFIG, icon: Settings },
  { label: 'Security', href: ROUTES.SUPER_ADMIN.SETTINGS, icon: Shield },
];

// Billing menu — shown for CANDIDATE + EMPLOYER (paying users) below the role nav.
const billingNav: NavItem[] = [
  { label: 'Plans', href: ROUTES.BILLING.PRICING, icon: Tag },
  { label: 'Credits & quotas', href: ROUTES.BILLING.CREDITS, icon: Coins },
  { label: 'Subscriptions', href: ROUTES.BILLING.SUBSCRIPTIONS, icon: Repeat },
  { label: 'Order history', href: ROUTES.BILLING.ORDERS, icon: Receipt },
  { label: 'Invoices', href: ROUTES.BILLING.INVOICES, icon: FileText },
  { label: 'Payment methods', href: ROUTES.BILLING.PAYMENT_METHODS, icon: CreditCard },
];

// Super-admin billing menu — added at bottom of super-admin nav
const superAdminBillingNav: NavItem[] = [
  { label: 'Financial centre', href: '/super-admin/billing', icon: DollarSign },
  { label: 'Transactions', href: '/super-admin/billing/transactions', icon: Receipt },
  { label: 'Refunds', href: '/super-admin/billing/refunds', icon: AlertCircle },
  { label: 'Settlements', href: '/super-admin/billing/settlements', icon: DollarSign },
  { label: 'Disputes', href: '/super-admin/billing/disputes', icon: AlertCircle },
  { label: 'Plan catalog', href: '/super-admin/billing/plans', icon: Tag },
  { label: 'Coupons', href: '/super-admin/billing/coupons', icon: Tag },
  { label: 'Quote requests', href: '/super-admin/billing/quotes', icon: MessageSquare },
  { label: 'Fraud queue', href: '/super-admin/billing/fraud', icon: Shield },
  { label: 'Billing settings', href: '/super-admin/billing/settings', icon: Settings },
];

export function getNavItems(role: string | undefined): NavItem[] {
  switch (role) {
    case 'CANDIDATE':
      return candidateNav;
    case 'EMPLOYER':
      return employerNav;
    case 'VENDOR':
      return vendorNav;
    case 'ADMIN':
      return [...adminNav];
    case 'SUPER_ADMIN':
      return [...superAdminNav];
    default:
      return [];
  }
}

export function getBillingNavItems(role: string | undefined): NavItem[] {
  switch (role) {
    case 'CANDIDATE':
    case 'EMPLOYER':
    case 'VENDOR':
      return billingNav;
    case 'SUPER_ADMIN':
      return superAdminBillingNav;
    default:
      return [];
  }
}

function NavList({
  items,
  pathname,
  collapsed,
  groupLabel,
}: {
  items: NavItem[];
  pathname: string;
  collapsed: boolean;
  groupLabel?: string;
}) {
  if (items.length === 0) return null;
  return (
    <>
      {groupLabel && !collapsed && (
        <p className="mt-4 mb-2 px-3 text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
          {groupLabel}
        </p>
      )}
      {groupLabel && collapsed && <div className="my-3 border-t border-[var(--border)]" />}
      <ul className="space-y-1">
        {items.map((item) => {
          const isDashboard = item.label === 'Dashboard';
          const isActive = isDashboard
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Tooltip
                content={collapsed ? item.label : `Navigate to ${item.label}`}
                position={collapsed ? 'right' : 'top'}
              >
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary-light text-primary'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]',
                    collapsed && 'justify-center px-2',
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span className="flex-1">{item.label}</span>}
                  {/* Unread badge — only renders when the nav item
                      declares a notificationCategory. Polls every
                      30s and pauses when the tab is hidden. */}
                  {item.notificationCategory && !collapsed && (
                    <NavItemUnreadBadge category={item.notificationCategory} />
                  )}
                </Link>
              </Tooltip>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();
  const { hasFeature, isLoading: entitlementsLoading } = useEntitlements();

  // Items without `requiresFeature` always show. Items with one are kept
  // only when the active entitlement snapshot resolves the flag to true.
  // While the snapshot is still loading we keep gated items visible to
  // avoid a flash of disappearing nav — the page itself will guard
  // access via PlanGate / EmployerPlanGuard.
  const filterByFeature = (items: NavItem[]): NavItem[] =>
    items.filter(
      (it) => !it.requiresFeature || entitlementsLoading || hasFeature(it.requiresFeature),
    );

  const navItems = filterByFeature(getNavItems(user?.role));
  const billingItems = filterByFeature(getBillingNavItems(user?.role));

  return (
    <aside
      className={cn(
        'sticky top-18 hidden h-[calc(100vh-4.5rem)] flex-col border-r border-[var(--border)] bg-white transition-all duration-300 lg:flex',
        sidebarCollapsed ? 'w-16' : 'w-64',
      )}
    >
      <nav data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
        <NavList items={navItems} pathname={pathname} collapsed={sidebarCollapsed} />
        {billingItems.length > 0 && (
          <NavList
            items={billingItems}
            pathname={pathname}
            collapsed={sidebarCollapsed}
            groupLabel={user?.role === 'SUPER_ADMIN' ? 'Billing & Finance' : 'Billing'}
          />
        )}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-[var(--border)] p-3">
        <Tooltip
          content={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          position="right"
        >
          <button
            onClick={toggleSidebarCollapsed}
            className="flex w-full items-center justify-center rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </Tooltip>
      </div>
    </aside>
  );
}

/**
 * Inline unread-count badge for sidebar nav items. Polls every 30s
 * via the existing useUnreadCount hook (paused when tab is hidden).
 * Hides itself when count is 0 to avoid visual noise.
 */
function NavItemUnreadBadge({ category }: { category: string }) {
  const { data } = useUnreadCount(category);
  const count = data?.data?.count ?? 0;
  if (count <= 0) return null;
  return (
    <span
      className="ml-2 inline-flex min-w-[20px] items-center justify-center rounded-full bg-[var(--primary)] px-1.5 py-0.5 text-[10px] font-bold text-white"
      aria-label={`${count} unread`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
