import { prisma } from '../config/prisma';
import logger from '../config/logger';

interface AnalyticsFilters {
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
}

interface EmployerAnalytics {
    summary: {
        totalJobsPosted: number;
        activeJobs: number;
        totalApplications: number;
        avgTimeToHireDays: number | null;
        overallHireRate: number;
        profileViews: number;
        savedCandidates: number;
        hiringVelocity: number;
    };
    funnel: Record<string, number>;
    trends: Array<{ period: string; applications: number; profileViews: number; jobsPosted: number }>;
    statusDistribution: Array<{ status: string; count: number }>;
    sourceDistribution: Array<{ source: string; count: number }>;
    topSkillsInDemand: Array<{ skill: string; count: number }>;
    salaryCompetitiveness: {
        yourAvg: { min: number; max: number };
        platformAvg: { min: number; max: number };
    };
    jobPerformance: Array<{
        jobId: string;
        title: string;
        views: number;
        applications: number;
        hiredCount: number;
        conversionRate: number;
    }>;
    recentActivity: Array<{
        candidateName: string;
        jobTitle: string;
        status: string;
        date: string;
    }>;
}

function emptyAnalytics(): EmployerAnalytics {
    return {
        summary: {
            totalJobsPosted: 0, activeJobs: 0, totalApplications: 0,
            avgTimeToHireDays: null, overallHireRate: 0, profileViews: 0,
            savedCandidates: 0, hiringVelocity: 0,
        },
        funnel: { applied: 0, viewed: 0, shortlisted: 0, interviewScheduled: 0, offered: 0, hired: 0, rejected: 0, withdrawn: 0 },
        trends: [],
        statusDistribution: [],
        sourceDistribution: [],
        topSkillsInDemand: [],
        salaryCompetitiveness: { yourAvg: { min: 0, max: 0 }, platformAvg: { min: 0, max: 0 } },
        jobPerformance: [],
        recentActivity: [],
    };
}

