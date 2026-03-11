import { prisma } from '../config/prisma';
import logger from '../config/logger';
import { AppError } from '../middleware/error';
import type {
  JobType,
  WorkMode,
  ShiftType,
  ExperienceLevel,
  EducationLevel,
  SalaryType,
  UrgencyLevel,
  FunctionalArea,
  NoticePeriodPreference,
  SpecificDegree,
  GenderPreference,
  DrivingLicenseType,
  PostingVisibility,
  ApplyMethod,
} from '@prisma/client';
import { Prisma, JobStatus, ApplicationStatus, Role, ScreeningQuestionType } from '@prisma/client';
import { searchService } from './search.service';
import { PAGINATION } from '@/constants';
import { publishEvent, KafkaTopics } from '../kafka/producer';
import { trackEvent, getClientId } from './analytics.service';
import { notificationService } from './notification.service';
import { moderationService } from './moderation.service';
import { talentMatchingService } from './talent-matching.service';

interface ScreeningQuestionInput {
  question: string;
  questionType?: ScreeningQuestionType;
  isRequired?: boolean;
  isDealBreaker?: boolean;
  options?: string[];
  idealAnswer?: string;
  displayOrder?: number;
}

interface ScreeningAnswerInput {
  questionId: string;
  answer: string;
}

interface CreateJobDto {
  title: string;
  description: string;
  requirements?: string;
  benefits?: string;
  keyResponsibilities?: string;
  type: JobType;
  industry?: string;
  department?: string;
  roleCategory?: string;
  location: string;
  isRemote?: boolean;
  workMode?: WorkMode;
  shiftType?: ShiftType;
  experienceMin?: number;
  experienceMax?: number;
  experienceLevel?: ExperienceLevel;
  educationRequired?: EducationLevel;
  preferredEducationField?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  salaryType?: SalaryType;
  salaryDisclosed?: boolean;
  jobPerks?: string[];
  skillsRequired?: string[];
  niceToHaveSkills?: string[];
  certificationsRequired?: string[];
  languagesRequired?: any;
  tags?: string[];
  numberOfOpenings?: number;
  urgencyLevel?: UrgencyLevel;
  isFeatured?: boolean;
  isPremium?: boolean;
  travelRequirementPercent?: number;
  relocationAssistance?: boolean;
  expiresAt?: Date | string;
  applicationDeadline?: Date | string;
  interviewProcess?: string;
  isWalkIn?: boolean;
  walkInDetails?: any;
  contactPerson?: string;
  contactEmail?: string;
  // Enterprise fields
  functionalArea?: FunctionalArea;
  ugRequired?: EducationLevel;
  pgRequired?: EducationLevel;
  specificDegrees?: SpecificDegree[];
  degreeSpecializations?: string[];
  salaryNegotiable?: boolean;
  noticePeriodPreference?: NoticePeriodPreference[];
  isConfidential?: boolean;
  referenceCode?: string;
  additionalLocations?: string[];
  accommodationProvided?: boolean;
  walkInStartDate?: string;
  walkInEndDate?: string;
  walkInTime?: string;
  walkInVenue?: string;
  walkInContactPerson?: string;
  walkInContactPhone?: string;
  walkInInstructions?: string;
  diversityTags?: string[];
  visaSponsorshipAvailable?: boolean;
  backgroundCheckRequired?: boolean;
  isPwdFriendly?: boolean;
  passportRequired?: boolean;
  bondDetails?: string;
  drivingLicenseRequired?: DrivingLicenseType;
  ageMin?: number;
  ageMax?: number;
  genderPreference?: GenderPreference;
  postingVisibility?: PostingVisibility;
  applyMethod?: ApplyMethod;
  externalApplyUrl?: string;
  scheduledPublishAt?: string;
  screeningQuestions?: ScreeningQuestionInput[];
}

interface JobSearchFilters {
  keyword?: string;
  location?: string;
  type?: JobType;
  industry?: string;
  department?: string;
  salaryMin?: number;
  salaryMax?: number;
  experience?: string | number;
  experienceLevel?: ExperienceLevel;
  educationRequired?: EducationLevel;
  isRemote?: boolean;
  workMode?: WorkMode;
  shiftType?: ShiftType;
  companyType?: string;
  companySize?: string;
  postedAfter?: string;
  postedBefore?: string;
  tags?: string[];
  urgencyLevel?: UrgencyLevel;
  isFeatured?: boolean;
  isWalkIn?: boolean;
  sortBy?: 'relevance' | 'date' | 'salary' | 'distance';
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  page?: number;
  limit?: number;
  // Enterprise filters
  functionalArea?: FunctionalArea;
  noticePeriodPreference?: NoticePeriodPreference[];
  isPwdFriendly?: boolean;
  visaSponsorshipAvailable?: boolean;
  genderPreference?: GenderPreference;
  diversityTags?: string[];
  postingVisibility?: PostingVisibility;
}

