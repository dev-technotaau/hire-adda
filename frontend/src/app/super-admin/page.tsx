'use client';

import { useQuery } from '@tanstack/react-query';
import {
    Shield, Users, UserPlus, Settings,
    Activity, Server, MessageSquare, ToggleLeft,
} from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import { adminService } from '@/services/admin.service';
import { QUERY_KEYS } from '@/constants/config';
import { ROUTES } from '@/constants/routes';
import { getGreeting, getDashboardSubtitle } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

export default function SuperAdminDashboard() {
    const { user } = useAuth();
    const { data, isLoading } = useQuery({
        queryKey: QUERY_KEYS.ADMIN.STATS,
        queryFn: () => adminService.getStats(),
    });

    const stats = data?.data;

    const cards = [
        { label: 'Total Users', value: stats?.totalUsers, icon: Users, color: 'text-primary' },
        { label: 'Total Candidates', value: stats?.totalCandidates, icon: Users, color: 'text-[var(--success)]' },
        { label: 'Total Employers', value: stats?.totalEmployers, icon: Users, color: 'text-[var(--info)]' },
        { label: 'Active Jobs', value: stats?.activeJobs, icon: Activity, color: 'text-[var(--warning)]' },
    ];

    if (isLoading) {
        return (
            <DashboardLayout requiredRole={['SUPER_ADMIN']}>
                <div className="space-y-6">
                    <Skeleton variant="rect" height={60} />
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} variant="rect" height={100} />
                        ))}
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout requiredRole={['SUPER_ADMIN']}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text)]">{getGreeting(user?.firstName)}</h1>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">{getDashboardSubtitle(user?.role)}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {cards.map(card => (
                        <Card key={card.label} padding="sm">
                            <div className="flex items-center gap-3">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-tertiary)] ${card.color}`}>
                                    <card.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-[var(--text-muted)]">{card.label}</p>
                                    <p className="text-xl font-bold text-[var(--text)]">{card.value?.toLocaleString() || 0}</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card header={<h2 className="text-lg font-semibold text-[var(--text)]">Quick Actions</h2>}>
                        <div className="space-y-3">
                            <Link href={ROUTES.SUPER_ADMIN.ADMINS} className="flex items-center gap-3 rounded-lg border border-[var(--border)] p-3 transition-colors hover:bg-[var(--bg-secondary)]">
                                <Shield className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="font-medium text-[var(--text)]">Manage Admins</p>
                                    <p className="text-sm text-[var(--text-muted)]">Create or remove admin accounts</p>
                                </div>
                            </Link>
                            <Link href={ROUTES.SUPER_ADMIN.CONFIG} className="flex items-center gap-3 rounded-lg border border-[var(--border)] p-3 transition-colors hover:bg-[var(--bg-secondary)]">
                                <Settings className="h-5 w-5 text-[var(--warning)]" />
                                <div>
                                    <p className="font-medium text-[var(--text)]">System Configuration</p>
                                    <p className="text-sm text-[var(--text-muted)]">Manage system-wide settings</p>
                                </div>
                            </Link>
                            <Link href={ROUTES.SUPER_ADMIN.USERS} className="flex items-center gap-3 rounded-lg border border-[var(--border)] p-3 transition-colors hover:bg-[var(--bg-secondary)]">
                                <Users className="h-5 w-5 text-[var(--success)]" />
                                <div>
                                    <p className="font-medium text-[var(--text)]">User Management</p>
                                    <p className="text-sm text-[var(--text-muted)]">Full user control — create, edit, suspend, deactivate</p>
                                </div>
                            </Link>
                            <Link href={ROUTES.SUPER_ADMIN.TICKETS} className="flex items-center gap-3 rounded-lg border border-[var(--border)] p-3 transition-colors hover:bg-[var(--bg-secondary)]">
                                <MessageSquare className="h-5 w-5 text-[var(--warning)]" />
                                <div>
                                    <p className="font-medium text-[var(--text)]">Ticket Analytics</p>
                                    <p className="text-sm text-[var(--text-muted)]">Support ticket stats and insights</p>
                                </div>
                            </Link>
                            <Link href={ROUTES.ADMIN.AUDIT_LOGS} className="flex items-center gap-3 rounded-lg border border-[var(--border)] p-3 transition-colors hover:bg-[var(--bg-secondary)]">
                                <Activity className="h-5 w-5 text-[var(--info)]" />
                                <div>
                                    <p className="font-medium text-[var(--text)]">Audit Logs</p>
                                    <p className="text-sm text-[var(--text-muted)]">View all system activity</p>
                                </div>
                            </Link>
                            <Link href={ROUTES.SUPER_ADMIN.FEATURE_FLAGS} className="flex items-center gap-3 rounded-lg border border-[var(--border)] p-3 transition-colors hover:bg-[var(--bg-secondary)]">
                                <ToggleLeft className="h-5 w-5 text-[var(--text-muted)]" />
                                <div>
                                    <p className="font-medium text-[var(--text)]">Feature Flags</p>
                                    <p className="text-sm text-[var(--text-muted)]">View Firebase Remote Config flags</p>
                                </div>
                            </Link>
                        </div>
                    </Card>

                    <Card header={<h2 className="text-lg font-semibold text-[var(--text)]">System Overview</h2>}>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg bg-[var(--bg-secondary)] p-3">
                                <div className="flex items-center gap-2">
                                    <Server className="h-4 w-4 text-[var(--text-muted)]" />
                                    <span className="text-sm text-[var(--text)]">Total Jobs</span>
                                </div>
                                <span className="font-semibold text-[var(--text)]">{stats?.totalJobs?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-[var(--bg-secondary)] p-3">
                                <div className="flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-[var(--text-muted)]" />
                                    <span className="text-sm text-[var(--text)]">Total Applications</span>
                                </div>
                                <span className="font-semibold text-[var(--text)]">{stats?.totalApplications?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-[var(--bg-secondary)] p-3">
                                <div className="flex items-center gap-2">
                                    <UserPlus className="h-4 w-4 text-[var(--text-muted)]" />
                                    <span className="text-sm text-[var(--text)]">New Users Today</span>
                                </div>
                                <span className="font-semibold text-[var(--text)]">{stats?.newUsersToday || 0}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-[var(--bg-secondary)] p-3">
                                <div className="flex items-center gap-2">
                                    <UserPlus className="h-4 w-4 text-[var(--text-muted)]" />
                                    <span className="text-sm text-[var(--text)]">New This Month</span>
                                </div>
                                <span className="font-semibold text-[var(--text)]">{stats?.newUsersThisMonth || 0}</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