export const employerAnalyticsService = {
    async getAnalytics(userId: string, filters: AnalyticsFilters = {}): Promise<EmployerAnalytics> {
        const { startDate, endDate, groupBy = 'week' } = filters;

        const companyProfile = await prisma.companyProfile.findUnique({
            where: { userId },
            select: { id: true },
        });

        if (!companyProfile) return emptyAnalytics();
        const companyId = companyProfile.id;

        const dateFilter: { gte?: Date; lte?: Date } = {};
        if (startDate) dateFilter.gte = new Date(startDate);
        if (endDate) dateFilter.lte = new Date(endDate);
        const appliedAtFilter = Object.keys(dateFilter).length > 0 ? { appliedAt: dateFilter } : {};

        const [
            totalJobsPosted,
            activeJobs,
            statusCounts,
            sourceCounts,
            profileViewsCount,
            savedCandidatesCount,
            hiredApplications,
            jobPosts,
            recentApps,
            platformSalaryAvg,
        ] = await Promise.all([
            prisma.jobPost.count({ where: { companyId } }),
            prisma.jobPost.count({ where: { companyId, status: 'OPEN' } }),
            prisma.jobApplication.groupBy({
                by: ['status'],
                where: { job: { companyId }, ...appliedAtFilter },
                _count: { id: true },
            }),
            prisma.jobApplication.groupBy({
                by: ['source'],
                where: { job: { companyId }, ...appliedAtFilter },
                _count: { id: true },
            }),
            prisma.profileView.count({
                where: {
                    profileUserId: userId,
                    ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
                },
            }),
            prisma.savedCandidate.count({ where: { employerId: userId } }),
            prisma.jobApplication.findMany({
                where: { job: { companyId }, status: 'HIRED', hiredAt: { not: null } },
                select: { appliedAt: true, hiredAt: true },
            }),
            prisma.jobPost.findMany({
                where: { companyId },
                select: {
                    id: true, title: true, views: true,
                    skillsRequired: true, salaryMin: true, salaryMax: true,
                    _count: { select: { applications: true } },
                },
            }),
            prisma.jobApplication.findMany({
                where: { job: { companyId }, ...appliedAtFilter },
                select: {
                    status: true,
                    updatedAt: true,
                    job: { select: { title: true } },
                    candidate: {
                        select: { user: { select: { firstName: true, lastName: true } } },
                    },
                },
                orderBy: { updatedAt: 'desc' },
                take: 10,
            }),
            prisma.jobPost.aggregate({
                _avg: { salaryMin: true, salaryMax: true },
                where: { salaryMin: { not: null }, status: 'OPEN' },
            }),
        ]);

        // --- Summary ---
        const statusMap = new Map<string, number>();
        for (const sc of statusCounts) {
            statusMap.set(sc.status, sc._count.id);
        }
        const totalApplications = Array.from(statusMap.values()).reduce((a, b) => a + b, 0);
        const hiredCount = statusMap.get('HIRED') || 0;

        // Avg time to hire
        const avgTimeToHireDays = hiredApplications.length > 0
            ? Math.round(
                hiredApplications.reduce((sum, app) => {
                    return sum + (app.hiredAt!.getTime() - app.appliedAt.getTime()) / (1000 * 60 * 60 * 24);
                }, 0) / hiredApplications.length
            )
            : null;

        // Hiring velocity: hires in last 6 months / 6
        const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
        const recentHiresCount = hiredApplications.filter(a => a.hiredAt! >= sixMonthsAgo).length;
        const hiringVelocity = Math.round((recentHiresCount / 6) * 10) / 10;

        const overallHireRate = totalApplications > 0
            ? parseFloat(((hiredCount / totalApplications) * 100).toFixed(1))
            : 0;

        // --- Funnel (cumulative) ---
        const funnel: Record<string, number> = {
            applied: totalApplications,
            viewed: statusMap.get('VIEWED') || 0,
            shortlisted: statusMap.get('SHORTLISTED') || 0,
            interviewScheduled: statusMap.get('INTERVIEW_SCHEDULED') || 0,
            offered: statusMap.get('OFFERED') || 0,
            hired: hiredCount,
            rejected: statusMap.get('REJECTED') || 0,
            withdrawn: statusMap.get('WITHDRAWN') || 0,
        };
        funnel.viewed += funnel.shortlisted + funnel.interviewScheduled + funnel.offered + funnel.hired;
        funnel.shortlisted += funnel.interviewScheduled + funnel.offered + funnel.hired;
        funnel.interviewScheduled += funnel.offered + funnel.hired;
        funnel.offered += funnel.hired;

        // --- Status distribution ---
        const statusDistribution = statusCounts.map(sc => ({
            status: sc.status,
            count: sc._count.id,
        }));

        // --- Source distribution ---
        const sourceDistribution = sourceCounts.map(sc => ({
            source: sc.source || 'DIRECT',
            count: sc._count.id,
        }));

        // --- Top skills in demand ---
        const skillFrequency = new Map<string, number>();
        for (const job of jobPosts) {
            for (const skill of job.skillsRequired) {
                skillFrequency.set(skill, (skillFrequency.get(skill) || 0) + 1);
            }
        }
        const topSkillsInDemand = Array.from(skillFrequency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15)
            .map(([skill, count]) => ({ skill, count }));

        // --- Salary competitiveness ---
        const employerSalaries = jobPosts.filter(j => j.salaryMin != null);
        const yourAvg = {
            min: employerSalaries.length > 0
                ? Math.round(employerSalaries.reduce((s, j) => s + j.salaryMin!, 0) / employerSalaries.length)
                : 0,
            max: employerSalaries.length > 0
                ? Math.round(employerSalaries.reduce((s, j) => s + (j.salaryMax || j.salaryMin!), 0) / employerSalaries.length)
                : 0,
        };

        // --- Job performance (top 10 by applications) ---
        // Build from jobPosts _count + per-job hired
        const jobAppsByJob = await prisma.jobApplication.groupBy({
            by: ['jobId'],
            where: { job: { companyId }, status: 'HIRED' },
            _count: { id: true },
        });
        const hiredByJob = new Map<string, number>();
        for (const row of jobAppsByJob) {
            hiredByJob.set(row.jobId, row._count.id);
        }

        const jobPerformance = jobPosts
            .map(job => {
                const apps = job._count.applications;
                const jobHired = hiredByJob.get(job.id) || 0;
                return {
                    jobId: job.id,
                    title: job.title,
                    views: job.views,
                    applications: apps,
                    hiredCount: jobHired,
                    conversionRate: apps > 0 ? parseFloat(((jobHired / apps) * 100).toFixed(1)) : 0,
                };
            })
            .sort((a, b) => b.applications - a.applications)
            .slice(0, 10);

        // --- Recent activity ---
        const recentActivity = recentApps.map(app => ({
            candidateName: `${app.candidate?.user?.firstName || ''} ${app.candidate?.user?.lastName || ''}`.trim() || 'Unknown',
            jobTitle: app.job.title,
            status: app.status,
            date: app.updatedAt.toISOString(),
        }));

        return {
            summary: {
                totalJobsPosted,
                activeJobs,
                totalApplications,
                avgTimeToHireDays,
                overallHireRate,
                profileViews: profileViewsCount,
                savedCandidates: savedCandidatesCount,
                hiringVelocity,
            },
            funnel,
            trends: await buildTrends(companyId, userId, groupBy, dateFilter),
            statusDistribution,
            sourceDistribution,
            topSkillsInDemand,
            salaryCompetitiveness: {
                yourAvg,
                platformAvg: {
                    min: Math.round(platformSalaryAvg._avg.salaryMin || 0),
                    max: Math.round(platformSalaryAvg._avg.salaryMax || 0),
                },
            },
            jobPerformance,
            recentActivity,
        };
    },

    async exportAnalyticsCsv(userId: string, filters: AnalyticsFilters = {}): Promise<string> {
        const analytics = await this.getAnalytics(userId, filters);
        const rows: string[] = [];

        rows.push('Section,Metric,Value');
        rows.push(`Summary,Total Jobs Posted,${analytics.summary.totalJobsPosted}`);
        rows.push(`Summary,Active Jobs,${analytics.summary.activeJobs}`);
        rows.push(`Summary,Total Applications,${analytics.summary.totalApplications}`);
        rows.push(`Summary,Avg Time to Hire (days),${analytics.summary.avgTimeToHireDays ?? 'N/A'}`);
        rows.push(`Summary,Hire Rate,${analytics.summary.overallHireRate}%`);
        rows.push(`Summary,Profile Views,${analytics.summary.profileViews}`);
        rows.push(`Summary,Saved Candidates,${analytics.summary.savedCandidates}`);
        rows.push(`Summary,Hiring Velocity,${analytics.summary.hiringVelocity}/month`);
        rows.push('');

        rows.push('Status,Count');
        for (const s of analytics.statusDistribution) {
            rows.push(`${s.status},${s.count}`);
        }
        rows.push('');

        rows.push('Source,Count');
        for (const s of analytics.sourceDistribution) {
            rows.push(`${s.source},${s.count}`);
        }
        rows.push('');

        rows.push('Period,Applications,Profile Views,Jobs Posted');
        for (const t of analytics.trends) {
            rows.push(`${t.period},${t.applications},${t.profileViews},${t.jobsPosted}`);
        }
        rows.push('');

        rows.push('Skill,Demand Count');
        for (const s of analytics.topSkillsInDemand) {
            rows.push(`"${s.skill}",${s.count}`);
        }
        rows.push('');

        rows.push('Job Title,Views,Applications,Hired,Conversion Rate');
        for (const j of analytics.jobPerformance) {
            rows.push(`"${j.title}",${j.views},${j.applications},${j.hiredCount},${j.conversionRate}%`);
        }

        return rows.join('\n');
    },
};