export class JobService {
  /**
   * Create a new job post
   */
  async createJob(userId: string, data: CreateJobDto) {
    // 1. Get Company Profile ID
    const company = await prisma.companyProfile.findUnique({
      where: { userId },
      select: { id: true, isVerified: true },
    });

    if (!company) {
      throw new AppError(
        'Company profile not found. Please complete your employer profile first.',
        404
      );
    }

    // Content moderation screening
    const contentToScreen = [data.title, data.description, data.requirements]
      .filter(Boolean)
      .join(' ');
    const moderationResult = moderationService.screenContent(contentToScreen);
    if (moderationResult.severity === 'high' || moderationResult.severity === 'medium') {
      throw new AppError(
        `Job content contains prohibited terms: ${moderationResult.flaggedTerms.join(', ')}. Please revise your listing.`,
        400,
        'CONTENT_FLAGGED'
      );
    }

    // Extract screening questions (created separately)
    const { screeningQuestions: sqInput, ...jobData } = data;

    // Convert date strings to Date objects
    const dateFields: Record<string, Date | undefined> = {};
    if (jobData.walkInStartDate) dateFields.walkInStartDate = new Date(jobData.walkInStartDate);
    if (jobData.walkInEndDate) dateFields.walkInEndDate = new Date(jobData.walkInEndDate);
    if (jobData.scheduledPublishAt) {
      dateFields.scheduledPublishAt = new Date(jobData.scheduledPublishAt);
    }

    // If scheduled for future, keep as DRAFT
    const statusOverride = jobData.scheduledPublishAt ? { status: JobStatus.DRAFT } : {};

    const job = await prisma.jobPost.create({
      data: {
        companyId: company.id,
        ...jobData,
        ...dateFields,
        ...statusOverride,
        salaryMin: jobData.salaryMin ? Number(jobData.salaryMin) : undefined,
        salaryMax: jobData.salaryMax ? Number(jobData.salaryMax) : undefined,
        experienceMin: jobData.experienceMin ? Number(jobData.experienceMin) : 0,
        experienceMax: jobData.experienceMax ? Number(jobData.experienceMax) : undefined,
        isRemote: Boolean(jobData.isRemote),
      },
    });

    // Bulk-create screening questions
    if (sqInput && sqInput.length > 0) {
      await prisma.screeningQuestion.createMany({
        data: sqInput.map((q, idx) => ({
          jobId: job.id,
          question: q.question,
          questionType: q.questionType || ScreeningQuestionType.TEXT,
          isRequired: q.isRequired ?? false,
          isDealBreaker: q.isDealBreaker ?? false,
          options: q.options || undefined,
          idealAnswer: q.idealAnswer,
          displayOrder: q.displayOrder ?? idx,
        })),
      });
    }

    // INDEXING: Sync with Elasticsearch
    const jobForIndex = await prisma.jobPost.findUnique({
      where: { id: job.id },
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            logo: true,
            industry: true,
            companyType: true,
            companySize: true,
            isVerified: true,
          },
        },
      },
    });

    if (jobForIndex) {
      searchService
        .indexJob(jobForIndex)
        .catch((err: any) => logger.error('Failed to index job', err));
    }

    // Trigger geocoding if location provided
    if (data.location) {
      import('../jobs/geocoding.queue')
        .then(({ addGeocodingJob }) =>
          addGeocodingJob({ entityType: 'job', entityId: job.id, address: data.location })
        )
        .catch(() => {});
    }

    // Trigger candidate matching
    try {
      const { matchingQueue } = await import('../jobs/matching.queue');
      await matchingQueue.add('match-candidates', { jobId: job.id });
    } catch (err) {
      logger.error('Failed to enqueue matching job', err);
    }

    // Publish Kafka event (enriched for BigQuery analytics)
    publishEvent(KafkaTopics.JOB_POSTED, job.id, {
      jobId: job.id,
      companyId: company.id,
      title: data.title,
      skills: data.skillsRequired || [],
      salary_min: data.salaryMin ? Number(data.salaryMin) : null,
      salary_max: data.salaryMax ? Number(data.salaryMax) : null,
      industry: data.industry || null,
      location: data.location || null,
    });

    // GA4: track job_posted
    trackEvent(getClientId(userId), {
      name: 'job_posted',
      params: { job_id: job.id, job_type: data.type },
    }).catch(() => {});

    // Notify employer (email + in-app)
    notificationService.notifyJobPosted(userId, data.title, job.id).catch(() => {});

    // Sync to Cloud Talent for AI recommendations
    if (jobForIndex) {
      talentMatchingService
        .syncJobToTalent({
          id: jobForIndex.id,
          title: jobForIndex.title,
          description: jobForIndex.description,
          location: jobForIndex.location,
          company: jobForIndex.company
            ? { id: jobForIndex.company.id, companyName: jobForIndex.company.companyName }
            : null,
          skills: (jobForIndex as any).skillsRequired || [],
          jobType: (jobForIndex as any).type || '',
          workMode: (jobForIndex as any).workMode,
          experienceLevel: (jobForIndex as any).experienceLevel,
          industry: (jobForIndex as any).industry,
          salaryMin: (jobForIndex as any).salaryMin ? Number((jobForIndex as any).salaryMin) : null,
          salaryMax: (jobForIndex as any).salaryMax ? Number((jobForIndex as any).salaryMax) : null,
          currency: (jobForIndex as any).currency,
        })
        .catch(() => {});
    }

    // Build suggested candidate search filters from job requirements
    const suggestedFilters = {
      skills: data.skillsRequired || [],
      location: data.location,
      experienceMin: data.experienceMin,
      experienceMax: data.experienceMax,
      experienceLevel: data.experienceLevel,
      educationRequired: data.educationRequired,
      preferredWorkMode: data.workMode,
      preferredJobType: data.type,
      industry: data.industry,
      department: data.department,
      noticePeriod: data.noticePeriodPreference,
      expectedSalaryMax: data.salaryMax ? Number(data.salaryMax) : undefined,
    };

    return { job, suggestedFilters };
  }

  /**
   * Get a single job by ID (and increment views)
   */
  async getJob(id: string) {
    const job = await prisma.jobPost.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            companyType: true,
            logo: true,
            coverImage: true,
            tagline: true,
            industry: true,
            subIndustry: true,
            companySize: true,
            employeeCount: true,
            foundedYear: true,
            website: true,
            headquarters: true,
            city: true,
            state: true,
            locations: true,
            description: true,
            isVerified: true,
            userId: true,
          },
        },
        screeningQuestions: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!job) {
      throw new AppError('Job not found', 404);
    }

    await prisma.jobPost.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    const _hiredCount = await prisma.jobApplication.count({
      where: { jobId: id, status: 'HIRED' },
    });

    return { ...job, _hiredCount };
  }

  /**
   * Search Jobs with Filters (Elasticsearch + Prisma Fallback)
   */
  async searchJobs(filters: JobSearchFilters) {
    const page = filters.page || PAGINATION.DEFAULT_PAGE;
    const limit = filters.limit || PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    // 1. Try Elasticsearch — use ES whenever any filter is set (not just keyword/location)
    const ignoreKeys = new Set(['page', 'limit', 'sortBy']);
    const hasSearchCriteria = Object.entries(filters).some(
      ([key, val]) => !ignoreKeys.has(key) && val !== undefined && val !== null && val !== '',
    );
    if (hasSearchCriteria) {
      try {
        const { hits, total, facets } = await searchService.searchJobs(filters.keyword, {
          ...filters,
          from: skip,
          size: limit,
        });

        return {
          jobs: hits,
          pagination: { total, page, limit, pages: Math.ceil(total / limit) },
          facets: facets || {},
        };
      } catch (error) {
        logger.warn('Elasticsearch failed, falling back to database search', error);
      }
    }

    // 2. Prisma Fallback
    const where: any = { status: JobStatus.OPEN };

    if (filters.keyword) {
      where.OR = [
        { title: { contains: filters.keyword, mode: 'insensitive' } },
        { description: { contains: filters.keyword, mode: 'insensitive' } },
        { company: { companyName: { contains: filters.keyword, mode: 'insensitive' } } },
      ];
    }
    if (filters.location) {
      where.location = { contains: filters.location, mode: 'insensitive' };
    }
    if (filters.type) {
      where.type = filters.type;
    }
    if (filters.industry) {
      where.industry = { contains: filters.industry, mode: 'insensitive' };
    }
    if (filters.isRemote) {
      where.isRemote = true;
    }
    if (filters.workMode) {
      where.workMode = filters.workMode;
    }
    if (filters.shiftType) {
      where.shiftType = filters.shiftType;
    }
    if (filters.experienceLevel) {
      where.experienceLevel = filters.experienceLevel;
    }
    if (filters.educationRequired) {
      where.educationRequired = filters.educationRequired;
    }
    if (filters.salaryMin) {
      where.salaryMax = { ...where.salaryMax, gte: filters.salaryMin };
    }
    if (filters.salaryMax) {
      where.salaryMin = { ...where.salaryMin, lte: filters.salaryMax };
    }
    if (filters.experience !== undefined) {
      const expStr = String(filters.experience);
      const rangeMatch = expStr.match(/^(\d+)-(\d+)$/);
      const plusMatch = expStr.match(/^(\d+)\+$/);
      if (rangeMatch) {
        where.experienceMin = { lte: Number(rangeMatch[2]) };
        where.experienceMax = { gte: Number(rangeMatch[1]) };
      } else if (plusMatch) {
        where.experienceMax = { gte: Number(plusMatch[1]) };
      } else {
        const num = Number(expStr);
        if (!isNaN(num)) where.experienceMin = { lte: num };
      }
    }
    if (filters.urgencyLevel) {
      where.urgencyLevel = filters.urgencyLevel;
    }
    if (filters.isFeatured !== undefined) {
      where.isFeatured = filters.isFeatured;
    }
    if (filters.isWalkIn !== undefined) {
      where.isWalkIn = filters.isWalkIn;
    }
    if (filters.department) {
      where.department = { contains: filters.department, mode: 'insensitive' };
    }
    if (filters.postedAfter) {
      where.createdAt = { ...where.createdAt, gte: new Date(filters.postedAfter) };
    }
    if (filters.postedBefore) {
      where.createdAt = { ...where.createdAt, lte: new Date(filters.postedBefore) };
    }
    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }
    // Enterprise filters (Prisma fallback)
    if (filters.functionalArea) {
      where.functionalArea = filters.functionalArea;
    }
    if (filters.noticePeriodPreference && filters.noticePeriodPreference.length > 0) {
      where.noticePeriodPreference = { hasSome: filters.noticePeriodPreference };
    }
    if (filters.isPwdFriendly !== undefined) {
      where.isPwdFriendly = filters.isPwdFriendly;
    }
    if (filters.visaSponsorshipAvailable !== undefined) {
      where.visaSponsorshipAvailable = filters.visaSponsorshipAvailable;
    }
    if (filters.genderPreference) {
      where.genderPreference = filters.genderPreference;
    }
    if (filters.diversityTags && filters.diversityTags.length > 0) {
      where.diversityTags = { hasSome: filters.diversityTags };
    }
    // Filter out INTERNAL-only postings for non-employer searches
    if (!filters.postingVisibility) {
      where.postingVisibility = { in: ['PUBLIC', 'BOTH'] };
    } else {
      where.postingVisibility = filters.postingVisibility;
    }

    // Sort — 'relevance' and 'distance' need ES; in DB fallback, default to newest
    let orderBy: any = { createdAt: 'desc' };
    if (filters.sortBy === 'salary') {
      orderBy = { salaryMax: 'desc' };
    } else if (filters.sortBy === 'date') {
      orderBy = { createdAt: 'desc' };
    }

    const [rawJobs, total] = await prisma.$transaction([
      prisma.jobPost.findMany({
        where,
        include: {
          company: {
            select: {
              companyName: true,
              logo: true,
              id: true,
              industry: true,
              companyType: true,
              companySize: true,
              isVerified: true,
              locations: true,
            },
          },
          applications: { where: { status: 'HIRED' }, select: { id: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.jobPost.count({ where }),
    ]);

    const jobs = rawJobs.map(({ applications, ...job }) => ({
      ...job,
      _hiredCount: applications.length,
    }));

    return {
      jobs,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Apply to a Job
   */
  async applyToJob(
    userId: string,
    jobId: string,
    coverLetter?: string,
    screeningAnswers?: ScreeningAnswerInput[]
  ) {
    // Check job exists and is accepting applications
    const jobPost = await prisma.jobPost.findUnique({
      where: { id: jobId },
      select: { status: true, numberOfOpenings: true },
    });
    if (!jobPost) throw new AppError('Job not found', 404);
    if (jobPost.status !== 'OPEN') {
      throw new AppError('This job is no longer accepting applications', 400);
    }
    if (jobPost.numberOfOpenings) {
      const hiredCount = await prisma.jobApplication.count({
        where: { jobId, status: 'HIRED' },
      });
      if (hiredCount >= jobPost.numberOfOpenings) {
        throw new AppError('All openings for this position have been filled', 400);
      }
    }

    const candidate = await prisma.candidateProfile.findUnique({
      where: { userId },
      select: { id: true, resume: true },
    });

    if (!candidate) {
      throw new AppError('Candidate profile not found. Please complete your profile first.', 404);
    }

    let application;
    try {
      application = await prisma.jobApplication.create({
        data: {
          jobId,
          candidateId: candidate.id,
          coverLetter,
          resumeSnapshot: candidate.resume || null,
          status: ApplicationStatus.APPLIED,
        },
      });
    } catch (err) {
      // Unique constraint on jobId_candidateId catches concurrent duplicate applies
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new AppError('You have already applied to this job', 400);
      }
      throw err;
    }

    // Bulk-create screening answers
    if (screeningAnswers && screeningAnswers.length > 0) {
      await prisma.screeningAnswer.createMany({
        data: screeningAnswers.map((a) => ({
          applicationId: application.id,
          questionId: a.questionId,
          answer: a.answer,
        })),
      });
    }

    // Publish Kafka event
    publishEvent(KafkaTopics.APPLICATION_SUBMITTED, application.id, {
      applicationId: application.id,
      jobId,
      candidateId: candidate.id,
      userId,
    });

    // GA4: track application_submitted
    trackEvent(getClientId(userId), {
      name: 'application_submitted',
      params: { job_id: jobId },
    }).catch(() => {});

    // Notify employer about the new application
    const jobWithCompany = await prisma.jobPost.findUnique({
      where: { id: jobId },
      select: { title: true, company: { select: { userId: true, companyName: true } } },
    });
    if (jobWithCompany?.company?.userId) {
      const candidateUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true },
      });
      const candidateName =
        [candidateUser?.firstName, candidateUser?.lastName].filter(Boolean).join(' ') ||
        'A candidate';
      notificationService
        .notifyNewApplication(
          jobWithCompany.company.userId,
          candidateName,
          jobWithCompany.title,
          jobId,
          application.id
        )
        .catch(() => {});

      // Confirm submission to candidate
      notificationService
        .notifyApplicationSubmitted(
          userId,
          jobWithCompany.title,
          jobWithCompany.company.companyName,
          jobId
        )
        .catch(() => {});
    }

    return application;
  }

  /**
   * Get Applications for a Job (Employer)
   */
  async getJobApplications(
    userId: string,
    jobId: string,
    page: number = PAGINATION.DEFAULT_PAGE,
    limit: number = PAGINATION.DEFAULT_LIMIT,
    status?: ApplicationStatus
  ) {
    const job = await prisma.jobPost.findFirst({
      where: { id: jobId, company: { userId } },
    });

    if (!job) {
      throw new AppError('Job not found or access denied', 404);
    }

    const cappedLimit = Math.min(limit, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * cappedLimit;
    const where = { jobId, ...(status ? { status } : {}) };

    const [applications, total] = await prisma.$transaction([
      prisma.jobApplication.findMany({
        where,
        include: {
          candidate: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
          screeningAnswers: {
            include: { question: true },
          },
        },
        orderBy: { appliedAt: 'desc' },
        skip,
        take: cappedLimit,
      }),
      prisma.jobApplication.count({ where }),
    ]);

    // Strip raw R2 URLs — employers must use the signed download endpoint
    const items = applications.map((app) => ({
      ...app,
      resumeSnapshot: app.resumeSnapshot ? true : null,
      candidate: {
        ...app.candidate,
        resume: app.candidate.resume ? true : null,
        generatedResumeUrl: app.candidate.generatedResumeUrl ? true : null,
      },
    }));

    const totalPages = Math.ceil(total / cappedLimit) || 1;
    return { items, total, page, limit: cappedLimit, totalPages, hasMore: page < totalPages };
  }

  /**
   * Get Single Application by ID
   */
  async getApplicationById(userId: string, applicationId: string, userRole: Role) {
    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          include: {
            company: {
              select: { id: true, userId: true, companyName: true, logo: true },
            },
          },
        },
        candidate: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        screeningAnswers: {
          include: { question: true },
          orderBy: { question: { displayOrder: 'asc' } },
        },
      },
    });

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    // Authorization
    const isAdmin = userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN;
    const isCandidate = application.candidate.userId === userId;
    const isEmployer = application.job.company.userId === userId;

    if (!isAdmin && !isCandidate && !isEmployer) {
      throw new AppError('Not authorized to view this application', 403);
    }

    // Strip R2 URLs for non-candidate access
    if (!isCandidate) {
      return {
        ...application,
        resumeSnapshot: application.resumeSnapshot ? true : null,
        candidate: {
          ...application.candidate,
          resume: application.candidate.resume ? true : null,
          generatedResumeUrl: application.candidate.generatedResumeUrl ? true : null,
        },
      };
    }

    return application;
  }

  /**
   * Update Application Status (Employer)
   */
  async updateApplicationStatus(userId: string, applicationId: string, status: ApplicationStatus, rejectionReason?: string) {
    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: { job: { include: { company: true } } },
    });

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    if (application.job.company.userId !== userId) {
      throw new AppError('Not authorized to update this application', 403);
    }

    const updated = await prisma.jobApplication.update({
      where: { id: applicationId },
      data: {
        status,
        ...(status === 'REJECTED' && rejectionReason ? { rejectionReason } : {}),
        ...(status === 'VIEWED' && !application.viewedAt ? { viewedAt: new Date() } : {}),
        ...(status === 'SELECTED' ? { selectedAt: new Date() } : {}),
        ...(status === 'OFFERED' ? { offeredAt: new Date() } : {}),
        ...(status === 'HIRED' ? { hiredAt: new Date() } : {}),
      },
    });

    // Publish Kafka event
    publishEvent(KafkaTopics.APPLICATION_STATUS_CHANGED, applicationId, {
      applicationId,
      status,
      jobId: application.job.id,
      candidateId: application.candidateId,
    });

    // Notify Candidate (multi-channel: in_app, fcm, web_push, email, whatsapp)
    const appWithCandidate = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: { candidate: true, job: { include: { company: true } } },
    });

    if (appWithCandidate) {
      void import('./notification.service')
        .then(({ notificationService }) => {
          return notificationService.notifyApplicationStatusChange(
            appWithCandidate.candidate.userId,
            appWithCandidate.job.title,
            appWithCandidate.job.company.companyName,
            status,
            appWithCandidate.job.id
          );
        })
        .catch((err: any) => logger.error('Failed to send status notification', err));
    }

    // Check if all openings are now filled and notify employer
    if (status === 'HIRED' && application.job.numberOfOpenings) {
      const hiredCount = await prisma.jobApplication.count({
        where: { jobId: application.job.id, status: 'HIRED' },
      });
      if (hiredCount >= application.job.numberOfOpenings) {
        notificationService
          .notifyAllOpeningsFilled(
            application.job.company.userId,
            application.job.title,
            application.job.id,
            hiredCount,
            application.job.numberOfOpenings
          )
          .catch(() => {});
      }
    }

    return updated;
  }

  /**
   * Get Applied Jobs (Candidate)
   */
  async getAppliedJobs(
    userId: string,
    page: number = PAGINATION.DEFAULT_PAGE,
    limit: number = PAGINATION.DEFAULT_LIMIT,
    status?: ApplicationStatus
  ) {
    const candidate = await prisma.candidateProfile.findUnique({ where: { userId } });
    if (!candidate) throw new AppError('Candidate profile not found', 404);

    const cappedLimit = Math.min(limit, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * cappedLimit;
    const where = { candidateId: candidate.id, ...(status ? { status } : {}) };

    const [items, total] = await prisma.$transaction([
      prisma.jobApplication.findMany({
        where,
        include: {
          job: {
            include: {
              company: {
                select: { id: true, companyName: true, logo: true, locations: true },
              },
            },
          },
        },
        orderBy: { appliedAt: 'desc' },
        skip,
        take: cappedLimit,
      }),
      prisma.jobApplication.count({ where }),
    ]);

    const totalPages = Math.ceil(total / cappedLimit) || 1;
    return { items, total, page, limit: cappedLimit, totalPages, hasMore: page < totalPages };
  }

  /**
   * Toggle Save Job (Candidate)
   */
  async toggleSaveJob(userId: string, jobId: string) {
    const existing = await prisma.savedJob.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId,
        },
      },
    });

    if (existing) {
      await prisma.savedJob.delete({
        where: { id: existing.id },
      });
      return { saved: false };
    } else {
      await prisma.savedJob.create({
        data: { userId, jobId },
      });
      return { saved: true };
    }
  }

  /**
   * Get Saved Jobs (Candidate)
   */
  async getSavedJobs(
    userId: string,
    page: number = PAGINATION.DEFAULT_PAGE,
    limit: number = PAGINATION.DEFAULT_LIMIT
  ) {
    const cappedLimit = Math.min(limit, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * cappedLimit;

    const [saved, total] = await prisma.$transaction([
      prisma.savedJob.findMany({
        where: { userId },
        include: {
          job: {
            include: {
              company: {
                select: { id: true, companyName: true, logo: true, locations: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: cappedLimit,
      }),
      prisma.savedJob.count({ where: { userId } }),
    ]);

    const items = saved.map((s) => ({ ...s.job, savedAt: s.createdAt, savedJobId: s.id }));
    const totalPages = Math.ceil(total / cappedLimit) || 1;
    return { items, total, page, limit: cappedLimit, totalPages, hasMore: page < totalPages };
  }

  /**
   * Withdraw Application (Candidate)
   */
  async withdrawApplication(userId: string, applicationId: string) {
    const candidate = await prisma.candidateProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!candidate) throw new AppError('Candidate profile not found', 404);

    const application = await prisma.jobApplication.findFirst({
      where: { id: applicationId, candidateId: candidate.id },
      include: { job: { select: { title: true, company: { select: { userId: true } } } } },
    });

    if (!application) throw new AppError('Application not found', 404);
    if (['WITHDRAWN', 'HIRED', 'REJECTED'].includes(application.status)) {
      throw new AppError(`Cannot withdraw application with status: ${application.status}`, 400);
    }

    const updated = await prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status: ApplicationStatus.WITHDRAWN },
    });

    // Notify employer about withdrawal
    try {
      const { notificationService } = await import('./notification.service');
      const candidateUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true },
      });
      const candidateName =
        [candidateUser?.firstName, candidateUser?.lastName].filter(Boolean).join(' ') ||
        'A candidate';
      await notificationService.notifyApplicationWithdrawn(
        application.job.company.userId,
        candidateName,
        application.job.title,
        application.jobId
      );
    } catch {
      /* non-critical */
    }

    publishEvent(KafkaTopics.APPLICATION_STATUS_CHANGED, applicationId, {
      applicationId,
      status: 'WITHDRAWN',
      jobId: application.jobId,
    });

    return updated;
  }

  /**
   * Get employer's posted jobs with pagination
   */
  async getEmployerJobs(
    userId: string,
    filters: { status?: JobStatus; page?: number; limit?: number }
  ) {
    const company = await prisma.companyProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!company) throw new AppError('Company profile not found', 404);

    const page = filters.page || PAGINATION.DEFAULT_PAGE;
    const cappedLimit = Math.min(filters.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * cappedLimit;
    const where: any = { companyId: company.id };
    if (filters.status) where.status = filters.status;

    const [rawJobs, total] = await prisma.$transaction([
      prisma.jobPost.findMany({
        where,
        include: {
          _count: { select: { applications: true } },
          applications: { where: { status: 'HIRED' }, select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: cappedLimit,
      }),
      prisma.jobPost.count({ where }),
    ]);
    const jobs = rawJobs.map(({ applications, ...job }) => ({
      ...job,
      _hiredCount: applications.length,
    }));
    return {
      jobs,
      pagination: { total, page, limit: cappedLimit, pages: Math.ceil(total / cappedLimit) },
    };
  }

  /**
   * Update a job post (employer must own it)
   */
  async updateJob(userId: string, jobId: string, data: any) {
    const job = await prisma.jobPost.findFirst({ where: { id: jobId, company: { userId } } });
    if (!job) throw new AppError('Job not found or access denied', 404);

    // Extract screening questions for separate handling
    const { screeningQuestions: sqInput, ...updateData } = data;

    // Convert date strings to Date objects
    if (updateData.walkInStartDate) {
      updateData.walkInStartDate = new Date(updateData.walkInStartDate);
    }
    if (updateData.walkInEndDate) updateData.walkInEndDate = new Date(updateData.walkInEndDate);
    if (updateData.scheduledPublishAt) {
      updateData.scheduledPublishAt = new Date(updateData.scheduledPublishAt);
    }

    const updated = await prisma.jobPost.update({ where: { id: jobId }, data: updateData });

    // Replace screening questions if provided (delete all + recreate)
    if (sqInput !== undefined) {
      await prisma.screeningQuestion.deleteMany({ where: { jobId } });
      if (sqInput.length > 0) {
        await prisma.screeningQuestion.createMany({
          data: sqInput.map((q: ScreeningQuestionInput, idx: number) => ({
            jobId,
            question: q.question,
            questionType: q.questionType || ScreeningQuestionType.TEXT,
            isRequired: q.isRequired ?? false,
            isDealBreaker: q.isDealBreaker ?? false,
            options: q.options || undefined,
            idealAnswer: q.idealAnswer,
            displayOrder: q.displayOrder ?? idx,
          })),
        });
      }
    }

    // Re-index in ES
    const jobForIndex = await prisma.jobPost.findUnique({
      where: { id: jobId },
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            logo: true,
            industry: true,
            companyType: true,
            companySize: true,
            isVerified: true,
          },
        },
      },
    });
    if (jobForIndex) {
      searchService
        .indexJob(jobForIndex)
        .catch((err) => logger.error('Failed to re-index job', err));
    }

    // Trigger geocoding if location changed
    if (data.location) {
      import('../jobs/geocoding.queue')
        .then(({ addGeocodingJob }) =>
          addGeocodingJob({ entityType: 'job', entityId: jobId, address: data.location })
        )
        .catch(() => {});
    }

    publishEvent(KafkaTopics.JOB_UPDATED, jobId, {
      jobId,
      userId,
      title: jobForIndex?.title || data.title,
      skills: data.skillsRequired ?? jobForIndex?.skillsRequired ?? [],
      salary_min: data.salaryMin ? Number(data.salaryMin) : (jobForIndex?.salaryMin ? Number(jobForIndex.salaryMin) : null),
      salary_max: data.salaryMax ? Number(data.salaryMax) : (jobForIndex?.salaryMax ? Number(jobForIndex.salaryMax) : null),
      industry: data.industry ?? jobForIndex?.industry ?? null,
      location: data.location ?? jobForIndex?.location ?? null,
    });

    // Re-sync to Cloud Talent
    if (jobForIndex) {
      talentMatchingService
        .syncJobToTalent({
          id: jobForIndex.id,
          title: jobForIndex.title,
          description: jobForIndex.description,
          location: jobForIndex.location,
          company: jobForIndex.company
            ? { id: jobForIndex.company.id, companyName: jobForIndex.company.companyName }
            : null,
          skills: (jobForIndex as any).skillsRequired || [],
          jobType: (jobForIndex as any).type || '',
          workMode: (jobForIndex as any).workMode,
          experienceLevel: (jobForIndex as any).experienceLevel,
          industry: (jobForIndex as any).industry,
          salaryMin: (jobForIndex as any).salaryMin ? Number((jobForIndex as any).salaryMin) : null,
          salaryMax: (jobForIndex as any).salaryMax ? Number((jobForIndex as any).salaryMax) : null,
          currency: (jobForIndex as any).currency,
        })
        .catch(() => {});
    }

    return updated;
  }

  /**
   * Deactivate/close a job
   */
  async deactivateJob(userId: string, jobId: string) {
    const job = await prisma.jobPost.findFirst({
      where: { id: jobId, company: { userId } },
      select: { id: true, title: true, company: { select: { companyName: true } } },
    });
    if (!job) throw new AppError('Job not found or access denied', 404);

    const updated = await prisma.jobPost.update({
      where: { id: jobId },
      data: { status: JobStatus.CLOSED },
    });

    // Remove from ES
    searchService
      .deleteJob(jobId)
      .catch((err) => logger.error('Failed to delete job from ES', err));

    publishEvent(KafkaTopics.JOB_CLOSED, jobId, {
      jobId,
      userId,
      title: job.title,
      skills: (updated as any).skillsRequired || [],
      salary_min: (updated as any).salaryMin ? Number((updated as any).salaryMin) : null,
      salary_max: (updated as any).salaryMax ? Number((updated as any).salaryMax) : null,
      industry: (updated as any).industry || null,
      location: (updated as any).location || null,
    });

    // GA4: track job_closed
    trackEvent(getClientId(userId), { name: 'job_closed', params: { job_id: jobId } }).catch(
      () => {}
    );

    // Notify applicants (email + in-app)
    notificationService.notifyJobClosed(jobId, job.title, job.company.companyName).catch(() => {});

    // Remove from Cloud Talent index
    talentMatchingService.deleteJobFromTalent(jobId).catch(() => {});

    return updated;
  }

  /**
   * Clone/duplicate an existing job as DRAFT
   */
  async cloneJob(userId: string, jobId: string) {
    const company = await prisma.companyProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!company) throw new AppError('Company profile not found', 404);

    const original = await prisma.jobPost.findFirst({
      where: { id: jobId, companyId: company.id },
      include: { screeningQuestions: { orderBy: { displayOrder: 'asc' } } },
    });
    if (!original) throw new AppError('Job not found or access denied', 404);

    const origQuestions = original.screeningQuestions;

    const cloned = await prisma.jobPost.create({
      data: {
        companyId: company.id,
        status: JobStatus.DRAFT,
        title: `${original.title} (Copy)`,
        description: original.description,
        keyResponsibilities: original.keyResponsibilities,
        requirements: original.requirements,
        benefits: original.benefits,
        type: original.type,
        workMode: original.workMode,
        shiftType: original.shiftType,
        industry: original.industry,
        department: original.department,
        roleCategory: original.roleCategory,
        experienceMin: original.experienceMin,
        experienceMax: original.experienceMax,
        experienceLevel: original.experienceLevel,
        educationRequired: original.educationRequired,
        preferredEducationField: original.preferredEducationField,
        location: original.location,
        isRemote: original.isRemote,
        salaryMin: original.salaryMin,
        salaryMax: original.salaryMax,
        currency: original.currency,
        salaryType: original.salaryType,
        salaryDisclosed: original.salaryDisclosed,
        skillsRequired: original.skillsRequired,
        niceToHaveSkills: original.niceToHaveSkills,
        certificationsRequired: original.certificationsRequired,
        languagesRequired:
          original.languagesRequired !== null ? original.languagesRequired : undefined,
        numberOfOpenings: original.numberOfOpenings,
        urgencyLevel: original.urgencyLevel,
        isFeatured: original.isFeatured,
        isPremium: original.isPremium,
        tags: original.tags,
        jobPerks: original.jobPerks,
        travelRequirementPercent: original.travelRequirementPercent,
        relocationAssistance: original.relocationAssistance,
        interviewProcess: original.interviewProcess,
        isWalkIn: original.isWalkIn,
        walkInDetails: original.walkInDetails !== null ? original.walkInDetails : undefined,
        contactPerson: original.contactPerson,
        contactEmail: original.contactEmail,
        // Enterprise fields
        functionalArea: original.functionalArea,
        ugRequired: original.ugRequired,
        pgRequired: original.pgRequired,
        specificDegrees: original.specificDegrees,
        degreeSpecializations: original.degreeSpecializations,
        salaryNegotiable: original.salaryNegotiable,
        noticePeriodPreference: original.noticePeriodPreference,
        isConfidential: original.isConfidential,
        referenceCode: original.referenceCode,
        additionalLocations: original.additionalLocations,
        accommodationProvided: original.accommodationProvided,
        diversityTags: original.diversityTags,
        visaSponsorshipAvailable: original.visaSponsorshipAvailable,
        backgroundCheckRequired: original.backgroundCheckRequired,
        isPwdFriendly: original.isPwdFriendly,
        passportRequired: original.passportRequired,
        bondDetails: original.bondDetails,
        drivingLicenseRequired: original.drivingLicenseRequired,
        ageMin: original.ageMin,
        ageMax: original.ageMax,
        genderPreference: original.genderPreference,
        postingVisibility: original.postingVisibility,
        applyMethod: original.applyMethod,
        externalApplyUrl: original.externalApplyUrl,
      },
    });

    // Clone screening questions
    if (origQuestions.length > 0) {
      await prisma.screeningQuestion.createMany({
        data: origQuestions.map((q) => ({
          jobId: cloned.id,
          question: q.question,
          questionType: q.questionType,
          isRequired: q.isRequired,
          isDealBreaker: q.isDealBreaker,
          options: q.options || undefined,
          idealAnswer: q.idealAnswer,
          displayOrder: q.displayOrder,
        })),
      });
    }

    return cloned;
  }

  /**
   * Employer shortlists a candidate for a specific job
   */
  async shortlistCandidateForJob(
    employerUserId: string,
    candidateProfileId: string,
    jobId: string
  ) {
    const job = await prisma.jobPost.findFirst({
      where: { id: jobId, company: { userId: employerUserId } },
      include: { company: { select: { companyName: true, userId: true } } },
    });
    if (!job) throw new AppError('Job not found or access denied', 404);

    const candidate = await prisma.candidateProfile.findUnique({
      where: { id: candidateProfileId },
      select: { id: true, userId: true },
    });
    if (!candidate) throw new AppError('Candidate not found', 404);

    const existing = await prisma.jobApplication.findUnique({
      where: { jobId_candidateId: { jobId, candidateId: candidateProfileId } },
    });

    let application;
    if (existing) {
      if (
        ['SHORTLISTED', 'SELECTED', 'INTERVIEW_SCHEDULED', 'OFFERED', 'HIRED'].includes(
          existing.status
        )
      ) {
        throw new AppError(
          `Candidate is already ${existing.status.toLowerCase().replace('_', ' ')} for this job`,
          400
        );
      }
      application = await prisma.jobApplication.update({
        where: { id: existing.id },
        data: { status: ApplicationStatus.SHORTLISTED },
      });
    } else {
      application = await prisma.jobApplication.create({
        data: {
          jobId,
          candidateId: candidateProfileId,
          status: ApplicationStatus.SHORTLISTED,
          source: 'EMPLOYER_SHORTLISTED',
        },
      });
    }

    publishEvent(KafkaTopics.APPLICATION_STATUS_CHANGED, application.id, {
      applicationId: application.id,
      status: 'SHORTLISTED',
      jobId,
      candidateId: candidateProfileId,
    });

    notificationService
      .notifyApplicationStatusChange(
        candidate.userId,
        job.title,
        job.company.companyName,
        'SHORTLISTED',
        jobId
      )
      .catch((err: any) => logger.error('Failed to send shortlist notification', err));

    return application;
  }

  /**
   * Employer selects a candidate for a specific job
   */
  async selectCandidateForJob(employerUserId: string, candidateProfileId: string, jobId: string) {
    const job = await prisma.jobPost.findFirst({
      where: { id: jobId, company: { userId: employerUserId } },
      include: { company: { select: { companyName: true, userId: true } } },
    });
    if (!job) throw new AppError('Job not found or access denied', 404);

    const candidate = await prisma.candidateProfile.findUnique({
      where: { id: candidateProfileId },
      select: { id: true, userId: true },
    });
    if (!candidate) throw new AppError('Candidate not found', 404);

    const existing = await prisma.jobApplication.findUnique({
      where: { jobId_candidateId: { jobId, candidateId: candidateProfileId } },
    });

    let application;
    if (existing) {
      if (['SELECTED', 'INTERVIEW_SCHEDULED', 'OFFERED', 'HIRED'].includes(existing.status)) {
        throw new AppError(
          `Candidate is already ${existing.status.toLowerCase().replace('_', ' ')} for this job`,
          400
        );
      }
      application = await prisma.jobApplication.update({
        where: { id: existing.id },
        data: { status: ApplicationStatus.SELECTED, selectedAt: new Date() },
      });
    } else {
      application = await prisma.jobApplication.create({
        data: {
          jobId,
          candidateId: candidateProfileId,
          status: ApplicationStatus.SELECTED,
          selectedAt: new Date(),
          source: 'EMPLOYER_SELECTED',
        },
      });
    }

    publishEvent(KafkaTopics.APPLICATION_STATUS_CHANGED, application.id, {
      applicationId: application.id,
      status: 'SELECTED',
      jobId,
      candidateId: candidateProfileId,
    });

    notificationService
      .notifyApplicationStatusChange(
        candidate.userId,
        job.title,
        job.company.companyName,
        'SELECTED',
        jobId
      )
      .catch((err: any) => logger.error('Failed to send select notification', err));

    return application;
  }

  /**
   * Get all applications across employer's jobs with pagination and filters
   */
  async getAllEmployerApplications(
    employerUserId: string,
    filters: {
      status?: ApplicationStatus;
      jobId?: string;
      candidateId?: string;
      search?: string;
      sortBy?: 'newest' | 'oldest' | 'matchScore';
      page?: number;
      limit?: number;
    }
  ) {
    const company = await prisma.companyProfile.findUnique({
      where: { userId: employerUserId },
      select: { id: true },
    });
    if (!company) throw new AppError('Company profile not found', 404);

    const page = filters.page || PAGINATION.DEFAULT_PAGE;
    const cappedLimit = Math.min(filters.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * cappedLimit;

    const where: any = { job: { companyId: company.id } };
    if (filters.status) where.status = filters.status;
    if (filters.jobId) where.jobId = filters.jobId;
    if (filters.candidateId) where.candidateId = filters.candidateId;
    if (filters.search) {
      where.candidate = {
        user: {
          OR: [
            { firstName: { contains: filters.search, mode: 'insensitive' } },
            { lastName: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } },
          ],
        },
      };
    }

    const orderBy: any =
      filters.sortBy === 'oldest'
        ? { appliedAt: 'asc' }
        : filters.sortBy === 'matchScore'
          ? { matchScore: 'desc' }
          : { appliedAt: 'desc' };

    const [applications, total] = await prisma.$transaction([
      prisma.jobApplication.findMany({
        where,
        include: {
          job: { select: { id: true, title: true, location: true, status: true } },
          candidate: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy,
        skip,
        take: cappedLimit,
      }),
      prisma.jobApplication.count({ where }),
    ]);

    return {
      applications,
      pagination: { total, page, limit: cappedLimit, pages: Math.ceil(total / cappedLimit) },
    };
  }
}

export const jobService = new JobService();
