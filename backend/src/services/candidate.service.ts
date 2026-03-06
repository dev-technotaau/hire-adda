import { prisma } from '../config/prisma';
import logger from '../config/logger';
import { AppError } from '../middleware/error';
import type { CandidateProfile } from '@prisma/client';
import { uploadImage, uploadOptions, deleteImage, extractPublicId } from '../config/cloudinary';
import { searchService } from './search.service';
import { PAGINATION } from '@/constants';
import { publishEvent, KafkaTopics } from '../kafka/producer';
import { trackEvent, getClientId } from './analytics.service';
import { moderationService } from './moderation.service';

export class CandidateService {
  /**
   * Get candidate profile by User ID
   */
  async getProfile(userId: string) {
    const profile = await prisma.candidateProfile.findUnique({
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

    if (!profile) {
      throw new AppError('Candidate profile not found', 404);
    }

    return profile;
  }

  /**
   * Create or Update Candidate Profile
   */
  async updateProfile(userId: string, data: Partial<CandidateProfile>) {
    // Content moderation screening for text fields
    const screenableFields = [data.bio, data.headline].filter(Boolean).join(' ');
    if (screenableFields) {
      const modResult = moderationService.screenContent(screenableFields);
      if (modResult.severity === 'high' || modResult.severity === 'medium') {
        throw new AppError(
          'Profile content contains prohibited terms. Please revise your bio or headline.',
          400,
          'CONTENT_FLAGGED'
        );
      }
    }

    const profile = await prisma.candidateProfile.upsert({
      where: { userId },
      create: {
        userId,
        ...(data as any),
      },
      update: {
        ...(() => {
          const { userId: _userId, ...rest } = data as any;
          return rest;
        })(),
      },
      include: { user: true },
    });

    // INDEXING
    if (profile) {
      searchService
        .indexCandidate(profile)
        .catch((err: unknown) => logger.error('Failed to index candidate', err));
    }

    // Update cached completeness score
    const completeness = await this.getProfileCompleteness(userId);
    if (completeness.percentage !== profile.profileCompleteness) {
      await prisma.candidateProfile.update({
        where: { userId },
        data: { profileCompleteness: completeness.percentage },
      });

      // GA4: track profile_completed when 100%
      if (completeness.percentage >= 100) {
        trackEvent(getClientId(userId), {
          name: 'profile_completed',
          params: { completeness: 100 },
        }).catch(() => {});
      }
    }

    // Trigger geocoding if location fields changed
    const locationAddress = [data.currentLocation, data.city, data.state, data.country]
      .filter(Boolean)
      .join(', ');
    if (locationAddress) {
      import('../jobs/geocoding.queue')
        .then(({ addGeocodingJob }) =>
          addGeocodingJob({ entityType: 'candidate', entityId: userId, address: locationAddress })
        )
        .catch(() => {});
    }

    // Trigger job matching
    try {
      const { matchingQueue } = await import('../jobs/matching.queue');
      await matchingQueue.add('match-jobs', { userId });
    } catch (err) {
      logger.error('Failed to enqueue matching job', err);
    }

    // Publish Kafka event
    publishEvent(KafkaTopics.PROFILE_UPDATED, userId, { userId, profileId: profile.id });

    return profile;
  }

  /**
   * Upload Resume to R2
   */
  async uploadResume(userId: string, file: Express.Multer.File) {
    const { uploadFileToR2, extractR2KeyFromUrl, deleteFileFromR2 } =
      await import('./storage.service');

    // Delete old resume from R2 if it exists
    const existing = await prisma.candidateProfile.findUnique({
      where: { userId },
      select: { resume: true, generatedResumeUrl: true },
    });
    if (existing?.resume && existing.resume !== existing.generatedResumeUrl) {
      const oldKey = extractR2KeyFromUrl(existing.resume);
      if (oldKey) deleteFileFromR2(oldKey).catch(() => {});
    }

    const { url } = await uploadFileToR2(file.buffer, file.originalname, 'resumes', file.mimetype);

    const profile = await prisma.candidateProfile.upsert({
      where: { userId },
      create: {
        userId,
        resume: url,
        resumeOriginalName: file.originalname,
        resumeSize: file.size,
        resumeMimeType: file.mimetype,
        resumeUploadedAt: new Date(),
      },
      update: {
        resume: url,
        resumeOriginalName: file.originalname,
        resumeSize: file.size,
        resumeMimeType: file.mimetype,
        resumeUploadedAt: new Date(),
      },
      include: { user: true },
    });

    // Sync with Search
    if (profile) {
      searchService
        .indexCandidate(profile)
        .catch((err: unknown) => logger.error('Failed to index candidate (resume upload)', err));
    }

    // GA4: track resume_uploaded
    trackEvent(getClientId(userId), { name: 'resume_uploaded' }).catch(() => {});

    return profile;
  }

  /**
   * Upload Profile Image (Avatar)
   */
  async uploadProfileImage(userId: string, file: Express.Multer.File) {
    // Fetch old image URL before uploading new one
    const existing = await prisma.candidateProfile.findUnique({
      where: { userId },
      select: { profileImage: true },
    });

    const uploadResult = await uploadImage(
      profileImageBufferOrPath(file),
      uploadOptions.profileImage
    );

    // Delete old image from Cloudinary
    if (existing?.profileImage) {
      const oldPublicId = extractPublicId(existing.profileImage);
      if (oldPublicId) deleteImage(oldPublicId).catch(() => {});
    }

    // Transaction to ensure both update
    const [candidateProfile] = await prisma.$transaction([
      prisma.candidateProfile.upsert({
        where: { userId },
        create: {
          userId,
          profileImage: uploadResult.secure_url,
        },
        update: {
          profileImage: uploadResult.secure_url,
        },
        include: { user: true },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { avatar: uploadResult.secure_url },
      }),
    ]);

    // Sync with Search
    if (candidateProfile) {
      searchService
        .indexCandidate(candidateProfile)
        .catch((err: unknown) => logger.error('Failed to index candidate (image upload)', err));
    }

    return candidateProfile;
  }

  /**
   * Remove Profile Image (Avatar)
   */
  async removeProfileImage(userId: string) {
    // Fetch current image URL for cleanup
    const existing = await prisma.candidateProfile.findUnique({
      where: { userId },
      select: { profileImage: true },
    });

    await prisma.$transaction([
      prisma.candidateProfile.update({
        where: { userId },
        data: { profileImage: null },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { avatar: null },
      }),
    ]);

    // Delete from Cloudinary
    if (existing?.profileImage) {
      const publicId = extractPublicId(existing.profileImage);
      if (publicId) deleteImage(publicId).catch(() => {});
    }
  }

  /**
   * Delete Resume (both uploaded and generated)
   */
  async deleteResume(userId: string, resumeType: 'uploaded' | 'generated' | 'both' = 'both') {
    const { extractR2KeyFromUrl, deleteFileFromR2 } = await import('./storage.service');

    // Fetch current resume URLs for cleanup
    const existing = await prisma.candidateProfile.findUnique({
      where: { userId },
      select: {
        resume: true,
        generatedResumeUrl: true,
        resumeOriginalName: true,
      },
    });

    if (!existing) {
      throw new AppError('Candidate profile not found', 404);
    }

    // Determine which resumes to delete
    const deleteUploadedResume = resumeType === 'uploaded' || resumeType === 'both';
    const deleteGeneratedResume = resumeType === 'generated' || resumeType === 'both';

    const updateData: any = {};

    // Handle uploaded resume deletion
    if (deleteUploadedResume && existing.resume) {
      const isGeneratedResume = existing.resume === existing.generatedResumeUrl;

      if (!isGeneratedResume) {
        // It's a manually uploaded resume - delete from R2
        const resumeKey = extractR2KeyFromUrl(existing.resume);
        if (resumeKey) deleteFileFromR2(resumeKey).catch(() => {});

        // Clear uploaded resume fields
        updateData.resume = null;
        updateData.resumeOriginalName = null;
        updateData.resumeSize = null;
        updateData.resumeMimeType = null;
        updateData.resumeUploadedAt = null;
      } else if (resumeType === 'uploaded' && isGeneratedResume) {
        // User wants to delete "active" resume which is generated - just clear the reference
        updateData.resume = null;
      }
    }

    // Handle generated resume deletion
    if (deleteGeneratedResume && existing.generatedResumeUrl) {
      const generatedKey = extractR2KeyFromUrl(existing.generatedResumeUrl);
      if (generatedKey) deleteFileFromR2(generatedKey).catch(() => {});

      updateData.generatedResumeUrl = null;
      updateData.generatedResumeAt = null;

      // If active resume is the generated one, clear it too
      if (existing.resume === existing.generatedResumeUrl) {
        updateData.resume = null;
      }
    }

    // Update database
    const profile = await prisma.candidateProfile.update({
      where: { userId },
      data: updateData,
      include: { user: true },
    });

    // Sync with Elasticsearch
    if (profile) {
      searchService
        .indexCandidate(profile)
        .catch((err: unknown) => logger.error('Failed to index candidate (resume deletion)', err));
    }

    // GA4: track resume_deleted
    trackEvent(getClientId(userId), {
      name: 'resume_deleted',
      params: { resumeType },
    }).catch(() => {});

    // Publish Kafka event
    publishEvent(KafkaTopics.PROFILE_UPDATED, userId, {
      userId,
      profileId: profile.id,
      action: 'resume_deleted',
      resumeType,
    });

    return profile;
  }

  /**
   * Search Candidates (Employer Only)
   */
  async searchCandidates(
    query: string,
    filters: {
      skills?: string[];
      location?: string;
      excludeLocation?: string[];
      experienceMin?: number;
      experienceMax?: number;
      salaryMin?: number;
      salaryMax?: number;
      salaryCurrency?: string;
      includeSalaryNotDisclosed?: boolean;
      keyword?: string;
      keywordScope?: string;
      excludeKeywords?: string[];
      workStatus?: string;
      noticePeriod?: string;
      servingNoticePeriod?: boolean;
      gender?: string;
      willingToRelocate?: boolean;
      preferredWorkMode?: string;
      preferredJobType?: string;
      lastActiveWithin?: string;
      currentIndustry?: string;
      currentCompany?: string;
      excludeCompany?: string[];
      designation?: string;
      department?: string;
      ageMin?: number;
      ageMax?: number;
      hasCareerBreak?: boolean;
      hasResume?: boolean;
      verifiedMobile?: boolean;
      verifiedEmail?: boolean;
      registeredAfter?: string;
      modifiedAfter?: string;
      education?: string;
      certifications?: string;
      disabilityType?: string;
      openToWork?: string;
      category?: string;
      isVeteran?: string;
      careerBreakType?: string;
      keywordOperator?: string;
      itSkill?: string;
      workPermit?: string;
      educationLevel?: string;
      experienceLevel?: string;
      highestEducationLevel?: string;
      drivingLicenseType?: string;
      functionalArea?: string;
      latitude?: number;
      longitude?: number;
      radiusKm?: number;
      sortBy?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters.page || PAGINATION.DEFAULT_PAGE;
    const cappedLimit = Math.min(filters.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * cappedLimit;

    // 1. Try Elasticsearch — only when actual search criteria exist (not just page/limit/sortBy)
    const ignoreKeys = new Set(['page', 'limit', 'sortBy']);
    const hasSearchCriteria = Object.entries(filters).some(
      ([key, val]) => !ignoreKeys.has(key) && val !== undefined && val !== null && val !== '',
    );
    if (query || hasSearchCriteria) {
      try {
        const { hits, total, facets } = await searchService.searchCandidates(query || filters.keyword, {
          ...filters,
          from: skip,
          size: cappedLimit,
        });

        return {
          candidates: hits,
          pagination: {
            total,
            page,
            limit: cappedLimit,
            pages: Math.ceil(total / cappedLimit),
          },
          facets,
        };
      } catch (error) {
        logger.warn('Elasticsearch candidate search failed, falling back to DB', error);
      }
    }

    // 2. Prisma DB fallback — used when no search criteria or when ES fails
    {

      const where: any = {};

      if (filters.keyword) {
        const kw = filters.keyword;
        const scopeMap: Record<string, any[]> = {
          all: [
            { user: { firstName: { contains: kw, mode: 'insensitive' } } },
            { user: { lastName: { contains: kw, mode: 'insensitive' } } },
            { bio: { contains: kw, mode: 'insensitive' } },
            { headline: { contains: kw, mode: 'insensitive' } },
            { currentRole: { contains: kw, mode: 'insensitive' } },
            { currentCompany: { contains: kw, mode: 'insensitive' } },
          ],
          title: [
            { headline: { contains: kw, mode: 'insensitive' } },
            { currentRole: { contains: kw, mode: 'insensitive' } },
          ],
          skills: [], // skills are string[] — handled by hasSome below
          designation: [
            { currentRole: { contains: kw, mode: 'insensitive' } },
            { headline: { contains: kw, mode: 'insensitive' } },
          ],
          company: [{ currentCompany: { contains: kw, mode: 'insensitive' } }],
        };
        const scope = filters.keywordScope || 'all';
        if (scope === 'skills') {
          // For skills scope, add keyword as a skill filter
          where.skills = { ...where.skills, hasSome: [kw] };
        } else {
          where.OR = scopeMap[scope] || scopeMap.all;
        }
      }
      if (filters.location) {
        where.currentLocation = { contains: filters.location, mode: 'insensitive' };
      }
      if (filters.excludeLocation && filters.excludeLocation.length > 0) {
        const locNots = filters.excludeLocation.map((loc: string) => ({
          currentLocation: { contains: loc, mode: 'insensitive' as const },
        }));
        where.NOT = [...(where.NOT || []), ...locNots];
      }
      if (filters.experienceMin) {
        where.experienceYears = { ...where.experienceYears, gte: filters.experienceMin };
      }
      if (filters.experienceMax) {
        where.experienceYears = { ...where.experienceYears, lte: filters.experienceMax };
      }
      if (filters.skills && filters.skills.length > 0) {
        where.skills = { ...where.skills, hasSome: filters.skills };
      }
      if (filters.salaryCurrency) {
        where.salaryCurrency = filters.salaryCurrency;
      }
      if (filters.salaryMax) {
        if (filters.includeSalaryNotDisclosed) {
          // Include candidates with matching salary OR those who didn't disclose
          where.OR = [
            ...(where.OR || []),
            { expectedSalaryMin: { lte: filters.salaryMax } },
            { expectedSalaryMin: null },
          ];
        } else {
          where.expectedSalaryMin = { lte: filters.salaryMax };
        }
      }
      if (filters.workStatus) {
        where.workStatus = filters.workStatus;
      }
      if (filters.noticePeriod) {
        where.noticePeriod = filters.noticePeriod;
      }
      if (filters.gender) {
        where.gender = filters.gender;
      }
      if (filters.willingToRelocate !== undefined) {
        where.willingToRelocate = filters.willingToRelocate;
      }
      if (filters.preferredWorkMode) {
        where.preferredWorkMode = { has: filters.preferredWorkMode };
      }
      if (filters.currentIndustry) {
        where.currentIndustry = { contains: filters.currentIndustry, mode: 'insensitive' };
      }
      if (filters.hasCareerBreak !== undefined) {
        where.hasCareerBreak = filters.hasCareerBreak;
      }
      if (filters.disabilityType) {
        where.disabilityType = filters.disabilityType;
      }
      // --- 13 new Naukri Resdex-level filters (DB fallback) ---
      if (filters.excludeKeywords && filters.excludeKeywords.length > 0) {
        where.NOT = filters.excludeKeywords.map((kw: string) => ({
          OR: [
            { headline: { contains: kw, mode: 'insensitive' } },
            { currentRole: { contains: kw, mode: 'insensitive' } },
            { bio: { contains: kw, mode: 'insensitive' } },
          ],
        }));
      }
      if (filters.currentCompany) {
        where.currentCompany = { contains: filters.currentCompany, mode: 'insensitive' };
      }
      if (filters.excludeCompany && filters.excludeCompany.length > 0) {
        const notClauses = filters.excludeCompany.map((c: string) => ({
          currentCompany: { contains: c, mode: 'insensitive' as const },
        }));
        where.NOT = [...(where.NOT || []), ...notClauses];
      }
      if (filters.designation) {
        where.currentRole = { contains: filters.designation, mode: 'insensitive' };
      }
      if (filters.department) {
        where.currentDepartment = { contains: filters.department, mode: 'insensitive' };
      }
      if (filters.ageMin || filters.ageMax) {
        const dobFilter: any = {};
        if (filters.ageMin) {
          // ageMin years old => born before (now - ageMin years)
          const maxDob = new Date();
          maxDob.setFullYear(maxDob.getFullYear() - filters.ageMin);
          dobFilter.lte = maxDob;
        }
        if (filters.ageMax) {
          // ageMax years old => born after (now - ageMax years)
          const minDob = new Date();
          minDob.setFullYear(minDob.getFullYear() - filters.ageMax);
          dobFilter.gte = minDob;
        }
        where.dob = dobFilter;
      }
      if (filters.preferredJobType) {
        where.preferredJobType = { has: filters.preferredJobType };
      }
      if (filters.servingNoticePeriod !== undefined) {
        where.servingNoticePeriod = filters.servingNoticePeriod;
      }
      if (filters.hasResume !== undefined) {
        where.resume = filters.hasResume ? { not: null } : null;
      }
      if (filters.verifiedMobile !== undefined) {
        where.user = { is: { ...where.user?.is, isMobileVerified: filters.verifiedMobile } };
      }
      if (filters.verifiedEmail !== undefined) {
        where.user = { is: { ...where.user?.is, isEmailVerified: filters.verifiedEmail } };
      }
      if (filters.registeredAfter) {
        where.createdAt = { ...where.createdAt, gte: new Date(filters.registeredAfter) };
      }
      if (filters.modifiedAfter) {
        where.updatedAt = { ...where.updatedAt, gte: new Date(filters.modifiedAfter) };
      }
      if (filters.openToWork) {
        where.openToWork = filters.openToWork;
      }
      if (filters.category) {
        where.category = filters.category;
      }
      if (filters.isVeteran === 'true') {
        where.isVeteran = true;
      }
      if (filters.careerBreakType) {
        where.careerBreakType = filters.careerBreakType;
      }

      const [candidates, total] = await prisma.$transaction([
        prisma.candidateProfile.findMany({
          where,
          include: {
            user: {
              select: { id: true, email: true, firstName: true, lastName: true, avatar: true },
            },
          },
          skip,
          take: cappedLimit,
          orderBy: { updatedAt: 'desc' },
        }),
        prisma.candidateProfile.count({ where }),
      ]);

      // Strip raw R2 URLs — employers must use the signed download endpoint
      const sanitized = candidates.map((c) => ({
        ...c,
        resume: c.resume ? true : null,
        generatedResumeUrl: c.generatedResumeUrl ? true : null,
      }));

      const totalPages = Math.ceil(total / cappedLimit) || 1;
      return {
        candidates: sanitized,
        pagination: { total, page, limit: cappedLimit, pages: totalPages },
      };
    }
  }

  /**
   * Get profile completeness percentage
   */
  async getProfileCompleteness(userId: string) {
    const [profile, user] = await prisma.$transaction([
      prisma.candidateProfile.findUnique({
        where: { userId },
        select: {
          // Personal
          gender: true,
          dob: true,
          bio: true,
          nationality: true,
          hometown: true,
          // Contact
          phone: true,
          alternateEmail: true,
          currentLocation: true,
          // Professional
          currentRole: true,
          currentCompany: true,
          experienceYears: true,
          experienceLevel: true,
          currentIndustry: true,
          functionalArea: true,
          // Skills & structured data
          skills: true,
          education: true,
          experience: true,
          certifications: true,
          projects: true,
          languageProficiency: true,
          publications: true,
          patents: true,
          volunteerExperience: true,
          interests: true,
          hobbies: true,
          references: true,
          // Resume & Headline
          resume: true,
          headline: true,
          // Preferences
          preferredWorkMode: true,
          preferredJobType: true,
          willingToRelocate: true,
          noticePeriod: true,
          workStatus: true,
          openToWork: true,
          preferredShift: true,
          preferredIndustries: true,
          preferredRoleCategories: true,
          // Social
          linkedinProfile: true,
          githubProfile: true,
          portfolioUrl: true,
          stackOverflowProfile: true,
          twitterProfile: true,
          personalBlogUrl: true,
          // Documents
          passportNumber: true,
          hasDrivingLicense: true,
          visaStatus: true,
          workPermitStatus: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          firstName: true,
          lastName: true,
          mobileNumber: true,
        },
      }),
    ]);
    if (!profile || !user) {
      return { percentage: 0, completed: [], missing: ['Create your profile'] };
    }

    const checks = [
      {
        field: 'Personal Info',
        weight: 12,
        check: !!(
          user.firstName &&
          user.lastName &&
          (profile.gender || profile.dob || profile.bio || profile.nationality || profile.hometown)
        ),
      },
      {
        field: 'Contact',
        weight: 6,
        check: !!(
          profile.phone ||
          (user as any).mobileNumber ||
          profile.alternateEmail ||
          profile.currentLocation
        ),
      },
      {
        field: 'Professional',
        weight: 12,
        check: !!(
          profile.currentRole ||
          profile.experienceLevel ||
          profile.currentCompany ||
          profile.experienceYears > 0 ||
          profile.currentIndustry ||
          profile.functionalArea
        ),
      },
      { field: 'Skills', weight: 10, check: profile.skills.length > 0 },
      {
        field: 'Education',
        weight: 10,
        check: !!(profile.education && (profile.education as any[]).length > 0),
      },
      {
        field: 'Experience',
        weight: 10,
        check: !!(profile.experience && (profile.experience as any[]).length > 0),
      },
      { field: 'Resume', weight: 5, check: !!profile.resume },
      { field: 'Headline', weight: 5, check: !!profile.headline },
      {
        field: 'Preferences',
        weight: 5,
        check: !!(
          profile.preferredWorkMode.length > 0 ||
          profile.preferredJobType.length > 0 ||
          profile.willingToRelocate === true ||
          profile.noticePeriod ||
          profile.workStatus ||
          profile.openToWork ||
          profile.preferredShift ||
          profile.preferredIndustries.length > 0 ||
          profile.preferredRoleCategories.length > 0
        ),
      },
      {
        field: 'Certifications/Projects',
        weight: 5,
        check: !!(
          (profile.certifications as any[])?.length > 0 || (profile.projects as any[])?.length > 0
        ),
      },
      {
        field: 'Language Proficiency',
        weight: 5,
        check: !!((profile.languageProficiency as any[])?.length > 0),
      },
      {
        field: 'Social Profiles',
        weight: 5,
        check: !!(
          profile.linkedinProfile ||
          profile.githubProfile ||
          profile.portfolioUrl ||
          profile.stackOverflowProfile ||
          profile.twitterProfile ||
          profile.personalBlogUrl
        ),
      },
      {
        field: 'Publications/Patents/Volunteer',
        weight: 3,
        check: !!(
          (profile.publications as any[])?.length ||
          (profile.patents as any[])?.length ||
          (profile.volunteerExperience as any[])?.length
        ),
      },
      {
        field: 'Interests/Hobbies',
        weight: 3,
        check: !!(profile.interests.length > 0 || profile.hobbies.length > 0),
      },
      { field: 'References', weight: 2, check: !!((profile.references as any[])?.length > 0) },
      {
        field: 'Documents',
        weight: 2,
        check: !!(
          profile.passportNumber ||
          profile.hasDrivingLicense ||
          profile.visaStatus ||
          profile.workPermitStatus
        ),
      },
    ];

    const completed = checks.filter((c) => c.check).map((c) => c.field);
    const missing = checks.filter((c) => !c.check).map((c) => c.field);
    const percentage = checks.reduce((acc, c) => acc + (c.check ? c.weight : 0), 0);

    return { percentage, completed, missing };
  }
  /**
   * Get Candidate Dashboard Statistics
   */
  async getCandidateDashboard(userId: string) {
    const [
      user,
      profile,
      applicationStats,
      savedJobsCount,
      profileViewsWeek,
      profileViewsMonth,
      recentApps,
    ] = await prisma.$transaction([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          isEmailVerified: true,
          isMobileVerified: true,
          isWhatsappVerified: true,
          whatsappNumber: true,
          lastActiveAt: true,
          lastLoginAt: true,
        },
      }),
      prisma.candidateProfile.findUnique({
        where: { userId },
        select: { profileCompleteness: true, updatedAt: true },
      }),
      prisma.jobApplication.groupBy({
        by: ['status'],
        where: { candidate: { userId } },
        orderBy: { status: 'asc' },
        _count: { _all: true },
      }),
      prisma.savedJob.count({ where: { userId } }),
      prisma.profileView.count({
        where: {
          profileUserId: userId,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.profileView.count({
        where: {
          profileUserId: userId,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.jobApplication.findMany({
        where: { candidate: { userId } },
        orderBy: { appliedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          status: true,
          appliedAt: true,
          job: {
            select: {
              title: true,
              company: { select: { companyName: true } },
            },
          },
        },
      }),
    ]);

    const totalApplications = applicationStats.reduce(
      (sum, s) => sum + ((s._count as { _all: number })?._all ?? 0),
      0
    );

    return {
      verification: {
        emailVerified: user?.isEmailVerified || false,
        mobileVerified: user?.isMobileVerified || false,
        whatsappVerified: user?.isWhatsappVerified || false,
      },
      profileCompleteness: profile?.profileCompleteness || 0,
      lastProfileModified: profile?.updatedAt || null,
      applications: {
        total: totalApplications,
        byStatus: Object.fromEntries(
          applicationStats.map((s) => [s.status, (s._count as { _all: number })?._all ?? 0])
        ),
      },
      savedJobsCount,
      profileViews: { week: profileViewsWeek, month: profileViewsMonth },
      recentApplications: recentApps.map((a) => ({
        id: a.id,
        jobTitle: a.job.title,
        companyName: a.job.company?.companyName || 'Unknown',
        status: a.status,
        appliedAt: a.appliedAt,
      })),
    };
  }

  /**
   * Get candidate public profile (for employer viewing)
   */
  async getCandidatePublicProfile(idOrUserId: string) {
    const profile = await prisma.candidateProfile.findFirst({
      where: { OR: [{ id: idOrUserId }, { userId: idOrUserId }] },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            isEmailVerified: true,
            isMobileVerified: true,
            isWhatsappVerified: true,
            mobileNumber: true,
            whatsappNumber: true,
            lastActiveAt: true,
          },
        },
      },
    });
    if (!profile) throw new AppError('Candidate not found', 404);

    // Strip raw R2 URLs — employers must use the signed download endpoint
    return {
      ...profile,
      resume: profile.resume ? true : null,
      generatedResumeUrl: profile.generatedResumeUrl ? true : null,
    };
  }
}

// Helper to handle Multer file -> Buffer/Base64 for Cloudinary
const profileImageBufferOrPath = (file: Express.Multer.File): string | Buffer => {
  return file.buffer;
};

export const candidateService = new CandidateService();