async function buildTrends(
    companyId: string,
    userId: string,
    groupBy: string,
    dateFilter: { gte?: Date; lte?: Date },
): Promise<Array<{ period: string; applications: number; profileViews: number; jobsPosted: number }>> {
    try {
        const appliedAtFilter = Object.keys(dateFilter).length > 0 ? { appliedAt: dateFilter } : {};
        const createdAtFilter = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

        const [apps, views, jobs] = await Promise.all([
            prisma.jobApplication.findMany({
                where: { job: { companyId }, ...appliedAtFilter },
                select: { appliedAt: true },
                orderBy: { appliedAt: 'asc' },
            }),
            prisma.profileView.findMany({
                where: { profileUserId: userId, ...createdAtFilter },
                select: { createdAt: true },
                orderBy: { createdAt: 'asc' },
            }),
            prisma.jobPost.findMany({
                where: { companyId, ...createdAtFilter },
                select: { createdAt: true },
                orderBy: { createdAt: 'asc' },
            }),
        ]);

        const appsByPeriod = new Map<string, number>();
        const viewsByPeriod = new Map<string, number>();
        const jobsByPeriod = new Map<string, number>();

        for (const app of apps) {
            const key = formatPeriod(app.appliedAt, groupBy);
            appsByPeriod.set(key, (appsByPeriod.get(key) || 0) + 1);
        }
        for (const view of views) {
            const key = formatPeriod(view.createdAt, groupBy);
            viewsByPeriod.set(key, (viewsByPeriod.get(key) || 0) + 1);
        }
        for (const job of jobs) {
            const key = formatPeriod(job.createdAt, groupBy);
            jobsByPeriod.set(key, (jobsByPeriod.get(key) || 0) + 1);
        }

        const allPeriods = new Set([...appsByPeriod.keys(), ...viewsByPeriod.keys(), ...jobsByPeriod.keys()]);
        const sorted = Array.from(allPeriods).sort();

        return sorted.map(period => ({
            period,
            applications: appsByPeriod.get(period) || 0,
            profileViews: viewsByPeriod.get(period) || 0,
            jobsPosted: jobsByPeriod.get(period) || 0,
        }));
    } catch (error) {
        logger.debug('Failed to build employer analytics trends');
        return [];
    }
}

function formatPeriod(date: Date, groupBy: string): string {
    const d = new Date(date);
    if (groupBy === 'day') return d.toISOString().slice(0, 10);
    if (groupBy === 'month') return d.toISOString().slice(0, 7);
    // week: use Monday of that week
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    return `W${monday.toISOString().slice(0, 10)}`;
}
