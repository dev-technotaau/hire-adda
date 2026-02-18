'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Briefcase, Users, Eye, UserCheck,
    ArrowRight, Clock, Building2, TrendingUp, Plus, HelpCircle,
    Timer, Target, Zap,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import BarChart from '@/components/charts/BarChart';
import { employerService } from '@/services/employer.service';
import { QUERY_KEYS } from '@/constants/config';
import { ROUTES } from '@/constants/routes';
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS } from '@/constants/enums';
import { formatRelativeDate, getGreeting, getDashboardSubtitle } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { wasOnboardingSkipped } from '@/hooks/use-onboarding';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';
const statusColorMap: Record<string, BadgeVariant> = {
    info: 'info', success: 'success', warning: 'warning', error: 'error', neutral: 'neutral',
};

export default function EmployerDashboard() {
    const { user } = useAuth();
    const router = useRouter();

    const { data: dashboard, isLoading } = useQuery({
        queryKey: QUERY_KEYS.EMPLOYERS.DASHBOARD,
        queryFn: () => employerService.getDashboard(),
    });

    // Redirect first-time employers to onboarding
    const { data: companyData, isLoading: companyLoading } = useQuery({
        queryKey: QUERY_KEYS.EMPLOYERS.COMPANY,
        queryFn: () => employerService.getCompany(),
    });

    const needsOnboarding = !companyLoading && companyData?.data
        && !companyData.data.description && !companyData.data.industry
        && !wasOnboardingSkipped('tb_employer_onboarding');

    useEffect(() => {
        if (needsOnboarding) {
            router.replace(ROUTES.EMPLOYER.ONBOARDING);
        }
    }, [needsOnboarding, router]);

    const { data: metricsData, isLoading: metricsLoading } = useQuery({
        queryKey: ['employers', 'engagement-metrics'],
        queryFn: () => employerService.getEngagementMetrics(),
    });
    const metrics = metricsData?.data;

    const stats = dashboard?.data;

    const statCards = [
        { label: 'Active Jobs', value: stats?.activeJobsCount ?? 0, icon: Briefcase, color: 'text-primary bg-primary-light', href: ROUTES.EMPLOYER.MY_JOBS },
        { label: 'Total Applications', value: stats?.totalApplications ?? 0, icon: Users, color: 'text-[var(--success)] bg-[var(--success-light)]', href: ROUTES.EMPLOYER.MY_JOBS },
        { label: 'Shortlisted', value: stats?.shortlistedCount ?? 0, icon: UserCheck, color: 'text-[var(--warning)] bg-[var(--warning-light)]', href: ROUTES.EMPLOYER.MY_JOBS },
        { label: 'Profile Views', value: stats?.profileViews ?? 0, icon: Eye, color: 'text-[var(--info)] bg-[var(--info-light)]', href: ROUTES.EMPLOYER.PROFILE },
    ];

    // Block rendering until onboarding check completes to prevent dashboard flash
    if (companyLoading || needsOnboarding) {
        return (
            <DashboardLayout requiredRole={['EMPLOYER']}>
                <div className="flex h-[60vh] items-center justify-center">
                    <Spinner size="lg" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout requiredRole={['EMPLOYER']}>
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text)]">
                            {getGreeting(user?.firstName)}
                        </h1>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                            {getDashboardSubtitle(user?.role)}
                        </p>
                    </div>
                    <Link href={ROUTES.EMPLOYER.POST_JOB}>
                        <Button>
                            <Plus className="mr-1.5 h-4 w-4" /> Post a Job
                        </Button>
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <Card key={i}><Skeleton variant="card" /></Card>
                        ))
                    ) : (
                        statCards.map((stat) => (
                            <Link key={stat.label} href={stat.href}>
                                <Card className="hover:shadow-md transition-shadow cursor-pointer">
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
                            </Link>
                        ))
                    )}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Recent Applications */}
                    <Card
                        header={
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-[var(--text)]">Recent Applications</h2>
                                <Link href={ROUTES.EMPLOYER.MY_JOBS} className="text-sm text-primary hover:underline">
                                    View All <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
                                </Link>
                            </div>
                        }
                    >
                        {isLoading ? (
                            <div className="space-y-4">
                                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="card" />)}
                            </div>
                        ) : stats?.recentApplications && stats.recentApplications.length > 0 ? (
                            <div className="divide-y divide-[var(--border)]">
                                {stats.recentApplications.map((app) => {
                                    const badgeColor = statusColorMap[APPLICATION_STATUS_COLORS[app.status] || 'neutral'] || 'neutral';
                                    return (
                                        <div key={app.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                                            <div className="min-w-0">
                                                <p className="font-medium text-[var(--text)] truncate">{app.candidateName}</p>
                                                <p className="text-sm text-[var(--text-muted)]">{app.jobTitle}</p>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <Badge variant={badgeColor} size="sm">
                                                    {APPLICATION_STATUS_LABELS[app.status] || app.status}
                                                </Badge>
                                                <span className="hidden text-xs text-[var(--text-muted)] sm:block">
                                                    {formatRelativeDate(app.appliedAt)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <EmptyState
                                icon={Users}
                                title="No applications yet"
                                description="Post a job to start receiving applications."
                            />
                        )}
                    </Card>

                    {/* Job Performance */}
                    <Card
                        header={<h2 className="text-lg font-semibold text-[var(--text)]">Job Performance</h2>}
                    >
                        {isLoading ? (
                            <div className="space-y-4">
                                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="card" />)}
                            </div>
                        ) : stats?.jobPerformance && stats.jobPerformance.length > 0 ? (
                            <div className="divide-y divide-[var(--border)]">
                                {stats.jobPerformance.map((job) => (
                                    <Link
                                        key={job.jobId}
                                        href={ROUTES.EMPLOYER.JOB_DETAIL(job.jobId)}
                                        className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-[var(--bg-secondary)] -mx-2 px-2 rounded-lg transition-colors"
                                    >
                                        <p className="font-medium text-[var(--text)] truncate">{job.jobTitle}</p>
                                        <div className="flex items-center gap-4 shrink-0 text-sm">
                                            <span className="flex items-center gap-1 text-[var(--text-muted)]">
                                                <Eye className="h-3.5 w-3.5" /> {job.views}
                                            </span>
                                            <span className="flex items-center gap-1 text-primary">
                                                <Users className="h-3.5 w-3.5" /> {job.applications}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={TrendingUp}
                                title="No jobs posted"
                                description="Post your first job to see performance data."
                            />
                        )}
                    </Card>
                </div>

                {/* Job Performance Chart */}
                {!isLoading && stats?.jobPerformance && stats.jobPerformance.length > 0 && (
                    <Card
                        header={
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                <h2 className="text-lg font-semibold text-[var(--text)]">Job Performance Chart</h2>
                            </div>
                        }
                    >
                        <BarChart
                            data={stats.jobPerformance.map(job => ({
                                name: job.jobTitle.length > 20 ? `${job.jobTitle.slice(0, 20)}...` : job.jobTitle,
                                views: job.views,
                                applications: job.applications,
                            }))}
                            xKey="name"
                            bars={[
                                { key: 'views', color: '#6366F1', name: 'Views' },
                                { key: 'applications', color: '#2563EB', name: 'Applications' },
                            ]}
                            height={300}
                        />
                    </Card>
                )}

                {/* Engagement Metrics */}
                <Card
                    header={
                        <div className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-semibold text-[var(--text)]">Hiring Metrics</h2>
                        </div>
                    }
                >
                    {metricsLoading ? (
                        <Skeleton variant="rect" height={200} />
                    ) : metrics ? (
                        <div className="space-y-6">
                            {/* Metric Cards */}
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="rounded-xl bg-[var(--bg-secondary)] p-4 text-center">
                                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light">
                                        <Timer className="h-5 w-5 text-primary" />
                                    </div>
                                    <p className="text-2xl font-bold text-[var(--text)]">
                                        {metrics.avgTimeToHireDays !== null ? `${metrics.avgTimeToHireDays}d` : '—'}
                                    </p>
                                    <p className="text-xs text-[var(--text-muted)]">Avg. Time to Hire</p>
                                </div>
                                <div className="rounded-xl bg-[var(--bg-secondary)] p-4 text-center">
                                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--success-light)]">
                                        <Target className="h-5 w-5 text-[var(--success)]" />
                                    </div>
                                    <p className="text-2xl font-bold text-[var(--text)]">
                                        {metrics.conversions.overallHireRate}%
                                    </p>
                                    <p className="text-xs text-[var(--text-muted)]">Overall Hire Rate</p>
                                </div>
                                <div className="rounded-xl bg-[var(--bg-secondary)] p-4 text-center">
                                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--warning-light)]">
                                        <Zap className="h-5 w-5 text-[var(--warning)]" />
                                    </div>
                                    <p className="text-2xl font-bold text-[var(--text)]">
                                        {metrics.hiringVelocity}/mo
                                    </p>
                                    <p className="text-xs text-[var(--text-muted)]">Hiring Velocity</p>
                                </div>
                            </div>

                            {/* Hiring Funnel */}
                            {metrics.funnel.applied > 0 && (
                                <div>
                                    <h3 className="mb-3 text-sm font-medium text-[var(--text-secondary)]">Hiring Funnel</h3>
                                    <div className="space-y-2">
                                        {[
                                            { label: 'Applied', value: metrics.funnel.applied, color: 'bg-blue-500' },
                                            { label: 'Viewed', value: metrics.funnel.viewed, rate: metrics.conversions.appliedToViewed, color: 'bg-blue-400' },
                                            { label: 'Shortlisted', value: metrics.funnel.shortlisted, rate: metrics.conversions.viewedToShortlisted, color: 'bg-indigo-500' },
                                            { label: 'Interview', value: metrics.funnel.interviewScheduled, rate: metrics.conversions.shortlistedToInterview, color: 'bg-purple-500' },
                                            { label: 'Offered', value: metrics.funnel.offered, rate: metrics.conversions.interviewToOffered, color: 'bg-green-500' },
                                            { label: 'Hired', value: metrics.funnel.hired, rate: metrics.conversions.offeredToHired, color: 'bg-emerald-600' },
                                        ].map((stage) => {
                                            const widthPct = metrics.funnel.applied > 0
                                                ? Math.max((stage.value / metrics.funnel.applied) * 100, 2)
                                                : 0;
                                            return (
                                                <div key={stage.label} className="flex items-center gap-3">
                                                    <span className="w-20 text-xs text-[var(--text-secondary)] shrink-0">{stage.label}</span>
                                                    <div className="flex-1 h-6 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${stage.color} flex items-center justify-end pr-2 transition-all`}
                                                            style={{ width: `${widthPct}%`, minWidth: stage.value > 0 ? '2rem' : '0' }}
                                                        >
                                                            {stage.value > 0 && (
                                                                <span className="text-[10px] font-semibold text-white">{stage.value}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {stage.rate !== undefined && (
                                                        <span className="w-12 text-right text-[10px] text-[var(--text-muted)]">{stage.rate}%</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <EmptyState
                            icon={Target}
                            title="No hiring data yet"
                            description="Engagement metrics will appear once you start receiving applications."
                        />
                    )}
                </Card>

                {/* Quick Actions */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <Link href={ROUTES.EMPLOYER.POST_JOB}>
                        <Card className="group hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light">
                                    <Plus className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium text-[var(--text)] group-hover:text-primary transition-colors">Post a Job</p>
                                    <p className="text-xs text-[var(--text-muted)]">Create a new listing</p>
                                </div>
                            </div>
                        </Card>
                    </Link>
                    <Link href={ROUTES.EMPLOYER.CANDIDATES}>
                        <Card className="group hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--success-light)]">
                                    <Users className="h-5 w-5 text-[var(--success)]" />
                                </div>
                                <div>
                                    <p className="font-medium text-[var(--text)] group-hover:text-primary transition-colors">Find Candidates</p>
                                    <p className="text-xs text-[var(--text-muted)]">Search talent pool</p>
                                </div>
                            </div>
                        </Card>
                    </Link>
                    <Link href={ROUTES.EMPLOYER.HELP}>
                        <Card className="group hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--warning-light)]">
                                    <HelpCircle className="h-5 w-5 text-[var(--warning)]" />
                                </div>
                                <div>
                                    <p className="font-medium text-[var(--text)] group-hover:text-primary transition-colors">Help & Support</p>
                                    <p className="text-xs text-[var(--text-muted)]">FAQs and support tickets</p>
                                </div>
                            </div>
                        </Card>
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    );
}
