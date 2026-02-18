'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    BarChart3, UserPlus, Briefcase, FileText,
    CalendarDays, TrendingUp, Code, DollarSign, Users,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import DatePicker from '@/components/ui/DatePicker';
import Select from '@/components/ui/Select';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import AreaChart from '@/components/charts/AreaChart';
import BarChart from '@/components/charts/BarChart';
import { adminService } from '@/services/admin.service';
import { advancedAnalyticsService } from '@/services/analytics.service';
import { QUERY_KEYS } from '@/constants/config';
import type { AnalyticsFilters } from '@/types/admin';

const groupByOptions = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
];

export default function AnalyticsPage() {
    const [activeTab, setActiveTab] = useState<'overview' | 'advanced'>('overview');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');

    const filters: AnalyticsFilters = {
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        groupBy,
    };

    const { data, isLoading } = useQuery({
        queryKey: QUERY_KEYS.ADMIN.ANALYTICS(filters as unknown as Record<string, unknown>),
        queryFn: () => adminService.getAnalytics(filters),
    });

    const analytics = data?.data || [];

    // Advanced analytics queries (BigQuery-powered)
    const { data: skillsData, isLoading: skillsLoading } = useQuery({
        queryKey: QUERY_KEYS.ADVANCED_ANALYTICS.SKILLS,
        queryFn: () => advancedAnalyticsService.getPopularSkills(20),
        enabled: activeTab === 'advanced',
    });

    const { data: funnelData, isLoading: funnelLoading } = useQuery({
        queryKey: QUERY_KEYS.ADVANCED_ANALYTICS.FUNNEL(startDate, endDate),
        queryFn: () => advancedAnalyticsService.getApplicationFunnel(startDate || undefined, endDate || undefined),
        enabled: activeTab === 'advanced',
    });

    const { data: userGrowthData, isLoading: growthLoading } = useQuery({
        queryKey: QUERY_KEYS.ADVANCED_ANALYTICS.USER_GROWTH(startDate, endDate),
        queryFn: () => advancedAnalyticsService.getUserGrowth(startDate || undefined, endDate || undefined),
        enabled: activeTab === 'advanced',
    });

    const { data: salaryData, isLoading: salaryLoading } = useQuery({
        queryKey: QUERY_KEYS.ADVANCED_ANALYTICS.SALARY,
        queryFn: () => advancedAnalyticsService.getSalaryTrends(),
        enabled: activeTab === 'advanced',
    });

    const { data: jobTrendsData, isLoading: jobTrendsLoading } = useQuery({
        queryKey: QUERY_KEYS.ADVANCED_ANALYTICS.JOB_TRENDS(startDate, endDate),
        queryFn: () => advancedAnalyticsService.getJobTrends(startDate || undefined, endDate || undefined),
        enabled: activeTab === 'advanced',
    });

    const popularSkills = skillsData?.data || [];
    const applicationFunnel = funnelData?.data || [];
    const userGrowth = userGrowthData?.data || [];
    const salaryTrends = salaryData?.data || [];
    const jobTrends = jobTrendsData?.data || [];

    // Daily active users query
    const { data: dauData, isLoading: dauLoading } = useQuery({
        queryKey: QUERY_KEYS.ADMIN.DAILY_ACTIVE_USERS,
        queryFn: () => adminService.getDailyActiveUsers(30),
        enabled: activeTab === 'overview',
    });
    const dailyActiveUsers = dauData?.data || [];

    const totals = analytics.reduce(
        (acc, item) => ({
            registrations: acc.registrations + item.registrations,
            jobPostings: acc.jobPostings + item.jobPostings,
            applications: acc.applications + item.applications,
        }),
        { registrations: 0, jobPostings: 0, applications: 0 }
    );

    const summaryCards = [
        {
            label: 'Total Registrations',
            value: totals.registrations,
            icon: UserPlus,
            color: 'text-primary bg-primary-light',
        },
        {
            label: 'Job Postings',
            value: totals.jobPostings,
            icon: Briefcase,
            color: 'text-[var(--success)] bg-[var(--success-light)]',
        },
        {
            label: 'Applications',
            value: totals.applications,
            icon: FileText,
            color: 'text-[var(--info)] bg-[var(--info-light)]',
        },
    ];

    return (
        <DashboardLayout requiredRole={['ADMIN', 'SUPER_ADMIN']}>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text)]">Analytics</h1>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                        Platform analytics and activity insights.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 rounded-lg bg-[var(--bg-secondary)] p-1">
                    <button
                        type="button"
                        onClick={() => setActiveTab('overview')}
                        className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === 'overview'
                                ? 'bg-white text-[var(--text)] shadow-sm'
                                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                        }`}
                    >
                        Overview
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('advanced')}
                        className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === 'advanced'
                                ? 'bg-white text-[var(--text)] shadow-sm'
                                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                        }`}
                    >
                        Advanced (BigQuery)
                    </button>
                </div>

                {activeTab === 'overview' && (<>
                {/* Filters */}
                <Card>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                        <div className="w-full sm:w-48">
                            <DatePicker
                                label="Start Date"
                                value={startDate}
                                onChange={(val) => setStartDate(val)}
                                leftIcon={<CalendarDays className="h-4 w-4" />}
                            />
                        </div>
                        <div className="w-full sm:w-48">
                            <DatePicker
                                label="End Date"
                                value={endDate}
                                onChange={(val) => setEndDate(val)}
                                leftIcon={<CalendarDays className="h-4 w-4" />}
                            />
                        </div>
                        <div className="w-full sm:w-48">
                            <Select
                                label="Group By"
                                options={groupByOptions}
                                value={groupBy}
                                onChange={(val) => setGroupBy(val as 'day' | 'week' | 'month')}
                            />
                        </div>
                    </div>
                </Card>

                {/* Summary Cards */}
                {isLoading ? (
                    <div className="grid gap-4 sm:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Card key={i}>
                                <Skeleton variant="rect" height={80} />
                            </Card>
                        ))}
                    </div>
                ) : analytics.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-3">
                        {summaryCards.map((card) => (
                            <Card key={card.label}>
                                <div className="flex items-center gap-4">
                                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${card.color}`}>
                                        <card.icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-[var(--text)]">{card.value}</p>
                                        <p className="text-sm text-[var(--text-muted)]">{card.label}</p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : null}

                {/* Trend Charts */}
                {!isLoading && analytics.length > 0 && (
                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card
                            header={
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-primary" />
                                    <h2 className="text-lg font-semibold text-[var(--text)]">Registrations &amp; Applications</h2>
                                </div>
                            }
                        >
                            <AreaChart
                                data={analytics as unknown as Record<string, unknown>[]}
                                xKey="period"
                                yKey="registrations"
                                yKey2="applications"
                                color="#2563EB"
                                color2="#10B981"
                                height={280}
                            />
                        </Card>
                        <Card
                            header={
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-[var(--success)]" />
                                    <h2 className="text-lg font-semibold text-[var(--text)]">Activity Breakdown</h2>
                                </div>
                            }
                        >
                            <BarChart
                                data={analytics as unknown as Record<string, unknown>[]}
                                xKey="period"
                                bars={[
                                    { key: 'registrations', color: '#2563EB', name: 'Registrations' },
                                    { key: 'jobPostings', color: '#10B981', name: 'Job Postings' },
                                    { key: 'applications', color: '#F59E0B', name: 'Applications' },
                                ]}
                                height={280}
                            />
                        </Card>
                    </div>
                )}

                {/* Analytics Table */}
                <Card
                    header={
                        <h2 className="text-lg font-semibold text-[var(--text)]">Analytics Data</h2>
                    }
                    padding="sm"
                >
                    {isLoading ? (
                        <div className="space-y-3 p-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} variant="rect" height={40} />
                            ))}
                        </div>
                    ) : analytics.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[var(--border)]">
                                        <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Period</th>
                                        <th className="px-4 py-3 text-right font-medium text-[var(--text-secondary)]">Registrations</th>
                                        <th className="px-4 py-3 text-right font-medium text-[var(--text-secondary)]">Job Postings</th>
                                        <th className="px-4 py-3 text-right font-medium text-[var(--text-secondary)]">Applications</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {analytics.map((item, index) => (
                                        <tr key={index} className="hover:bg-[var(--bg-secondary)] transition-colors">
                                            <td className="px-4 py-3 font-medium text-[var(--text)]">{item.period}</td>
                                            <td className="px-4 py-3 text-right text-[var(--text-secondary)]">{item.registrations}</td>
                                            <td className="px-4 py-3 text-right text-[var(--text-secondary)]">{item.jobPostings}</td>
                                            <td className="px-4 py-3 text-right text-[var(--text-secondary)]">{item.applications}</td>
                                        </tr>
                                    ))}
                                    {/* Totals Row */}
                                    <tr className="bg-[var(--bg-secondary)] font-semibold">
                                        <td className="px-4 py-3 text-[var(--text)]">Total</td>
                                        <td className="px-4 py-3 text-right text-[var(--text)]">{totals.registrations}</td>
                                        <td className="px-4 py-3 text-right text-[var(--text)]">{totals.jobPostings}</td>
                                        <td className="px-4 py-3 text-right text-[var(--text)]">{totals.applications}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <EmptyState
                            icon={BarChart3}
                            title="No analytics data"
                            description="Select a date range to view analytics data."
                        />
                    )}
                </Card>

                {/* Daily Active Users */}
                <Card
                    header={
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-semibold text-[var(--text)]">Daily Active Users (Last 30 Days)</h2>
                        </div>
                    }
                >
                    {dauLoading ? (
                        <Skeleton variant="rect" height={280} />
                    ) : dailyActiveUsers.length > 0 ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="rounded-lg bg-[var(--bg-secondary)] p-3 text-center">
                                    <p className="text-2xl font-bold text-[var(--text)]">
                                        {dailyActiveUsers[dailyActiveUsers.length - 1]?.total ?? 0}
                                    </p>
                                    <p className="text-xs text-[var(--text-muted)]">Today</p>
                                </div>
                                <div className="rounded-lg bg-[var(--bg-secondary)] p-3 text-center">
                                    <p className="text-2xl font-bold text-primary">
                                        {dailyActiveUsers[dailyActiveUsers.length - 1]?.candidates ?? 0}
                                    </p>
                                    <p className="text-xs text-[var(--text-muted)]">Candidates</p>
                                </div>
                                <div className="rounded-lg bg-[var(--bg-secondary)] p-3 text-center">
                                    <p className="text-2xl font-bold text-[var(--success)]">
                                        {dailyActiveUsers[dailyActiveUsers.length - 1]?.employers ?? 0}
                                    </p>
                                    <p className="text-xs text-[var(--text-muted)]">Employers</p>
                                </div>
                            </div>
                            <AreaChart
                                data={dailyActiveUsers as unknown as Record<string, unknown>[]}
                                xKey="date"
                                yKey="total"
                                yKey2="candidates"
                                color="#2563EB"
                                color2="#10B981"
                                height={280}
                            />
                        </div>
                    ) : (
                        <EmptyState
                            icon={Users}
                            title="No active user data"
                            description="Daily active user data will appear as users interact with the platform."
                        />
                    )}
                </Card>
                </>)}

                {/* Advanced Analytics (BigQuery-powered) */}
                {activeTab === 'advanced' && (
                    <div className="space-y-6">
                        {/* Skill Demand */}
                        <Card
                            header={
                                <div className="flex items-center gap-2">
                                    <Code className="h-5 w-5 text-primary" />
                                    <h2 className="text-lg font-semibold text-[var(--text)]">Skill Demand</h2>
                                </div>
                            }
                        >
                            {skillsLoading ? (
                                <Skeleton variant="rect" height={280} />
                            ) : popularSkills.length > 0 ? (
                                <BarChart
                                    data={popularSkills as unknown as Record<string, unknown>[]}
                                    xKey="skill"
                                    bars={[{ key: 'demand_count', color: '#2563EB', name: 'Demand' }]}
                                    height={280}
                                />
                            ) : (
                                <EmptyState
                                    icon={Code}
                                    title="No skill data"
                                    description="Skill demand data will appear here when BigQuery is configured."
                                />
                            )}
                        </Card>

                        {/* Application Funnel */}
                        <Card
                            header={
                                <div className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-[var(--info)]" />
                                    <h2 className="text-lg font-semibold text-[var(--text)]">Application Funnel</h2>
                                </div>
                            }
                        >
                            {funnelLoading ? (
                                <Skeleton variant="rect" height={280} />
                            ) : applicationFunnel.length > 0 ? (
                                <BarChart
                                    data={applicationFunnel as unknown as Record<string, unknown>[]}
                                    xKey="status"
                                    bars={[{ key: 'count', color: '#10B981', name: 'Applications' }]}
                                    height={280}
                                />
                            ) : (
                                <EmptyState
                                    icon={FileText}
                                    title="No funnel data"
                                    description="Application funnel data will appear here when BigQuery is configured."
                                />
                            )}
                        </Card>

                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* User Growth */}
                            <Card
                                header={
                                    <div className="flex items-center gap-2">
                                        <UserPlus className="h-5 w-5 text-primary" />
                                        <h2 className="text-lg font-semibold text-[var(--text)]">User Growth</h2>
                                    </div>
                                }
                            >
                                {growthLoading ? (
                                    <Skeleton variant="rect" height={250} />
                                ) : userGrowth.length > 0 ? (
                                    <AreaChart
                                        data={userGrowth as unknown as Record<string, unknown>[]}
                                        xKey="date"
                                        yKey="registrations"
                                        color="#2563EB"
                                        height={250}
                                    />
                                ) : (
                                    <EmptyState
                                        icon={UserPlus}
                                        title="No growth data"
                                        description="User growth data will appear when BigQuery is configured."
                                    />
                                )}
                            </Card>

                            {/* Job Posting Trends */}
                            <Card
                                header={
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="h-5 w-5 text-[var(--success)]" />
                                        <h2 className="text-lg font-semibold text-[var(--text)]">Job Posting Trends</h2>
                                    </div>
                                }
                            >
                                {jobTrendsLoading ? (
                                    <Skeleton variant="rect" height={250} />
                                ) : jobTrends.length > 0 ? (
                                    <AreaChart
                                        data={jobTrends as unknown as Record<string, unknown>[]}
                                        xKey="date"
                                        yKey="jobs_posted"
                                        color="#10B981"
                                        height={250}
                                    />
                                ) : (
                                    <EmptyState
                                        icon={Briefcase}
                                        title="No job trends data"
                                        description="Job posting trends will appear when BigQuery is configured."
                                    />
                                )}
                            </Card>
                        </div>

                        {/* Salary Trends */}
                        <Card
                            header={
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-[var(--warning)]" />
                                    <h2 className="text-lg font-semibold text-[var(--text)]">Salary Trends</h2>
                                </div>
                            }
                        >
                            {salaryLoading ? (
                                <Skeleton variant="rect" height={280} />
                            ) : salaryTrends.length > 0 ? (
                                <AreaChart
                                    data={salaryTrends as unknown as Record<string, unknown>[]}
                                    xKey="month"
                                    yKey="avg_min_salary"
                                    yKey2="avg_max_salary"
                                    color="#F59E0B"
                                    color2="#EF4444"
                                    height={280}
                                />
                            ) : (
                                <EmptyState
                                    icon={DollarSign}
                                    title="No salary data"
                                    description="Salary trend data will appear when BigQuery is configured."
                                />
                            )}
                        </Card>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
