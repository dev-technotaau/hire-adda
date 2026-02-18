import { prisma } from '../config/prisma';
import { AppError } from '../middleware/error';
import { CompanyProfile } from '@prisma/client';
import { uploadImage, uploadOptions } from '../config/cloudinary';
import { searchService } from './search.service';

export class EmployerService {
    /**
     * Get company profile by User ID (Employer)
     */
    async getProfile(userId: string) {
        const profile = await prisma.companyProfile.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                        avatar: true,
                    },
                },
            },
        });

        // Unlike candidate, if company profile doesn't exist, we might just return null
        // But for consistency let's throw 404 or handle in controller
        if (!profile) {
            throw new AppError('Company profile not found', 404);
        }

        return profile;
    }

    /**
     * Create or Update Company Profile
     */
    async updateProfile(userId: string, data: Partial<CompanyProfile>) {
        // Strip non-updatable fields and JSON fields that need null-safe handling
        const {
            id: _id, userId: _uid, createdAt: _ca, updatedAt: _ua,
            socialLinks, structuredPerks, workplacePolicies, awardsRecognitions,
            leadershipTeam, employeeTestimonials, officePhotos,
            ...rest
        } = data;
        const safeData = {
            ...rest,
            ...(socialLinks !== undefined ? { socialLinks: socialLinks ?? undefined } : {}),
            ...(structuredPerks !== undefined ? { structuredPerks: structuredPerks ?? undefined } : {}),
            ...(workplacePolicies !== undefined ? { workplacePolicies: workplacePolicies ?? undefined } : {}),
            ...(awardsRecognitions !== undefined ? { awardsRecognitions: awardsRecognitions ?? undefined } : {}),
            ...(leadershipTeam !== undefined ? { leadershipTeam: leadershipTeam ?? undefined } : {}),
            ...(employeeTestimonials !== undefined ? { employeeTestimonials: employeeTestimonials ?? undefined } : {}),
            ...(officePhotos !== undefined ? { officePhotos: officePhotos ?? undefined } : {}),
        };

        const profile = await prisma.companyProfile.upsert({
            where: { userId },
            create: {
                userId,
                companyName: safeData.companyName || 'My Company',
                ...safeData,
            },
            update: safeData,
        });

        // Index in Elasticsearch
        searchService.indexEmployer(profile).catch(err => console.error('Failed to index employer', err));

        // Trigger geocoding if address fields changed
        const geoAddress = [data.city, data.state, data.country, data.headquarters].filter(Boolean).join(', ');
        if (geoAddress) {
            import('../jobs/geocoding.queue').then(({ addGeocodingJob }) =>
                addGeocodingJob({ entityType: 'company', entityId: profile.id, address: geoAddress })
            ).catch(() => {});
        }

        return profile;
    }

    /**
     * Get dashboard analytics for employer
     */
    async getDashboardAnalytics(userId: string) {
        const companyProfile = await prisma.companyProfile.findUnique({ where: { userId }, select: { id: true } });
        if (!companyProfile) throw new AppError('Company profile not found', 404);

        const [totalJobs, activeJobs, totalApplications, recentApplications, statusCounts, savedCandidatesCount, savedSearchesCount, profileViewsCount, company] = await prisma.$transaction([
            prisma.jobPost.count({ where: { companyId: companyProfile.id } }),
            prisma.jobPost.count({ where: { companyId: companyProfile.id, status: 'OPEN' } }),
            prisma.jobApplication.count({ where: { job: { companyId: companyProfile.id } } }),
            prisma.jobApplication.findMany({
                where: { job: { companyId: companyProfile.id } },
                include: {
                    candidate: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
                    job: { select: { title: true } }
                },
                take: 10, orderBy: { appliedAt: 'desc' }
            }),
            prisma.jobApplication.groupBy({
                by: ['status'], where: { job: { companyId: companyProfile.id } }, orderBy: { status: 'asc' }, _count: true
            }),
            prisma.savedCandidate.count({ where: { employerId: userId } }),
            prisma.savedSearch.count({ where: { userId } }),
            prisma.profileView.count({ where: { profileUserId: userId } }),
            prisma.companyProfile.findUnique({ where: { userId }, select: { isVerified: true, gstNumber: true } }),
        ]);

        // Calculate views from all jobs this week
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const viewsThisWeek = await prisma.jobPost.aggregate({
            where: { companyId: companyProfile.id, updatedAt: { gte: weekAgo } }, _sum: { views: true }
        });

        return {
            totalJobs, activeJobs, totalApplications,
            applicationsByStatus: Object.fromEntries(statusCounts.map(s => [s.status, s._count])),
            recentApplications,
            viewsThisWeek: viewsThisWeek._sum.views || 0,
            savedCandidatesCount,
            savedSearchesCount,
            profileViewsCount,
            verification: { isVerified: company?.isVerified || false, gstNumber: company?.gstNumber || null },
        };
    }

    /**
     * Get Engagement Metrics (Time-to-Hire, Funnel, Conversion Rates)
     */
    async getEngagementMetrics(userId: string) {
        const companyProfile = await prisma.companyProfile.findUnique({
            where: { userId },
            select: { id: true }
        });
        if (!companyProfile) throw new AppError('Company profile not found', 404);

        // Time-to-hire: avg days from appliedAt to hiredAt for HIRED applications
        const hiredApplications = await prisma.jobApplication.findMany({
            where: {
                job: { companyId: companyProfile.id },
                status: 'HIRED',
                hiredAt: { not: null },
            },
            select: { appliedAt: true, hiredAt: true },
        });

        const avgTimeToHireDays = hiredApplications.length > 0
            ? Math.round(
                hiredApplications.reduce((sum, app) => {
                    return sum + (app.hiredAt!.getTime() - app.appliedAt.getTime()) / (1000 * 60 * 60 * 24);
                }, 0) / hiredApplications.length
            )
            : null;

        // Funnel counts by status
        const statusCounts = await prisma.jobApplication.groupBy({
            by: ['status'],
            where: { job: { companyId: companyProfile.id } },
            _count: true,
        });
        const statusMap: Record<string, number> = {};
        statusCounts.forEach(s => { statusMap[s.status] = s._count; });
        const totalApps = Object.values(statusMap).reduce((a, b) => a + b, 0);

        const funnel = {
            applied: totalApps,
            viewed: statusMap['VIEWED'] || 0,
            shortlisted: statusMap['SHORTLISTED'] || 0,
            interviewScheduled: statusMap['INTERVIEW_SCHEDULED'] || 0,
            offered: statusMap['OFFERED'] || 0,
            hired: statusMap['HIRED'] || 0,
            rejected: statusMap['REJECTED'] || 0,
            withdrawn: statusMap['WITHDRAWN'] || 0,
        };

        // Conversion rates
        const pct = (num: number, den: number) => den > 0 ? parseFloat(((num / den) * 100).toFixed(1)) : 0;
        const conversions = {
            appliedToViewed: pct(funnel.viewed, totalApps),
            viewedToShortlisted: pct(funnel.shortlisted, funnel.viewed || totalApps),
            shortlistedToInterview: pct(funnel.interviewScheduled, funnel.shortlisted),
            interviewToOffered: pct(funnel.offered, funnel.interviewScheduled || funnel.shortlisted),
            offeredToHired: pct(funnel.hired, funnel.offered),
            overallHireRate: pct(funnel.hired, totalApps),
        };

        // Hiring velocity: hires in last 6 months
        const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
        const recentHires = await prisma.jobApplication.count({
            where: {
                job: { companyId: companyProfile.id },
                status: 'HIRED',
                hiredAt: { gte: sixMonthsAgo },
            },
        });
        const hiringVelocity = Math.round((recentHires / 6) * 10) / 10;

        return {
            avgTimeToHireDays,
            funnel,
            conversions,
            hiringVelocity,
            totalHires: hiredApplications.length,
        };
    }

    /**
     * Upload Company Logo
     */
    async uploadLogo(userId: string, file: Express.Multer.File) {
        const uploadResult = await uploadImage(profileImageBufferOrPath(file), uploadOptions.companyLogo);

        const profile = await prisma.companyProfile.upsert({
            where: { userId },
            create: {
                userId,
                companyName: 'My Company',
                logo: uploadResult.secure_url,
            },
            update: {
                logo: uploadResult.secure_url,
            },
        });

        return profile;
    }

    /**
     * Remove Company Logo
     */
    async removeLogo(userId: string) {
        await prisma.companyProfile.update({
            where: { userId },
            data: { logo: null },
        });
    }
}

// Helper (Shared with Candidate Service, ideally moved to utils)
const profileImageBufferOrPath = (file: Express.Multer.File): string | Buffer => {
    return file.buffer;
};

export const employerService = new EmployerService();
