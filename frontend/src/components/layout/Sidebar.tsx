'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { ROUTES } from '@/constants/routes';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const candidateNav: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.CANDIDATE.DASHBOARD, icon: LayoutDashboard },
  { label: 'Analytics', href: ROUTES.CANDIDATE.ANALYTICS, icon: BarChart3 },
  { label: 'Profile', href: ROUTES.CANDIDATE.PROFILE, icon: User },
  { label: 'Search Jobs', href: ROUTES.CANDIDATE.JOBS, icon: Search },
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
  { label: 'Post Job', href: ROUTES.EMPLOYER.POST_JOB, icon: PlusCircle },
  { label: 'My Jobs', href: ROUTES.EMPLOYER.MY_JOBS, icon: Briefcase },
  { label: 'Applications', href: ROUTES.EMPLOYER.APPLICATIONS, icon: ClipboardList },
  { label: 'Find Candidates', href: ROUTES.EMPLOYER.CANDIDATES, icon: Users },
  { label: 'Saved Candidates', href: ROUTES.EMPLOYER.SAVED_CANDIDATES, icon: Bookmark },
  { label: 'Analytics', href: ROUTES.EMPLOYER.ANALYTICS, icon: BarChart3 },
  { label: 'Verification', href: ROUTES.EMPLOYER.VERIFICATION, icon: ShieldCheck },
  { label: 'Help & Support', href: ROUTES.EMPLOYER.HELP, icon: HelpCircle },
  { label: 'Settings', href: ROUTES.EMPLOYER.SETTINGS, icon: Settings },
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
  { label: 'Jobs', href: ROUTES.ADMIN.JOBS, icon: Briefcase },
  { label: 'Applications', href: ROUTES.ADMIN.APPLICATIONS, icon: FileText },
  { label: 'Verifications', href: ROUTES.ADMIN.VERIFICATIONS, icon: ShieldCheck },
  { label: 'Moderation', href: ROUTES.ADMIN.MODERATION, icon: Shield },
  { label: 'Platform Analytics', href: ROUTES.SUPER_ADMIN.ANALYTICS, icon: BarChart3 },
  { label: 'Audit Logs', href: ROUTES.ADMIN.AUDIT_LOGS, icon: ClipboardList },
  { label: 'Reports', href: ROUTES.ADMIN.REPORTS, icon: FileBarChart },
  { label: 'Email Templates', href: ROUTES.ADMIN.EMAIL_TEMPLATES, icon: Mail },
  { label: 'Ticket Analytics', href: ROUTES.SUPER_ADMIN.TICKETS, icon: BarChart3 },
  { label: 'Feature Flags', href: ROUTES.SUPER_ADMIN.FEATURE_FLAGS, icon: ToggleLeft },
  { label: 'System Config', href: ROUTES.SUPER_ADMIN.CONFIG, icon: Settings },
  { label: 'Security', href: ROUTES.SUPER_ADMIN.SETTINGS, icon: Shield },
];

export function getNavItems(role: string | undefined): NavItem[] {
  switch (role) {
    case 'CANDIDATE':
      return candidateNav;
    case 'EMPLOYER':
      return employerNav;
    case 'ADMIN':
      return [...adminNav];
    case 'SUPER_ADMIN':
      return [...superAdminNav];
    default:
      return [];
  }
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();
  const navItems = getNavItems(user?.role);

  return (
    <aside
      className={cn(
        'sticky top-16 hidden h-[calc(100vh-4rem)] flex-col border-r border-[var(--border)] bg-white transition-all duration-300 lg:flex',
        sidebarCollapsed ? 'w-16' : 'w-64',
      )}
    >
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
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary-light text-primary'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]',
                    sidebarCollapsed && 'justify-center px-2',
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-[var(--border)] p-3">
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
      </div>
    </aside>
  );
}
