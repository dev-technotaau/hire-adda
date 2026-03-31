'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import {
  Briefcase,
  Bookmark,
  Eye,
  UserCheck,
  ArrowRight,
  Clock,
  Building2,
  TrendingUp,
  Sparkles,
  HelpCircle,
  FileText,
  Upload,
  Brain,
  Bell,
  BarChart3,
  Settings,
  Award,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Activity,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import Skeleton from '@/components/ui/Skeleton';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import Tooltip from '@/components/ui/Tooltip';
import PieChart from '@/components/charts/PieChart';
import AreaChart from '@/components/charts/AreaChart';
import BarChart from '@/components/charts/BarChart';
import { candidateService } from '@/services/candidate.service';
import { jobService } from '@/services/job.service';
import { useRecommendedJobs } from '@/hooks/use-recommendations';
import { useAppliedJobs } from '@/hooks/use-jobs';
import { useNotifications } from '@/hooks/use-notifications';
import type { Job } from '@/types/job';
import { QUERY_KEYS } from '@/constants/config';
import { ROUTES } from '@/constants/routes';
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS } from '@/constants/enums';
import {
  formatRelativeDate,
  getGreeting,
  getDashboardSubtitle,
  formatSalaryRange,
} from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { wasOnboardingSkipped } from '@/hooks/use-onboarding';

// Maps backend completeness field names → candidate profile ?section= values
const COMPLETENESS_SECTION_MAP: Record<string, string> = {
  'Personal Info': 'personal',
  Contact: 'personal',
  Professional: 'experience',
  Skills: 'skills',
  Education: 'education',
  Experience: 'experience',
  Resume: 'resume',
  Headline: 'personal',
  Preferences: 'preferences',
  'Certifications/Projects': 'certifications',
  'Language Proficiency': 'languages',
  'Social Profiles': 'social',
  'Publications/Patents/Volunteer': 'publications',
  'Interests/Hobbies': 'interests',
  References: 'volunteering',
  Documents: 'personal',
};

// Actionable profile tips keyed by backend completeness section name
const PROFILE_TIPS: Record<string, { tip: string; impact: string; icon: typeof Briefcase }> = {
  Skills: {
    tip: 'Add at least 5 skills to your profile',
    impact: 'Profiles with 5+ skills get 3x more recruiter views',
    icon: Target,
  },
  Experience: {
    tip: 'Add your work experience',
    impact: 'Recruiters filter by experience 80% of the time',
    icon: Briefcase,
  },
  Resume: {
    tip: 'Upload your resume',
    impact: 'AI parsing can auto-fill your profile in seconds',
    icon: FileText,
  },
  Education: {
    tip: 'Add your education details',
    impact: 'Education is a top-3 filter for recruiters',
    icon: Award,
  },
  Headline: {
    tip: 'Write a professional headline',
    impact: 'Headlines appear in search results',
    icon: Eye,
  },
  Preferences: {
    tip: 'Set your job preferences',
    impact: 'Get better job recommendations tailored to you',
    icon: Settings,
  },
  'Social Profiles': {
    tip: 'Link your social profiles',
    impact: 'Verified profiles rank higher in search',
    icon: UserCheck,
  },
  'Certifications/Projects': {
    tip: 'Add certifications or projects',
    impact: 'Showcase expertise beyond job titles',
    icon: Award,
  },
};

// Map activity status to timeline dot color
const activityDotColor = (status: string) => {
  const map: Record<string, string> = {
    APPLIED: 'bg-[#3B82F6]',
    VIEWED: 'bg-[#6366F1]',
    SHORTLISTED: 'bg-[#10B981]',
    INTERVIEW_SCHEDULED: 'bg-[#F59E0B]',
    OFFERED: 'bg-[#059669]',
    HIRED: 'bg-[#059669]',
    REJECTED: 'bg-[#EF4444]',
    WITHDRAWN: 'bg-[#6B7280]',
  };
  return map[status] || 'bg-[#6B7280]';
};

