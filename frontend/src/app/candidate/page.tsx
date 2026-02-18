'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import {
    Briefcase, Bookmark, Eye, UserCheck,
    ArrowRight, Clock, Building2, TrendingUp, Sparkles, HelpCircle,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import Skeleton from '@/components/ui/Skeleton';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import PieChart from '@/components/charts/PieChart';
import { candidateService } from '@/services/candidate.service';
import { jobService } from '@/services/job.service';
import { useRecommendedJobs } from '@/hooks/use-recommendations';
import { QUERY_KEYS } from '@/constants/config';
import { ROUTES } from '@/constants/routes';
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS } from '@/constants/enums';
import { formatRelativeDate, getGreeting, getDashboardSubtitle } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { wasOnboardingSkipped } from '@/hooks/use-onboarding';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

const statusColorMap: Record<string, BadgeVariant> = {
    info: 'info',
    success: 'success',
    warning: 'warning',
    error: 'error',
    neutral: 'neutral',
};

export default function CandidateDashboard() {
    const { user } = useAuth();
    const router = useRouter();

    const { data: dashboard, isLoading: dashLoading } = useQuery({
        queryKey: QUERY_KEYS.CANDIDATES.DASHBOARD,
        queryFn: () => candidateService.getDashboard(),
    });

    const { data: completeness, isLoading: compLoading } = useQuery({
        queryKey: QUERY_KEYS.CANDIDATES.COMPLETENESS,
        queryFn: () => candidateService.getCompleteness(),
    });

    // Redirect first-time users to onboarding (profile completeness 0% and not skipped)
    const needsOnboarding = !compLoading && completeness?.data?.score === 0 && !wasOnboardingSkipped('tb_candidate_onboarding');

    useEffect(() => {
        if (needsOnboarding) {
            router.replace(ROUTES.CANDIDATE.ONBOARDING);
        }
    }, [needsOnboarding, router]);

    const { data: recommendedData, isLoading: recsLoading } = useQuery({
        queryKey: [...QUERY_KEYS.JOBS.SEARCH({}), 'recommended'],
        queryFn: () => jobService.searchJobs({ limit: '4', sortBy: 'relevance' }),
    });
    const recommendedJobs = recommendedData?.data?.items || [];

    const stats = dashboard?.data;
    const profile = completeness?.data;

    const statCards = [
        {
            label: 'Applications',
            value: stats?.applicationsCount ?? 0,
            icon: Briefcase,
            color: 'text-primary bg-primary-light',
            href: ROUTES.CANDIDATE.APPLICATIONS,
        },
        {
            label: 'Saved Jobs',
            value: stats?.savedJobsCount ?? 0,
            icon: Bookmark,
            color: 'text-[var(--warning)] bg-[var(--warning-light)]',
            href: ROUTES.CANDIDATE.SAVED_JOBS,
        },
        {
            label: 'Profile Views',
            value: stats?.profileViews ?? 0,
            icon: Eye,
            color: 'text-[var(--success)] bg-[var(--success-light)]',
            href: ROUTES.CANDIDATE.PROFILE,
        },
        {
            label: 'Profile Score',
            value: `${stats?.profileCompleteness ?? 0}%`,
            icon: UserCheck,
            color: 'text-[var(--info)] bg-[var(--info-light)]',
            href: ROUTES.CANDIDATE.PROFILE,
        },
    ];

    const statusColors: Record<string, string> = {
        APPLIED: '#2563EB',
        VIEWED: '#6366F1',
        SHORTLISTED: '#10B981',
        INTERVIEW_SCHEDULED: '#F59E0B',
        REJECTED: '#EF4444',
        HIRED: '#059669',
        WITHDRAWN: '#6B7280',
    };

    const { data: aiRecsData } = useRecommendedJobs();
    const aiRecommendedJobs = aiRecsData?.data || [];

    const applicationStatusData = useMemo(() => {
        if (!stats?.recentApplications?.length) return [];
        const counts: Record<string, number> = {};
        stats.recentApplications.forEach((app) => {
            counts[app.status] = (counts[app.status] || 0) + 1;
        });
        return Object.entries(counts).map(([status, value]) => ({
            name: APPLICATION_STATUS_LABELS[status] || status,
            value,
            color: statusColors[status] || '#6B7280',
        }));
    }, [stats?.recentApplications]);

    // Block rendering until onboarding check completes to prevent dashboard flash
    if (compLoading || needsOnboarding) {
        return (
            <DashboardLayout requiredRole={['CANDIDATE']}>
                <div className="flex h-[60vh] items-center justify-center">
                    <Spinner size="lg" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout requiredRole={['CANDIDATE']}>
            <div className="space-y-6">
                {/* Welcome */}
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text)]">
                        {getGreeting(user?.firstName)}
                    </h1>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                        {getDashboardSubtitle(user?.role)}
                    </p>
                </div>

                {/* Profile Completeness */}
                {!compLoading && profile && profile.score < 100 && (
                    <Card className="border-primary/20 bg-primary-50/30">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-primary" />
                                    <h3 className="font-semibold text-[var(--text)]">
                                        Complete Your Profile
                                    </h3>
                                </div>
                                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                    A complete profile increases your chances of getting hired by 3x.
                                </p>
                                <ProgressBar
                                    value={profile.score}
                                    color={profile.score >= 80 ? 'success' : profile.score >= 50 ? 'warning' : 'error'}
                                    className="mt-3"
                                />
                                <p className="mt-1 text-xs text-[var(--text-muted)]">
                                    {profile.score}% complete
                                </p>
                            </div>
                            <Link href={ROUTES.CANDIDATE.PROFILE}>
                                <Button size="sm">
                                    Update Profile
                                </Button>
                            </Link>
                        </div>
                    </Card>
                )}

                {/* Stats Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {dashLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <Card key={i}>
                                <Skeleton variant="card" />
                            </Card>
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

                {/* Application Status Distribution */}
                {!dashLoading && applicationStatusData.length > 0 && (
                    <Card
                        header={
                            <h2 className="text-lg font-semibold text-[var(--text)]">Application Status Distribution</h2>
                        }
                    >
                        <PieChart
                            data={applicationStatusData}
                            height={250}
                            innerRadius={45}
                        />
                    </Card>
                )}

                {/* AI Recommended Jobs */}
                {aiRecommendedJobs.length > 0 && (
                    <Card
                        header={
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                    <h2 className="text-lg font-semibold text-[var(--text)]">AI Recommended Jobs</h2>
                                </div>
                                <Link href={ROUTES.CANDIDATE.JOBS} className="text-sm text-primary hover:underline">
                                    View All <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
                                </Link>
                            </div>
                        }
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            {aiRecommendedJobs.slice(0, 4).map((job: Record<string, unknown>) => (
                                <Link key={job.id as string} href={ROUTES.CANDIDATE.JOB_DETAIL(job.id as string)}>
                                    <div className="rounded-lg border border-primary/20 bg-primary-50/20 p-4 hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light">
                                                <Sparkles className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-[var(--text)] truncate">{job.title as string}</p>
                                                <p className="text-sm text-[var(--text-muted)]">{(job.company as Record<string, string>)?.companyName}</p>
                                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                                                    {job.location ? <span>{String(job.location)}</span> : null}
                                                    {job.matchScore ? (
                                                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                                            {Math.round(job.matchScore as number)}% match
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Recommended Jobs */}
                {!recsLoading && recommendedJobs.length > 0 && (
                    <Card
                        header={
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-[var(--text)]">Recommended For You</h2>
                                <Link href={ROUTES.CANDIDATE.JOBS} className="text-sm text-primary hover:underline">
                                    View All <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
                                </Link>
                            </div>
                        }
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            {recommendedJobs.map((job) => (
                                <Link key={job.id} href={ROUTES.CANDIDATE.JOB_DETAIL(job.id)}>
                                    <div className="rounded-lg border border-[var(--border)] p-4 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-tertiary)]">
                                                {job.company?.logo ? (
                                                    <img src={job.company.logo} alt={job.company?.companyName || 'Company logo'} className="h-8 w-8 rounded-md object-contain" />
                                                ) : (
                                                    <Building2 className="h-5 w-5 text-[var(--text-muted)]" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-[var(--text)] truncate">{job.title}</p>
                                                <p className="text-sm text-[var(--text-muted)]">{job.company?.companyName}</p>
                                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                                                    {job.location && <span>{job.location}</span>}
                                                    {job.workMode && <span>· {job.workMode}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Recent Applications */}
                <Card
                    header={
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-[var(--text)]">Recent Applications</h2>
                            <Link href={ROUTES.CANDIDATE.APPLICATIONS} className="text-sm text-primary hover:underline">
                                View All <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
                            </Link>
                        </div>
                    }
                >
                    {dashLoading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} variant="card" />
                            ))}
                        </div>
                    ) : stats?.recentApplications && stats.recentApplications.length > 0 ? (
                        <div className="divide-y divide-[var(--border)]">
                            {stats.recentApplications.map((app) => {
                                const badgeColor = statusColorMap[APPLICATION_STATUS_COLORS[app.status] || 'neutral'] || 'neutral';
                                return (
                                    <div key={app.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-tertiary)]">
                                                <Building2 className="h-5 w-5 text-[var(--text-muted)]" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-[var(--text)] truncate">{app.jobTitle}</p>
                                                <p className="text-sm text-[var(--text-muted)]">{app.companyName}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <Badge variant={badgeColor} size="sm">
                                                {APPLICATION_STATUS_LABELS[app.status] || app.status}
                                            </Badge>
                                            <span className="hidden text-xs text-[var(--text-muted)] sm:block">
                                                <Clock className="mr-1 inline h-3 w-3" />
                                                {formatRelativeDate(app.appliedAt)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyState
                            icon={Briefcase}
                            title="No applications yet"
                            description="Start applying to jobs to see your activity here."
                            action={
                                <Link href={ROUTES.CANDIDATE.JOBS}>
                                    <Button size="sm">Browse Jobs</Button>
                                </Link>
                            }
                        />
                    )}
                </Card>

                {/* Quick Actions */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <Link href={ROUTES.CANDIDATE.JOBS}>
                        <Card className="group hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light">
                                    <Briefcase className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium text-[var(--text)] group-hover:text-primary transition-colors">Search Jobs</p>
                                    <p className="text-xs text-[var(--text-muted)]">Find your next opportunity</p>
                                </div>
                            </div>
                        </Card>
                    </Link>
                    <Link href={ROUTES.CANDIDATE.PROFILE}>
                        <Card className="group hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--success-light)]">
                                    <UserCheck className="h-5 w-5 text-[var(--success)]" />
                                </div>
                                <div>
                                    <p className="font-medium text-[var(--text)] group-hover:text-primary transition-colors">Edit Profile</p>
                                    <p className="text-xs text-[var(--text-muted)]">Keep your info updated</p>
                                </div>
                            </div>
                        </Card>
                    </Link>
                    <Link href={ROUTES.CANDIDATE.HELP}>
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
