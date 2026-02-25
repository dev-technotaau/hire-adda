import { prisma } from '../config/prisma';
import logger from '../config/logger';
import { AppError } from '../middleware/error';
import type { CompanyProfile } from '@prisma/client';
import { uploadImage, uploadOptions, deleteImage, extractPublicId } from '../config/cloudinary';
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
      id: _id,
      userId: _uid,
      createdAt: _ca,
      updatedAt: _ua,
      socialLinks,
      structuredPerks,
      workplacePolicies,
      awardsRecognitions,
      leadershipTeam,
      employeeTestimonials,
      officePhotos,
      notificationPreferences,
      ...rest
    } = data;
    const safeData = {
      ...rest,
      ...(socialLinks !== undefined ? { socialLinks: socialLinks ?? undefined } : {}),
      ...(structuredPerks !== undefined ? { structuredPerks: structuredPerks ?? undefined } : {}),
      ...(workplacePolicies !== undefined
        ? { workplacePolicies: workplacePolicies ?? undefined }
        : {}),
      ...(awardsRecognitions !== undefined
        ? { awardsRecognitions: awardsRecognitions ?? undefined }
        : {}),
      ...(leadershipTeam !== undefined ? { leadershipTeam: leadershipTeam ?? undefined } : {}),
      ...(employeeTestimonials !== undefined
        ? { employeeTestimonials: employeeTestimonials ?? undefined }
        : {}),
      ...(officePhotos !== undefined ? { officePhotos: officePhotos ?? undefined } : {}),
      ...(notificationPreferences !== undefined
        ? { notificationPreferences: notificationPreferences ?? undefined }
        : {}),
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
    searchService
      .indexEmployer(profile)
      .catch((err) => logger.error('Failed to index employer', err));

    // Trigger geocoding if address fields changed
    const geoAddress = [data.city, data.state, data.country, data.headquarters]
      .filter(Boolean)
      .join(', ');
    if (geoAddress) {
      import('../jobs/geocoding.queue')
        .then(({ addGeocodingJob }) =>
          addGeocodingJob({ entityType: 'company', entityId: profile.id, address: geoAddress })
        )
        .catch(() => {});
    }

    return profile;
  }

  /**
   * Get dashboard analytics for employer
   */
  async getDashboardAnalytics(userId: string) {
    const companyProfile = await prisma.companyProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!companyProfile) throw new AppError('Company profile not found', 404);

    const [
      totalJobs,
      activeJobs,
      totalApplications,
      recentApplications,
      statusCounts,
      savedCandidatesCount,
      savedSearchesCount,
      profileViewsCount,
      company,
    ] = await prisma.$transaction([
      prisma.jobPost.count({ where: { companyId: companyProfile.id } }),
      prisma.jobPost.count({ where: { companyId: companyProfile.id, status: 'OPEN' } }),
      prisma.jobApplication.count({ where: { job: { companyId: companyProfile.id } } }),
      prisma.jobApplication.findMany({
        where: { job: { companyId: companyProfile.id } },
        include: {
          candidate: {
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
          },
          job: { select: { title: true } },
        },
        take: 10,
        orderBy: { appliedAt: 'desc' },
      }),
      prisma.jobApplication.groupBy({
        by: ['status'],
        where: { job: { companyId: companyProfile.id } },
        orderBy: { status: 'asc' },
        _count: true,
      }),
      prisma.savedCandidate.count({ where: { employerId: userId } }),
      prisma.savedSearch.count({ where: { userId } }),
      prisma.profileView.count({ where: { profileUserId: userId } }),
      prisma.companyProfile.findUnique({
        where: { userId },
        select: { isVerified: true, gstNumber: true },
      }),
    ]);

    // Calculate views from all jobs this week
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const viewsThisWeek = await prisma.jobPost.aggregate({
      where: { companyId: companyProfile.id, updatedAt: { gte: weekAgo } },
      _sum: { views: true },
    });

    return {
      totalJobs,
      activeJobs,
      totalApplications,
      applicationsByStatus: Object.fromEntries(statusCounts.map((s) => [s.status, s._count])),
      recentApplications,
      viewsThisWeek: viewsThisWeek._sum.views || 0,
      savedCandidatesCount,
      savedSearchesCount,
      profileViewsCount,
      verification: {
        isVerified: company?.isVerified || false,
        gstNumber: company?.gstNumber || null,
      },
    };
  }

  /**
   * Get Engagement Metrics (Time-to-Hire, Funnel, Conversion Rates)
   */
  async getEngagementMetrics(userId: string) {
    const companyProfile = await prisma.companyProfile.findUnique({
      where: { userId },
      select: { id: true },
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

    const avgTimeToHireDays =
      hiredApplications.length > 0
        ? Math.round(
            hiredApplications.reduce((sum, app) => {
              return (
                sum + (app.hiredAt!.getTime() - app.appliedAt.getTime()) / (1000 * 60 * 60 * 24)
              );
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
    statusCounts.forEach((s) => {
      statusMap[s.status] = s._count;
    });
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
    const pct = (num: number, den: number) =>
      den > 0 ? parseFloat(((num / den) * 100).toFixed(1)) : 0;
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
    // Fetch old logo URL for cleanup
    const existing = await prisma.companyProfile.findUnique({
      where: { userId },
      select: { logo: true },
    });

    const uploadResult = await uploadImage(
      profileImageBufferOrPath(file),
      uploadOptions.companyLogo
    );

    // Delete old logo from Cloudinary
    if (existing?.logo) {
      const oldPublicId = extractPublicId(existing.logo);
      if (oldPublicId) deleteImage(oldPublicId).catch(() => {});
    }

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
    // Fetch current logo URL for cleanup
    const existing = await prisma.companyProfile.findUnique({
      where: { userId },
      select: { logo: true },
    });

    await prisma.companyProfile.update({
      where: { userId },
      data: { logo: null },
    });

    // Delete from Cloudinary
    if (existing?.logo) {
      const publicId = extractPublicId(existing.logo);
      if (publicId) deleteImage(publicId).catch(() => {});
    }
  }

  /**
   * Get company profile completeness percentage
   */
  async getProfileCompleteness(userId: string) {
    const profile = await prisma.companyProfile.findUnique({
      where: { userId },
      select: {
        companyName: true,
        companyType: true,
        tagline: true,
        logo: true,
        coverImage: true,
        industry: true,
        companySize: true,
        description: true,
        whyWorkForUs: true,
        website: true,
        foundedYear: true,
        gstNumber: true,
        cinNumber: true,
        benefits: true,
        techStack: true,
        productsServices: true,
        specialties: true,
        companyCulture: true,
        missionStatement: true,
        coreValues: true,
        socialLinks: true,
        contactEmail: true,
        contactPhone: true,
        contactPersonName: true,
        headquarters: true,
        locations: true,
        addressLine1: true,
        city: true,
        state: true,
        pincode: true,
        leadershipTeam: true,
        employeeTestimonials: true,
        officePhotos: true,
        interviewProcess: true,
        awardsRecognitions: true,
        companyVideoUrl: true,
        careersPageUrl: true,
        diversityStatement: true,
      },
    });
    if (!profile) return { percentage: 0, completed: [], missing: ['Create your company profile'] };

    const checks = [
      {
        field: 'Company Basics',
        weight: 15,
        check: !!(
          profile.companyName &&
          profile.industry &&
          profile.companyType &&
          profile.companySize
        ),
      },
      {
        field: 'Company Description',
        weight: 12,
        check: !!(profile.description && profile.description.length >= 50),
      },
      { field: 'Logo & Branding', weight: 8, check: !!profile.logo },
      { field: 'Website & Links', weight: 8, check: !!profile.website },
      {
        field: 'Contact Info',
        weight: 10,
        check: !!(profile.contactEmail && profile.contactPhone && profile.contactPersonName),
      },
      {
        field: 'Office Location',
        weight: 8,
        check: !!(profile.headquarters || (profile.addressLine1 && profile.city && profile.state)),
      },
      {
        field: 'Why Work For Us',
        weight: 8,
        check: !!(profile.whyWorkForUs && profile.whyWorkForUs.length >= 30),
      },
      { field: 'Benefits & Perks', weight: 7, check: profile.benefits.length > 0 },
      {
        field: 'Culture & Values',
        weight: 6,
        check: !!(
          profile.companyCulture ||
          profile.missionStatement ||
          profile.coreValues.length > 0
        ),
      },
      {
        field: 'Social Profiles',
        weight: 5,
        check: !!(
          profile.socialLinks &&
          Object.values(profile.socialLinks as Record<string, string>).some((v) => !!v)
        ),
      },
      {
        field: 'Tech Stack / Products',
        weight: 4,
        check: !!(profile.techStack.length > 0 || profile.productsServices.length > 0),
      },
      {
        field: 'Registration (GST/CIN)',
        weight: 3,
        check: !!(profile.gstNumber || profile.cinNumber),
      },
      {
        field: 'Team & Testimonials',
        weight: 3,
        check: !!(
          (profile.leadershipTeam as any[])?.length > 0 ||
          (profile.employeeTestimonials as any[])?.length > 0
        ),
      },
      {
        field: 'Media & Photos',
        weight: 3,
        check: !!(
          profile.coverImage ||
          (profile.officePhotos as any[])?.length > 0 ||
          profile.companyVideoUrl
        ),
      },
    ];

    const completed = checks.filter((c) => c.check).map((c) => c.field);
    const missing = checks.filter((c) => !c.check).map((c) => c.field);
    const percentage = checks.reduce((acc, c) => acc + (c.check ? c.weight : 0), 0);

    return { percentage, completed, missing };
  }
}

// Helper (Shared with Candidate Service, ideally moved to utils)
const profileImageBufferOrPath = (file: Express.Multer.File): string | Buffer => {
  return file.buffer;
};

export const employerService = new EmployerService();
