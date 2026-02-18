'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
    Users, Briefcase, BarChart3, Shield,
    FileText, TrendingUp, Activity, Radio, Mail, MessageSquare,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import PieChart from '@/components/charts/PieChart';
import BarChart from '@/components/charts/BarChart';
import { adminService } from '@/services/admin.service';
import { QUERY_KEYS } from '@/constants/config';
import { ROUTES } from '@/constants/routes';
import { getGreeting, getDashboardSubtitle } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import api from '@/lib/api';
import { API } from '@/constants/api';

interface KafkaEvent {
    eventType: string;
    topic: string;
    key: string | null;
    timestamp: string;
}

function getEventColor(eventType: string): string {
    if (eventType.includes('JOB')) return 'bg-[var(--warning-light)] text-[var(--warning)]';
    if (eventType.includes('APPLICATION')) return 'bg-[var(--info-light)] text-[var(--info)]';
    if (eventType.includes('USER')) return 'bg-primary-light text-primary';
    if (eventType.includes('PROFILE')) return 'bg-[var(--success-light)] text-[var(--success)]';
    return 'bg-[var(--bg-secondary)] text-[var(--text-muted)]';
}

function formatTimestamp(ts: string): string {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return date.toLocaleDateString();
}

export default function AdminDashboard() {
    const { user } = useAuth();
    const { data, isLoading } = useQuery({
        queryKey: QUERY_KEYS.ADMIN.STATS,
        queryFn: () => adminService.getStats(),
    });

    const { data: liveCountersData } = useQuery({
        queryKey: ['admin', 'live-counters'],
        queryFn: async () => {
            const res = await api.get(API.ADMIN.LIVE_COUNTERS);
            return res.data as { status: string; data: Record<string, number> };
        },
        refetchInterval: 30000, // Refresh every 30s
    });

    const { data: kafkaEventsData } = useQuery({
        queryKey: ['admin', 'kafka-events'],
        queryFn: async () => {
            const res = await api.get(API.ADMIN.KAFKA_EVENTS, { params: { limit: 10 } });
            return res.data as { status: string; data: KafkaEvent[] };
        },
        refetchInterval: 15000, // Refresh every 15s
    });

    const stats = data?.data;
    const liveCounters = liveCountersData?.data;
    const kafkaEvents = kafkaEventsData?.data ?? [];

    const statCards = [
        {
            label: 'Total Users',
            value: stats?.totalUsers ?? 0,
            icon: Users,
            color: 'text-primary bg-primary-light',
        },
        {
            label: 'Total Candidates',
            value: stats?.totalCandidates ?? 0,
            icon: Users,
            color: 'text-[var(--info)] bg-[var(--info-light)]',
        },
        {
            label: 'Total Employers',
            value: stats?.totalEmployers ?? 0,
            icon: Briefcase,
            color: 'text-[var(--warning)] bg-[var(--warning-light)]',
        },
        {
            label: 'Active Jobs',
            value: stats?.activeJobs ?? 0,
            icon: Briefcase,
            color: 'text-[var(--success)] bg-[var(--success-light)]',
        },
        {
            label: 'Total Applications',
            value: stats?.totalApplications ?? 0,
            icon: FileText,
            color: 'text-[var(--info)] bg-[var(--info-light)]',
        },
        {
            label: 'New Users Today',
            value: stats?.newUsersToday ?? 0,
            icon: TrendingUp,
            color: 'text-primary bg-primary-light',
        },
    ];

    const quickLinks = [
        {
            label: 'Manage Users',
            description: 'View and manage all platform users',
            icon: Users,
            href: ROUTES.ADMIN.USERS,
            color: 'text-primary bg-primary-light',
        },
        {
            label: 'Moderate Jobs',
            description: 'Review and moderate job listings',
            icon: Briefcase,
            href: ROUTES.ADMIN.JOBS,
            color: 'text-[var(--warning)] bg-[var(--warning-light)]',
        },
        {
            label: 'View Analytics',
            description: 'Platform analytics and insights',
            icon: BarChart3,
            href: ROUTES.ADMIN.ANALYTICS,
            color: 'text-[var(--success)] bg-[var(--success-light)]',
        },
        {
            label: 'Audit Logs',
            description: 'Track all admin actions and events',
            icon: Shield,
            href: ROUTES.ADMIN.AUDIT_LOGS,
            color: 'text-[var(--info)] bg-[var(--info-light)]',
        },
    ];

    return (
        <DashboardLayout requiredRole={['ADMIN', 'SUPER_ADMIN']}>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text)]">{getGreeting(user?.firstName)}</h1>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                        {getDashboardSubtitle(user?.role)}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i}>
                                <Skeleton variant="rect" height={80} />
                            </Card>
                        ))
                    ) : (
                        statCards.map((stat) => (
                            <Card key={stat.label}>
                                <div className="flex items-center gap-4">
                                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.color}`}>
                                        <stat.icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-[var(--text)]">{stat.value}</p>
                                        <p className="text-sm text-[var(--text-muted)]">{stat.label}</p>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>

                {/* Live Counters (Firestore) */}
                {liveCounters && Object.keys(liveCounters).length > 0 && (
                    <Card
                        header={
                            <div className="flex items-center gap-2">
                                <Radio className="h-5 w-5 text-[var(--success)]" />
                                <h2 className="text-lg font-semibold text-[var(--text)]">Live Counters</h2>
                                <span className="ml-auto text-xs text-[var(--text-muted)]">Auto-refreshes every 30s</span>
                            </div>
                        }
                    >
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                                { key: 'activeUsers', label: 'Active Users', icon: Users },
                                { key: 'newUsersToday', label: 'New Users Today', icon: TrendingUp },
                                { key: 'jobsPostedToday', label: 'Jobs Posted Today', icon: Briefcase },
                                { key: 'applicationsToday', label: 'Applications Today', icon: FileText },
                            ].map(({ key, label, icon: Icon }) => (
                                <div key={key} className="flex items-center gap-3 rounded-lg bg-[var(--bg-secondary)] p-3">
                                    <Icon className="h-5 w-5 text-[var(--text-muted)]" />
                                    <div>
                                        <p className="text-xl font-bold text-[var(--text)]">
                                            {liveCounters[key] ?? 0}
                                        </p>
                                        <p className="text-xs text-[var(--text-muted)]">{label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Charts Section */}
                {!isLoading && stats && (
                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card
                            header={<h2 className="text-lg font-semibold text-[var(--text)]">User Distribution</h2>}
                        >
                            <PieChart
                                data={[
                                    { name: 'Candidates', value: stats.totalCandidates, color: '#2563EB' },
                                    { name: 'Employers', value: stats.totalEmployers, color: '#F59E0B' },
                                ]}
                                height={280}
                                innerRadius={50}
                            />
                        </Card>
                        <Card
                            header={<h2 className="text-lg font-semibold text-[var(--text)]">Platform Overview</h2>}
                        >
                            <BarChart
                                data={[
                                    { metric: 'Users', count: stats.totalUsers },
                                    { metric: 'Active Jobs', count: stats.activeJobs },
                                    { metric: 'Applications', count: stats.totalApplications },
                                    { metric: 'New Today', count: stats.newUsersToday },
                                ]}
                                xKey="metric"
                                bars={[
                                    { key: 'count', color: '#2563EB', name: 'Count' },
                                ]}
                                height={280}
                            />
                        </Card>
                    </div>
                )}

                {/* Recent Kafka Events */}
                {kafkaEvents.length > 0 && (
                    <Card
                        header={
                            <div className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-primary" />
                                <h2 className="text-lg font-semibold text-[var(--text)]">Recent Events</h2>
                                <span className="ml-auto text-xs text-[var(--text-muted)]">Last 10 Kafka events</span>
                            </div>
                        }
                    >
                        <div className="space-y-2">
                            {kafkaEvents.map((event, i) => (
                                <div
                                    key={`${event.timestamp}-${i}`}
                                    className="flex items-center justify-between rounded-lg bg-[var(--bg-secondary)] px-3 py-2"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${getEventColor(event.eventType)}`}>
                                            {event.eventType}
                                        </span>
                                        <span className="text-xs text-[var(--text-muted)]">
                                            {event.topic}
                                        </span>
                                    </div>
                                    <span className="text-xs text-[var(--text-muted)]">
                                        {formatTimestamp(event.timestamp)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Quick Links */}
                <div>
                    <h2 className="mb-4 text-lg font-semibold text-[var(--text)]">Quick Actions</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {quickLinks.map((link) => (
                            <Link key={link.label} href={link.href}>
                                <Card className="group hover:border-primary/30 hover:shadow-md transition-all cursor-pointer h-full">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${link.color}`}>
                                            <link.icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-[var(--text)] group-hover:text-primary transition-colors">
                                                {link.label}
                                            </p>
                                            <p className="text-xs text-[var(--text-muted)]">{link.description}</p>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                        <Link href={ROUTES.ADMIN.TICKETS}>
                            <Card className="group hover:border-primary/30 hover:shadow-md transition-all cursor-pointer h-full">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-primary bg-primary-light">
                                        <MessageSquare className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-[var(--text)] group-hover:text-primary transition-colors">
                                            Support Tickets
                                        </p>
                                        <p className="text-xs text-[var(--text-muted)]">Manage user support requests</p>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                        <Link href="/admin/email-templates">
                            <Card className="group hover:border-primary/30 hover:shadow-md transition-all cursor-pointer h-full">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[var(--warning)] bg-[var(--warning-light)]">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-[var(--text)] group-hover:text-primary transition-colors">
                                            Email Templates
                                        </p>
                                        <p className="text-xs text-[var(--text-muted)]">Preview and test email templates</p>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
