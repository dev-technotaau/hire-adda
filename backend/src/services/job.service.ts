import { prisma } from '../config/prisma';
import { AppError } from '../middleware/error';
import {
    JobStatus, JobType, ApplicationStatus,
    WorkMode, ShiftType, ExperienceLevel, EducationLevel,
    SalaryType, UrgencyLevel,
} from '@prisma/client';
import { searchService } from './search.service';
import { PAGINATION } from '@/constants';
import { publishEvent, KafkaTopics } from '../kafka/producer';
import { trackEvent, getClientId } from './analytics.service';
import { notificationService } from './notification.service';
import { moderationService } from './moderation.service';

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
}

interface JobSearchFilters {
    keyword?: string;
    location?: string;
    type?: JobType;
    industry?: string;
    department?: string;
    salaryMin?: number;
    salaryMax?: number;
    experience?: number;
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
}

export class JobService {
    /**
     * Create a new job post
     */
    async createJob(userId: string, data: CreateJobDto) {
        // 1. Get Company Profile ID
        const company = await prisma.companyProfile.findUnique({
            where: { userId },
            select: { id: true, isVerified: true }
        });

        if (!company) {
            throw new AppError('Company profile not found. Please complete your employer profile first.', 404);
        }

        // Content moderation screening
        const contentToScreen = [data.title, data.description, data.requirements].filter(Boolean).join(' ');
        const moderationResult = moderationService.screenContent(contentToScreen);
        if (moderationResult.severity === 'high' || moderationResult.severity === 'medium') {
            throw new AppError(
                `Job content contains prohibited terms: ${moderationResult.flaggedTerms.join(', ')}. Please revise your listing.`,
                400,
                'CONTENT_FLAGGED'
            );
        }

        const job = await prisma.jobPost.create({
            data: {
                companyId: company.id,
                ...data,
                salaryMin: data.salaryMin ? Number(data.salaryMin) : undefined,
                salaryMax: data.salaryMax ? Number(data.salaryMax) : undefined,
                experienceMin: data.experienceMin ? Number(data.experienceMin) : 0,
                experienceMax: data.experienceMax ? Number(data.experienceMax) : undefined,
                isRemote: Boolean(data.isRemote),
            }
        });

        // INDEXING: Sync with Elasticsearch
        const jobForIndex = await prisma.jobPost.findUnique({
            where: { id: job.id },
            include: { company: { select: { id: true, companyName: true, logo: true, industry: true, companyType: true, companySize: true, isVerified: true } } }
        });

        if (jobForIndex) {
            searchService.indexJob(jobForIndex).catch((err: any) => console.error('Failed to index job', err));
        }

        // Trigger geocoding if location provided
        if (data.location) {
            import('../jobs/geocoding.queue').then(({ addGeocodingJob }) =>
                addGeocodingJob({ entityType: 'job', entityId: job.id, address: data.location })
            ).catch(() => {});
        }

        // Trigger candidate matching
        try {
            const { matchingQueue } = await import('../jobs/matching.queue');
            await matchingQueue.add('match-candidates', { jobId: job.id });
        } catch (err) { console.error('Failed to enqueue matching job', err); }

        // Publish Kafka event
        publishEvent(KafkaTopics.JOB_POSTED, job.id, { jobId: job.id, companyId: company.id, title: data.title });

        // GA4: track job_posted
        trackEvent(getClientId(userId), { name: 'job_posted', params: { job_id: job.id, job_type: data.type } }).catch(() => {});

        return job;
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
                        companyName: true,
                        logo: true,
                        industry: true,
                        website: true,
                        locations: true,
                        userId: true,
                    }
                }
            }
        });

        if (!job) {
            throw new AppError('Job not found', 404);
        }

        await prisma.jobPost.update({
            where: { id },
            data: { views: { increment: 1 } }
        });

        return job;
    }

    /**
     * Search Jobs with Filters (Elasticsearch + Prisma Fallback)
     */
    async searchJobs(filters: JobSearchFilters) {
        const page = filters.page || PAGINATION.DEFAULT_PAGE;
        const limit = filters.limit || PAGINATION.DEFAULT_LIMIT;
        const skip = (page - 1) * limit;

        // 1. Try Elasticsearch
        const hasSearchCriteria = filters.keyword || filters.location || filters.type || filters.industry
            || filters.workMode || filters.experienceLevel || filters.tags;
        if (hasSearchCriteria) {
            try {
                const { hits, total } = await searchService.searchJobs(filters.keyword, {
                    ...filters,
                    from: skip,
                    size: limit,
                });

                return {
                    jobs: hits,
                    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
                };
            } catch (error) {
                console.warn('Elasticsearch failed, falling back to database search', error);
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
            where.salaryMax = { gte: filters.salaryMin };
        }
        if (filters.salaryMax) {
            where.salaryMin = { ...where.salaryMin, lte: filters.salaryMax };
        }
        if (filters.experience !== undefined) {
            where.experienceMin = { lte: filters.experience };
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

        // Sort
        let orderBy: any = { createdAt: 'desc' };
        if (filters.sortBy === 'salary') {
            orderBy = { salaryMax: 'desc' };
        }

        const [jobs, total] = await prisma.$transaction([
            prisma.jobPost.findMany({
                where,
                include: {
                    company: { select: { companyName: true, logo: true, id: true, industry: true, companyType: true, companySize: true, isVerified: true } },
                },
                orderBy,
                skip,
                take: limit,
            }),
            prisma.jobPost.count({ where }),
        ]);

        return {
            jobs,
            pagination: { total, page, limit, pages: Math.ceil(total / limit) },
        };
    }

    /**
     * Apply to a Job
     */
    async applyToJob(userId: string, jobId: string, coverLetter?: string) {
        const candidate = await prisma.candidateProfile.findUnique({
            where: { userId },
            select: { id: true }
        });

        if (!candidate) {
            throw new AppError('Candidate profile not found. Please complete your profile first.', 404);
        }

        const existingApplication = await prisma.jobApplication.findUnique({
            where: {
                jobId_candidateId: {
                    jobId,
                    candidateId: candidate.id
                }
            }
        });

        if (existingApplication) {
            throw new AppError('You have already applied to this job', 400);
        }

        const application = await prisma.jobApplication.create({
            data: {
                jobId,
                candidateId: candidate.id,
                coverLetter,
                status: ApplicationStatus.APPLIED
            }
        });

        // Publish Kafka event
        publishEvent(KafkaTopics.APPLICATION_SUBMITTED, application.id, {
            applicationId: application.id, jobId, candidateId: candidate.id, userId,
        });

        // GA4: track application_submitted
        trackEvent(getClientId(userId), { name: 'application_submitted', params: { job_id: jobId } }).catch(() => {});

        // Notify employer about the new application
        const jobWithCompany = await prisma.jobPost.findUnique({
            where: { id: jobId },
            select: { title: true, company: { select: { userId: true } } }
        });
        if (jobWithCompany?.company?.userId) {
            const candidateUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { firstName: true, lastName: true }
            });
            const candidateName = [candidateUser?.firstName, candidateUser?.lastName].filter(Boolean).join(' ') || 'A candidate';
            notificationService.notifyNewApplication(
                jobWithCompany.company.userId, candidateName, jobWithCompany.title, jobId, application.id
            ).catch(() => {});
        }

        return application;
    }

    /**
     * Get Applications for a Job (Employer)
     */
    async getJobApplications(userId: string, jobId: string) {
        const job = await prisma.jobPost.findFirst({
            where: { id: jobId, company: { userId } }
        });

        if (!job) {
            throw new AppError('Job not found or access denied', 404);
        }

        const applications = await prisma.jobApplication.findMany({
            where: { jobId },
            include: {
                candidate: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                avatar: true
                            }
                        }
                    }
                }
            },
            orderBy: { appliedAt: 'desc' }
        });

        return applications;
    }

    /**
     * Update Application Status (Employer)
     */
    async updateApplicationStatus(userId: string, applicationId: string, status: ApplicationStatus) {
        const application = await prisma.jobApplication.findUnique({
            where: { id: applicationId },
            include: { job: { include: { company: true } } }
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
                ...(status === 'VIEWED' && !application.viewedAt ? { viewedAt: new Date() } : {}),
            }
        });

        // Publish Kafka event
        publishEvent(KafkaTopics.APPLICATION_STATUS_CHANGED, applicationId, {
            applicationId, status, jobId: application.job.id, candidateId: application.candidateId,
        });

        // Notify Candidate
        const appWithCandidate = await prisma.jobApplication.findUnique({
            where: { id: applicationId },
            include: { candidate: { include: { user: true } }, job: { include: { company: true } } }
        });

        if (appWithCandidate && appWithCandidate.candidate.user.email) {
            // Lazy load to avoid circular dependency if any
            import('./email.service').then(service => {
                service.emailService.sendApplicationStatusUpdate(
                    appWithCandidate.candidate.user.email,
                    appWithCandidate.job.title,
                    appWithCandidate.job.company.companyName,
                    status
                ).catch((err: any) => console.error('Failed to send status email', err));
            });
        }

        return updated;
    }

    /**
     * Get Applied Jobs (Candidate)
     */
    async getAppliedJobs(userId: string) {
        const candidate = await prisma.candidateProfile.findUnique({ where: { userId } });
        if (!candidate) throw new AppError('Candidate profile not found', 404);

        const applications = await prisma.jobApplication.findMany({
            where: { candidateId: candidate.id },
            include: {
                job: {
                    include: {
                        company: {
                            select: { companyName: true, logo: true, locations: true }
                        }
                    }
                }
            },
            orderBy: { appliedAt: 'desc' }
        });

        return applications;
    }

    /**
     * Toggle Save Job (Candidate)
     */
    async toggleSaveJob(userId: string, jobId: string) {
        const existing = await prisma.savedJob.findUnique({
            where: {
                userId_jobId: {
                    userId,
                    jobId
                }
            }
        });

        if (existing) {
            await prisma.savedJob.delete({
                where: { id: existing.id }
            });
            return { saved: false };
        } else {
            await prisma.savedJob.create({
                data: { userId, jobId }
            });
            return { saved: true };
        }
    }

    /**
     * Get Saved Jobs (Candidate)
     */
    async getSavedJobs(userId: string) {
        const saved = await prisma.savedJob.findMany({
            where: { userId },
            include: {
                job: {
                    include: {
                        company: {
                            select: { companyName: true, logo: true, locations: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return saved;
    }

    /**
     * Withdraw Application (Candidate)
     */
    async withdrawApplication(userId: string, applicationId: string) {
        const candidate = await prisma.candidateProfile.findUnique({ where: { userId }, select: { id: true } });
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

        // Notify employer
        try {
            const { notificationService } = await import('./notification.service');
            await notificationService.send({
                userId: application.job.company.userId,
                title: 'Application Withdrawn',
                message: `A candidate has withdrawn their application for "${application.job.title}".`,
                type: 'INFO',
                category: 'application_update',
                channels: ['in_app', 'email'],
            });
        } catch (e) { /* non-critical */ }

        publishEvent(KafkaTopics.APPLICATION_STATUS_CHANGED, applicationId, {
            applicationId, status: 'WITHDRAWN', jobId: application.jobId,
        });

        return updated;
    }

    /**
     * Get employer's posted jobs with pagination
     */
    async getEmployerJobs(userId: string, filters: { status?: JobStatus; page?: number; limit?: number }) {
        const company = await prisma.companyProfile.findUnique({ where: { userId }, select: { id: true } });
        if (!company) throw new AppError('Company profile not found', 404);

        const page = filters.page || PAGINATION.DEFAULT_PAGE;
        const limit = filters.limit || PAGINATION.DEFAULT_LIMIT;
        const skip = (page - 1) * limit;
        const where: any = { companyId: company.id };
        if (filters.status) where.status = filters.status;

        const [jobs, total] = await prisma.$transaction([
            prisma.jobPost.findMany({
                where, include: { _count: { select: { applications: true } } },
                orderBy: { createdAt: 'desc' }, skip, take: limit,
            }),
            prisma.jobPost.count({ where }),
        ]);
        return { jobs, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
    }

    /**
     * Update a job post (employer must own it)
     */
    async updateJob(userId: string, jobId: string, data: any) {
        const job = await prisma.jobPost.findFirst({ where: { id: jobId, company: { userId } } });
        if (!job) throw new AppError('Job not found or access denied', 404);

        const updated = await prisma.jobPost.update({ where: { id: jobId }, data });

        // Re-index in ES
        const jobForIndex = await prisma.jobPost.findUnique({
            where: { id: jobId }, include: { company: { select: { id: true, companyName: true, logo: true, industry: true, companyType: true, companySize: true, isVerified: true } } }
        });
        if (jobForIndex) {
            searchService.indexJob(jobForIndex).catch(err => console.error('Failed to re-index job', err));
        }

        // Trigger geocoding if location changed
        if (data.location) {
            import('../jobs/geocoding.queue').then(({ addGeocodingJob }) =>
                addGeocodingJob({ entityType: 'job', entityId: jobId, address: data.location })
            ).catch(() => {});
        }

        publishEvent(KafkaTopics.JOB_UPDATED, jobId, { jobId, userId });

        return updated;
    }

    /**
     * Deactivate/close a job
     */
    async deactivateJob(userId: string, jobId: string) {
        const job = await prisma.jobPost.findFirst({ where: { id: jobId, company: { userId } } });
        if (!job) throw new AppError('Job not found or access denied', 404);

        const updated = await prisma.jobPost.update({
            where: { id: jobId }, data: { status: JobStatus.CLOSED }
        });

        // Remove from ES
        searchService.deleteJob(jobId).catch(err => console.error('Failed to delete job from ES', err));

        publishEvent(KafkaTopics.JOB_CLOSED, jobId, { jobId, userId });

        // GA4: track job_closed
        trackEvent(getClientId(userId), { name: 'job_closed', params: { job_id: jobId } }).catch(() => {});

        return updated;
    }
}

export const jobService = new JobService();