// Map notification type to icon
const notificationTypeIcon = (type: string) => {
  switch (type) {
    case 'SUCCESS':
      return CheckCircle;
    case 'WARNING':
      return AlertTriangle;
    case 'ERROR':
      return XCircle;
    default:
      return Info;
  }
};

const notificationTypeColor = (type: string) => {
  switch (type) {
    case 'SUCCESS':
      return 'text-[var(--success)]';
    case 'WARNING':
      return 'text-[var(--warning)]';
    case 'ERROR':
      return 'text-[var(--error)]';
    default:
      return 'text-[var(--info)]';
  }
};

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

  const { data: analyticsData } = useQuery({
    queryKey: QUERY_KEYS.CANDIDATES.ANALYTICS({ groupBy: 'week' }),
    queryFn: () => candidateService.getAnalytics({ groupBy: 'week' }),
  });
  const analytics = analyticsData?.data;

  // Redirect first-time users to onboarding (profile completeness 0% and not skipped)
  const needsOnboarding =
    !compLoading &&
    completeness?.data?.score === 0 &&
    !wasOnboardingSkipped('ha_candidate_onboarding');

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
      deltaKey: 'applications' as const,
    },
    {
      label: 'Saved Jobs',
      value: stats?.savedJobsCount ?? 0,
      icon: Bookmark,
      color: 'text-secondary bg-secondary-light',
      href: ROUTES.CANDIDATE.SAVED_JOBS,
    },
    {
      label: 'Profile Views',
      value: stats?.profileViews ?? 0,
      icon: Eye,
      color: 'text-[var(--success)] bg-[var(--success-light)]',
      href: ROUTES.CANDIDATE.PROFILE,
      deltaKey: 'profileViews' as const,
    },
    {
      label: 'Profile Score',
      value: `${stats?.profileCompleteness ?? 0}%`,
      icon: UserCheck,
      color: 'text-accent bg-accent-light',
      href: ROUTES.CANDIDATE.PROFILE,
    },
  ];

  const statusColors: Record<string, string> = {
    APPLIED: '#1E5CAF',
    VIEWED: '#6366F1',
    SHORTLISTED: '#10B981',
    INTERVIEW_SCHEDULED: '#F59E0B',
    REJECTED: '#EF4444',
    HIRED: '#059669',
    WITHDRAWN: '#6B7280',
  };

  // Fetch recent notifications for preview card
  const { data: notificationsData } = useNotifications({ limit: 5 });
  const notifications = notificationsData?.data?.items || [];

  // Week-over-week change deltas for stat cards
  const weekDeltas = useMemo(() => {
    if (!analytics?.trends || analytics.trends.length < 2) return null;
    const curr = analytics.trends[analytics.trends.length - 1];
    const prev = analytics.trends[analytics.trends.length - 2];
    const delta = (c: number, p: number) =>
      p > 0 ? Math.round(((c - p) / p) * 100) : c > 0 ? 100 : 0;
    return {
      applications: delta(curr.applications, prev.applications),
      profileViews: delta(curr.profileViews, prev.profileViews),
    };
  }, [analytics?.trends]);

  // Build sparkline points from trends data for stat cards
  const sparkline = useMemo(() => {
    if (!analytics?.trends?.length) return null;
    const recent = analytics.trends.slice(-6);
    const appValues = recent.map((t) => t.applications);
    const viewValues = recent.map((t) => t.profileViews);
    const toPoints = (vals: number[], w: number, h: number) => {
      const max = Math.max(...vals, 1);
      return vals.map((v, i) => `${(i / (vals.length - 1)) * w},${h - (v / max) * h}`).join(' ');
    };
    return { applications: toPoints(appValues, 60, 20), views: toPoints(viewValues, 60, 20) };
  }, [analytics?.trends]);

  // KPI insight cards data
  const kpiCards = useMemo(() => {
    if (!analytics?.summary) return [];
    return [
      {
        label: 'Offer Rate',
        value: `${analytics.summary.offerRate ?? 0}%`,
        icon: Award,
        color: 'text-primary bg-primary-light',
        description: 'of interviews result in offers',
      },
      {
        label: 'Avg Response',
        value:
          analytics.summary.avgResponseDays != null ? `${analytics.summary.avgResponseDays}d` : '—',
        icon: Clock,
        color: 'text-secondary bg-secondary-light',
        description: 'average employer response time',
      },
    ];
  }, [analytics?.summary]);

  // Application funnel data for horizontal bar chart
  const funnelData = useMemo(() => {
    if (!analytics?.funnel) return [];
    const stages = [
      { key: 'applied', label: 'Applied', color: '#3B82F6' },
      { key: 'viewed', label: 'Reviewed', color: '#8B5CF6' },
      { key: 'shortlisted', label: 'Shortlisted', color: '#F59E0B' },
      { key: 'offered', label: 'Offered', color: '#10B981' },
      { key: 'hired', label: 'Hired', color: '#059669' },
    ];
    return stages
      .map((s) => ({ name: s.label, count: analytics.funnel[s.key] ?? 0, color: s.color }))
      .filter((s) => s.count > 0 || s.name === 'Applied');
  }, [analytics?.funnel]);

  // Status distribution for pie chart (from analytics)
  const analyticsStatusPie = useMemo(() => {
    if (!analytics?.statusDistribution?.length) return [];
    return analytics.statusDistribution.map((s) => ({
      name: APPLICATION_STATUS_LABELS[s.status] || s.status,
      value: s.count,
      color: statusColors[s.status] || '#6B7280',
    }));
  }, [analytics?.statusDistribution]);

  // Skills gap data for stacked bar chart
  const skillsData = useMemo(() => {
    if (!analytics?.topSkillsInDemand?.length) return [];
    return analytics.topSkillsInDemand.slice(0, 10).map((s) => ({
      skill: s.skill.length > 15 ? `${s.skill.slice(0, 15)}...` : s.skill,
      have: s.youHave ? s.count : 0,
      missing: !s.youHave ? s.count : 0,
    }));
  }, [analytics?.topSkillsInDemand]);

  const { data: aiRecsData } = useRecommendedJobs();
  const aiRecommendedJobs = aiRecsData?.data?.items || [];

  // Track applied jobs for recommendation badges
  const { data: appliedJobsData } = useAppliedJobs(1, 500);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const appliedItems = appliedJobsData?.data?.items;
    if (appliedItems && appliedItems.length > 0) {
      queueMicrotask(() =>
        setAppliedJobIds(new Set(appliedItems.map((a: { jobId: string }) => a.jobId))),
      );
    }
  }, [appliedJobsData]);

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
          <h1 className="text-2xl font-bold text-[var(--text)]">{getGreeting(user?.firstName)}</h1>
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
                  <TrendingUp className="text-primary h-5 w-5" />
                  <h3 className="font-semibold text-[var(--text)]">Complete Your Profile</h3>
                </div>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  A complete profile increases your chances of getting hired by 3x.
                </p>
                <ProgressBar
                  value={profile.score}
                  color={
                    profile.score >= 80 ? 'success' : profile.score >= 50 ? 'warning' : 'error'
                  }
                  className="mt-3"
                />
                <p className="mt-1 text-xs text-[var(--text-muted)]">{profile.score}% complete</p>
                {profile.sections.filter((s) => !s.completed).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {profile.sections
                      .filter((s) => !s.completed)
                      .map((s) => (
                        <Link
                          key={s.name}
                          href={`${ROUTES.CANDIDATE.PROFILE}?section=${COMPLETENESS_SECTION_MAP[s.name] || 'personal'}`}
                          title={`Complete your ${s.name} section`}
                        >
                          <span className="border-primary/20 text-primary hover:bg-primary inline-flex cursor-pointer items-center gap-1 rounded-full border bg-white px-3 py-1 text-xs font-medium transition-colors hover:text-white">
                            + {s.name}
                          </span>
                        </Link>
                      ))}
                  </div>
                )}
              </div>
              <Link
                href={ROUTES.CANDIDATE.PROFILE}
                className="shrink-0 self-start"
                title="Go to your profile to complete missing sections"
              >
                <Button size="sm" tooltip="Update your profile">
                  Update Profile
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Smart Profile Tips */}
        {!compLoading &&
          profile &&
          profile.score < 100 &&
          profile.sections.filter((s) => !s.completed).length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {profile.sections
                .filter((s) => !s.completed && PROFILE_TIPS[s.name])
                .slice(0, 3)
                .map((s) => {
                  const tip = PROFILE_TIPS[s.name];
                  const TipIcon = tip.icon;
                  return (
                    <Link
                      key={s.name}
                      href={`${ROUTES.CANDIDATE.PROFILE}?section=${COMPLETENESS_SECTION_MAP[s.name] || 'personal'}`}
                      title={tip.tip}
                    >
                      <div className="group hover:border-primary/30 flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4 transition-all hover:shadow-sm">
                        <div className="bg-secondary-light flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                          <TipIcon className="text-secondary h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="group-hover:text-primary text-sm font-medium text-[var(--text)] transition-colors">
                            {tip.tip}
                          </p>
                          <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                            {tip.impact}
                          </p>
                        </div>
                        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </Link>
                  );
                })}
            </div>
          )}

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dashLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <Skeleton variant="card" />
                </Card>
              ))
            : statCards.map((stat) => (
                <Link key={stat.label} href={stat.href} title={`View ${stat.label}`}>
                  <Card className="cursor-pointer transition-shadow hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.color}`}
                        >
                          <stat.icon className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-[var(--text)]">{stat.value}</p>
                          <p className="text-sm text-[var(--text-muted)]">{stat.label}</p>
                          {weekDeltas &&
                            stat.deltaKey &&
                            weekDeltas[stat.deltaKey] !== undefined && (
                              <span
                                className={`mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-medium ${weekDeltas[stat.deltaKey] >= 0 ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}
                              >
                                {weekDeltas[stat.deltaKey] >= 0 ? (
                                  <ArrowUpRight className="h-3 w-3" />
                                ) : (
                                  <ArrowDownRight className="h-3 w-3" />
                                )}
                                {Math.abs(weekDeltas[stat.deltaKey])}% vs last week
                              </span>
                            )}
                        </div>
                      </div>
                      {sparkline &&
                        (stat.label === 'Applications' || stat.label === 'Profile Views') && (
                          <svg width="60" height="20" className="shrink-0 opacity-60">
                            <polyline
                              points={
                                stat.label === 'Applications'
                                  ? sparkline.applications
                                  : sparkline.views
                              }
                              fill="none"
                              stroke={stat.label === 'Applications' ? '#3B82F6' : '#10B981'}
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                    </div>
                  </Card>
                </Link>
              ))}
        </div>

        {/* KPI Insights Row + Application Funnel */}
        {analytics?.summary && (kpiCards.length > 0 || funnelData.length > 0) && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpiCards.map((kpi) => (
              <Card key={kpi.label} className="relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${kpi.color}`}
                  >
                    <kpi.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-[var(--text)]">{kpi.value}</p>
                    <p className="text-xs text-[var(--text-muted)]">{kpi.label}</p>
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-[var(--text-muted)]">{kpi.description}</p>
              </Card>
            ))}
            {funnelData.length > 0 && (
              <Card
                className="sm:col-span-2"
                header={
                  <h2 className="text-lg font-semibold text-[var(--text)]">Application Funnel</h2>
                }
              >
                <div className="space-y-3">
                  {funnelData.map((stage) => {
                    const maxCount = Math.max(...funnelData.map((s) => s.count), 1);
                    const widthPct = Math.max((stage.count / maxCount) * 100, 4);
                    return (
                      <div key={stage.name} className="flex items-center gap-3">
                        <span className="w-20 shrink-0 text-xs text-[var(--text-secondary)]">
                          {stage.name}
                        </span>
                        <div className="h-7 flex-1 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
                          <div
                            className="flex h-full items-center rounded-full px-2 text-xs font-medium text-white"
                            style={{ width: `${widthPct}%`, backgroundColor: stage.color }}
                          >
                            {stage.count > 0 && stage.count}
                          </div>
                        </div>
                        <span className="w-8 shrink-0 text-right text-xs font-semibold text-[var(--text)]">
                          {stage.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Activity Trends Chart */}
        {analytics?.trends && analytics.trends.length > 1 && (
          <Card
            header={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="text-primary h-5 w-5" />
                  <h2 className="text-lg font-semibold text-[var(--text)]">Activity Trends</h2>
                </div>
                <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-[#3B82F6]" /> Applications
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-[#8B5CF6]" /> Profile
                    Views
                  </span>
                </div>
              </div>
            }
          >
            <AreaChart
              data={analytics.trends as unknown as Record<string, unknown>[]}
              xKey="period"
              yKey="applications"
              yKey2="profileViews"
              color="#3B82F6"
              color2="#8B5CF6"
              height={280}
            />
          </Card>
        )}

        {/* Status Distribution */}
        {analytics && analyticsStatusPie.length > 0 && (
          <Card
            header={
              <h2 className="text-lg font-semibold text-[var(--text)]">Status Distribution</h2>
            }
          >
            <PieChart data={analyticsStatusPie} height={250} innerRadius={45} />
          </Card>
        )}

        {/* Skills Gap Analysis */}
        {skillsData.length > 0 && (
          <Card
            header={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="text-primary h-5 w-5" />
                  <h2 className="text-lg font-semibold text-[var(--text)]">Skills in Demand</h2>
                </div>
                <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-[#10B981]" /> You Have
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-[#EF4444]" /> To Develop
                  </span>
                </div>
              </div>
            }
          >
            <BarChart
              data={skillsData as unknown as Record<string, unknown>[]}
              xKey="skill"
              bars={[
                { key: 'have', color: '#10B981', name: 'You Have' },
                { key: 'missing', color: '#EF4444', name: 'To Develop' },
              ]}
              height={280}
              stacked
            />
          </Card>
        )}

        {/* Salary Insights */}
        {analytics?.salaryInsights && (
          <Card
            header={
              <div className="flex items-center gap-2">
                <TrendingUp className="text-primary h-5 w-5" />
                <h2 className="text-lg font-semibold text-[var(--text)]">Salary Insights</h2>
              </div>
            }
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-[var(--bg-secondary)] p-4 text-center">
                <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">Your Expected</p>
                <p className="text-lg font-bold text-[var(--text)]">
                  {formatSalaryRange(
                    analytics.salaryInsights.yourExpected?.min,
                    analytics.salaryInsights.yourExpected?.max,
                  )}
                </p>
              </div>
              <div className="rounded-xl bg-[var(--bg-secondary)] p-4 text-center">
                <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">
                  Applied Jobs Avg
                </p>
                <p className="text-primary text-lg font-bold">
                  {formatSalaryRange(
                    analytics.salaryInsights.appliedJobsAvg?.min,
                    analytics.salaryInsights.appliedJobsAvg?.max,
                  )}
                </p>
              </div>
              <div className="rounded-xl bg-[var(--bg-secondary)] p-4 text-center">
                <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">Offered Avg</p>
                <p className="text-lg font-bold text-[var(--success)]">
                  {analytics.salaryInsights.offeredAvg != null
                    ? formatSalaryRange(
                        analytics.salaryInsights.offeredAvg,
                        analytics.salaryInsights.offeredAvg,
                      )
                    : 'N/A'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Resume & Career Tools */}
        <Card
          header={
            <div className="flex items-center gap-2">
              <FileText className="text-primary h-5 w-5" />
              <h2 className="text-lg font-semibold text-[var(--text)]">Resume & Career Tools</h2>
            </div>
          }
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              href={`${ROUTES.CANDIDATE.PROFILE}?section=resume&focus=upload-resume`}
              title="Upload or replace your resume file"
            >
              <div className="group hover:border-primary/30 flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--border)] p-4 transition-all hover:shadow-sm">
                <div className="bg-primary-light flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                  <Upload className="text-primary h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="group-hover:text-primary text-sm font-medium text-[var(--text)] transition-colors">
                    Upload Resume
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Upload or replace your resume file
                  </p>
                </div>
              </div>
            </Link>
            <Link
              href={`${ROUTES.CANDIDATE.PROFILE}?section=resume&focus=generate-resume`}
              title="Create a professional resume from your profile"
            >
              <div className="group hover:border-primary/30 flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--border)] p-4 transition-all hover:shadow-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--success-light)]">
                  <FileText className="h-5 w-5 text-[var(--success)]" />
                </div>
                <div className="min-w-0">
                  <p className="group-hover:text-primary text-sm font-medium text-[var(--text)] transition-colors">
                    Generate Resume
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Create a professional resume from your profile
                  </p>
                </div>
              </div>
            </Link>
            <Link
              href={`${ROUTES.CANDIDATE.PROFILE}?section=resume&focus=parse-resume`}
              title="Extract skills and experience with AI"
            >
              <div className="group border-primary/20 bg-primary-50/20 hover:border-primary/40 flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-all hover:shadow-sm">
                <div className="bg-primary-light flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                  <Brain className="text-primary h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="group-hover:text-primary text-sm font-medium text-[var(--text)] transition-colors">
                    AI Resume Parser
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Extract skills & experience with AI
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </Card>

        {/* Application Status Distribution (fallback when analytics not available) */}
        {!analytics?.statusDistribution?.length &&
          !dashLoading &&
          applicationStatusData.length > 0 && (
            <Card
              header={
                <h2 className="text-lg font-semibold text-[var(--text)]">
                  Application Status Distribution
                </h2>
              }
            >
              <PieChart data={applicationStatusData} height={250} innerRadius={45} />
            </Card>
          )}

        {/* AI Recommended Jobs */}
        {aiRecommendedJobs.length > 0 && (
          <Card
            header={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-primary h-5 w-5" />
                  <h2 className="text-lg font-semibold text-[var(--text)]">AI Recommended Jobs</h2>
                </div>
                <Tooltip content="View all AI recommended jobs">
                  <Link
                    href={ROUTES.CANDIDATE.JOBS}
                    className="text-primary text-sm hover:underline"
                  >
                    View All <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
                  </Link>
                </Tooltip>
              </div>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {aiRecommendedJobs.slice(0, 4).map((job) => (
                <Link
                  key={job.id}
                  href={ROUTES.CANDIDATE.JOB_DETAIL(job.id)}
                  title={`View ${job.title} at ${job.company?.companyName || 'company'}`}
                >
                  <div className="border-primary/20 bg-primary-50/20 hover:border-primary/40 cursor-pointer rounded-lg border p-4 transition-all hover:shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary-light flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                        <Sparkles className="text-primary h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-[var(--text)]">{job.title}</p>
                        <p className="text-sm text-[var(--text-muted)]">
                          {job.company?.companyName}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                          {job.location ? <span>{job.location}</span> : null}
                          {(job as Job & { matchScore?: number }).matchScore ? (
                            <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
                              {Math.round((job as Job & { matchScore?: number }).matchScore!)}%
                              match
                            </span>
                          ) : null}
                          {appliedJobIds.has(job.id) && (
                            <span className="flex items-center gap-1 rounded-full bg-[var(--success)]/10 px-2 py-0.5 text-xs font-medium text-[var(--success)]">
                              <CheckCircle className="h-3 w-3" /> Applied
                            </span>
                          )}
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
                <Tooltip content="View all recommended jobs">
                  <Link
                    href={ROUTES.CANDIDATE.JOBS}
                    className="text-primary text-sm hover:underline"
                  >
                    View All <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
                  </Link>
                </Tooltip>
              </div>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {recommendedJobs.map((job) => (
                <Link
                  key={job.id}
                  href={ROUTES.CANDIDATE.JOB_DETAIL(job.id)}
                  title={`View ${job.title} at ${job.company?.companyName || 'company'}`}
                >
                  <div className="hover:border-primary/30 cursor-pointer rounded-lg border border-[var(--border)] p-4 transition-all hover:shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-tertiary)]">
                        {job.company?.logo ? (
                          <img
                            src={job.company.logo}
                            alt={job.company?.companyName || 'Company logo'}
                            className="h-8 w-8 rounded-md object-contain"
                          />
                        ) : (
                          <Building2 className="h-5 w-5 text-[var(--text-muted)]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-[var(--text)]">{job.title}</p>
                        <p className="text-sm text-[var(--text-muted)]">
                          {job.company?.companyName}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                          {job.location && <span>{job.location}</span>}
                          {job.workMode && <span>· {job.workMode}</span>}
                          {appliedJobIds.has(job.id) && (
                            <span className="flex items-center gap-1 rounded-full bg-[var(--success)]/10 px-2 py-0.5 text-xs font-medium text-[var(--success)]">
                              <CheckCircle className="h-3 w-3" /> Applied
                            </span>
                          )}
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
              <Tooltip content="View all applications">
                <Link
                  href={ROUTES.CANDIDATE.APPLICATIONS}
                  className="text-primary text-sm hover:underline"
                >
                  View All <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
                </Link>
              </Tooltip>
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
                const badgeColor =
                  statusColorMap[APPLICATION_STATUS_COLORS[app.status] || 'neutral'] || 'neutral';
                return (
                  <div
                    key={app.id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-tertiary)]">
                        <Building2 className="h-5 w-5 text-[var(--text-muted)]" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[var(--text)]">{app.jobTitle}</p>
                        <p className="text-sm text-[var(--text-muted)]">{app.companyName}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
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
                <Link href={ROUTES.CANDIDATE.JOBS} title="Browse available job listings">
                  <Button size="sm" tooltip="Browse available jobs">
                    Browse Jobs
                  </Button>
                </Link>
              }
            />
          )}
        </Card>

        {/* Recent Activity Timeline */}
        {analytics?.recentActivity && analytics.recentActivity.length > 0 && (
          <Card
            header={
              <div className="flex items-center gap-2">
                <Activity className="text-primary h-5 w-5" />
                <h2 className="text-lg font-semibold text-[var(--text)]">Recent Activity</h2>
              </div>
            }
          >
            <div className="space-y-0">
              {analytics.recentActivity.slice(0, 5).map((activity, i) => {
                const badgeColor =
                  statusColorMap[APPLICATION_STATUS_COLORS[activity.status] || 'neutral'] ||
                  'neutral';
                return (
                  <div
                    key={i}
                    className="flex gap-3 border-b border-[var(--border)] py-3 last:border-0"
                  >
                    <div className="relative flex flex-col items-center">
                      <div
                        className={`mt-1.5 h-2.5 w-2.5 rounded-full ${activityDotColor(activity.status)}`}
                      />
                      {i < Math.min(analytics.recentActivity.length, 5) - 1 && (
                        <div className="mt-1 w-px flex-1 bg-[var(--border)]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[var(--text)]">
                        Applied to <span className="font-medium">{activity.jobTitle}</span> at{' '}
                        <span className="font-medium">{activity.companyName}</span>
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <Badge variant={badgeColor} size="sm">
                          {APPLICATION_STATUS_LABELS[activity.status] || activity.status}
                        </Badge>
                        <span className="text-xs text-[var(--text-muted)]">
                          {formatRelativeDate(activity.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Notifications Preview */}
        {notifications.length > 0 && (
          <Card
            header={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="text-primary h-5 w-5" />
                  <h2 className="text-lg font-semibold text-[var(--text)]">Notifications</h2>
                </div>
                <Tooltip content="View all notifications">
                  <Link
                    href={ROUTES.NOTIFICATIONS}
                    className="text-primary text-sm hover:underline"
                  >
                    View All <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
                  </Link>
                </Tooltip>
              </div>
            }
          >
            <div className="divide-y divide-[var(--border)]">
              {notifications.slice(0, 5).map((n) => {
                const NIcon = notificationTypeIcon(n.type);
                return (
                  <div key={n.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                    <div className={`mt-0.5 shrink-0 ${notificationTypeColor(n.type)}`}>
                      <NIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-[var(--text)]">{n.title}</p>
                        {!n.isRead && (
                          <span className="bg-primary mt-1.5 h-2 w-2 shrink-0 rounded-full" />
                        )}
                      </div>
                      <p className="line-clamp-1 text-xs text-[var(--text-muted)]">{n.message}</p>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {formatRelativeDate(n.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="mb-3 text-lg font-semibold text-[var(--text)]">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href={ROUTES.CANDIDATE.JOBS} title="Search and browse job listings">
              <Card className="group hover:border-primary/30 cursor-pointer transition-all hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="bg-primary-light flex h-10 w-10 items-center justify-center rounded-lg">
                    <Briefcase className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <p className="group-hover:text-primary font-medium text-[var(--text)] transition-colors">
                      Search Jobs
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">Find your next opportunity</p>
                  </div>
                </div>
              </Card>
            </Link>
            <Link href={ROUTES.CANDIDATE.PROFILE} title="Edit and update your profile">
              <Card className="group hover:border-primary/30 cursor-pointer transition-all hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--success-light)]">
                    <UserCheck className="h-5 w-5 text-[var(--success)]" />
                  </div>
                  <div>
                    <p className="group-hover:text-primary font-medium text-[var(--text)] transition-colors">
                      Edit Profile
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">Keep your info updated</p>
                  </div>
                </div>
              </Card>
            </Link>
            <Link href={ROUTES.CANDIDATE.JOB_ALERTS} title="Manage your job alert preferences">
              <Card className="group hover:border-primary/30 cursor-pointer transition-all hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="bg-accent-light flex h-10 w-10 items-center justify-center rounded-lg">
                    <Bell className="text-accent h-5 w-5" />
                  </div>
                  <div>
                    <p className="group-hover:text-primary font-medium text-[var(--text)] transition-colors">
                      Job Alerts
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Manage your alert preferences
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
            <Link href={ROUTES.CANDIDATE.ANALYTICS} title="Track your job search analytics">
              <Card className="group hover:border-primary/30 cursor-pointer transition-all hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="bg-secondary-light flex h-10 w-10 items-center justify-center rounded-lg">
                    <BarChart3 className="text-secondary h-5 w-5" />
                  </div>
                  <div>
                    <p className="group-hover:text-primary font-medium text-[var(--text)] transition-colors">
                      Analytics
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Track your job search performance
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
            <Link href={ROUTES.CANDIDATE.SETTINGS} title="Account, security and preferences">
              <Card className="group hover:border-primary/30 cursor-pointer transition-all hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-tertiary)]">
                    <Settings className="h-5 w-5 text-[var(--text-muted)]" />
                  </div>
                  <div>
                    <p className="group-hover:text-primary font-medium text-[var(--text)] transition-colors">
                      Settings
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Account, security & preferences
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
            <Link href={ROUTES.CANDIDATE.HELP} title="FAQs and support tickets">
              <Card className="group hover:border-primary/30 cursor-pointer transition-all hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="bg-accent-light flex h-10 w-10 items-center justify-center rounded-lg">
                    <HelpCircle className="text-accent h-5 w-5" />
                  </div>
                  <div>
                    <p className="group-hover:text-primary font-medium text-[var(--text)] transition-colors">
                      Help & Support
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">FAQs and support tickets</p>
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
