import { Request, Response, NextFunction } from 'express';
import { talentMatchingService } from '../services/talent-matching.service';
import { AppError } from '../middleware/error';
import prisma from '../config/prisma';

/**
 * GET /api/v1/recommendations/jobs
 * AI-recommended jobs for the authenticated candidate.
 * Supports pagination, filters, and excludes dismissed recommendations.
 */
export const getRecommendedJobs = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);

        const page = req.query.page ? Number(req.query.page) : 1;
        const limit = req.query.limit ? Number(req.query.limit) : 20;

        const profile = await prisma.candidateProfile.findUnique({
            where: { userId: req.user.id },
            select: {
                skills: true,
                currentRole: true,
                currentLocation: true,
                experienceYears: true,
            },
        });

        if (!profile) {
            res.status(200).json({ status: 'success', data: { items: [], total: 0, page, limit, totalPages: 0, hasMore: false } });
            return;
        }

        // Get dismissed job IDs for this user
        const dismissed = await prisma.dismissedRecommendation.findMany({
            where: { userId: req.user.id },
            select: { jobId: true },
        });
        const dismissedIds = new Set(dismissed.map(d => d.jobId));

        const recommendations = await talentMatchingService.getAIRecommendedJobs(profile);

        if (recommendations.length === 0) {
            res.status(200).json({ status: 'success', data: { items: [], total: 0, page, limit, totalPages: 0, hasMore: false } });
            return;
        }

        // Filter out dismissed and fetch full job details
        const filteredRecs = recommendations.filter(r => !dismissedIds.has(r.jobId));
        const jobIds = filteredRecs.map((r) => r.jobId);

        // Build Prisma where clause with optional filters
        const whereClause: Record<string, unknown> = { id: { in: jobIds }, status: 'OPEN' };
        if (req.query.workMode && typeof req.query.workMode === 'string') whereClause.workMode = req.query.workMode;
        if (req.query.type && typeof req.query.type === 'string') whereClause.type = req.query.type;
        if (req.query.experienceLevel && typeof req.query.experienceLevel === 'string') whereClause.experienceLevel = req.query.experienceLevel;

        const jobs = await prisma.jobPost.findMany({
            where: whereClause,
            include: { company: { select: { companyName: true, logo: true } } },
        });

        const jobsWithScores = jobs.map((job) => ({
            ...job,
            matchScore: filteredRecs.find((r) => r.jobId === job.id)?.matchScore || 0,
        }));

        jobsWithScores.sort((a, b) => b.matchScore - a.matchScore);

        // Paginate
        const total = jobsWithScores.length;
        const totalPages = Math.ceil(total / limit);
        const start = (page - 1) * limit;
        const paginatedJobs = jobsWithScores.slice(start, start + limit);

        res.status(200).json({
            status: 'success',
            data: {
                items: paginatedJobs,
                total,
                page,
                limit,
                totalPages,
                hasMore: page < totalPages,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/recommendations/jobs/:jobId/dismiss
 * Dismiss a job recommendation for the authenticated candidate.
 */
export const dismissRecommendation = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);

        const jobId = req.params.jobId as string;

        // Verify job exists
        const job = await prisma.jobPost.findUnique({ where: { id: jobId }, select: { id: true } });
        if (!job) throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');

        await prisma.dismissedRecommendation.upsert({
            where: { userId_jobId: { userId: req.user.id, jobId } },
            create: { userId: req.user.id, jobId },
            update: {},
        });

        res.status(200).json({ status: 'success', message: 'Recommendation dismissed' });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/recommendations/candidates/:jobId
 * AI-recommended candidates for a specific job (employer view).
 */
export const getRecommendedCandidates = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);

        const jobId = req.params.jobId as string;

        const job = await prisma.jobPost.findFirst({
            where: { id: jobId, company: { userId: req.user.id } },
            select: { title: true, skillsRequired: true, location: true },
        });

        if (!job) {
            throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
        }

        const recommendations = await talentMatchingService.getAIRecommendedCandidates({
            title: job.title,
            skills: job.skillsRequired,
            location: job.location,
        });

        res.status(200).json({
            status: 'success',
            data: recommendations,
        });
    } catch (error) {
        next(error);
    }
};
