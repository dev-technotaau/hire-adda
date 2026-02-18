import { Request, Response, NextFunction } from 'express';
import { employerService } from '../services/employer.service';
import { candidateService } from '../services/candidate.service';
import { AppError } from '../middleware/error';

// ... (existing imports)

/**
 * Search Candidates
 */
export const searchCandidates = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) {
            throw new AppError('Not authorized', 401);
        }

        const q = req.query;
        const filters = {
            keyword: typeof q.keyword === 'string' ? q.keyword : undefined,
            keywordScope: typeof q.keywordScope === 'string' ? q.keywordScope as any : undefined,
            excludeKeywords: typeof q.excludeKeywords === 'string' ? q.excludeKeywords.split(',').map(s => s.trim()).filter(Boolean) : undefined,
            location: typeof q.location === 'string' ? q.location : undefined,
            excludeLocation: typeof q.excludeLocation === 'string' ? q.excludeLocation.split(',').map(s => s.trim()).filter(Boolean) : undefined,
            experienceMin: q.experienceMin ? Number(q.experienceMin) : undefined,
            experienceMax: q.experienceMax ? Number(q.experienceMax) : undefined,
            skills: typeof q.skills === 'string' ? q.skills.split(',') : undefined,
            salaryMin: q.salaryMin ? Number(q.salaryMin) : undefined,
            salaryMax: q.salaryMax ? Number(q.salaryMax) : undefined,
            salaryCurrency: typeof q.salaryCurrency === 'string' ? q.salaryCurrency : undefined,
            includeSalaryNotDisclosed: q.includeSalaryNotDisclosed === 'true' ? true : q.includeSalaryNotDisclosed === 'false' ? false : undefined,
            workStatus: typeof q.workStatus === 'string' ? q.workStatus as any : undefined,
            noticePeriod: typeof q.noticePeriod === 'string' ? q.noticePeriod as any : undefined,
            servingNoticePeriod: q.servingNoticePeriod === 'true' ? true : q.servingNoticePeriod === 'false' ? false : undefined,
            gender: typeof q.gender === 'string' ? q.gender as any : undefined,
            willingToRelocate: q.willingToRelocate === 'true' ? true : q.willingToRelocate === 'false' ? false : undefined,
            preferredWorkMode: typeof q.preferredWorkMode === 'string' ? q.preferredWorkMode as any : undefined,
            preferredJobType: typeof q.preferredJobType === 'string' ? q.preferredJobType as any : undefined,
            lastActiveWithin: typeof q.lastActiveWithin === 'string' ? q.lastActiveWithin : undefined,
            currentIndustry: typeof q.currentIndustry === 'string' ? q.currentIndustry : undefined,
            currentCompany: typeof q.currentCompany === 'string' ? q.currentCompany : undefined,
            excludeCompany: typeof q.excludeCompany === 'string' ? q.excludeCompany.split(',').map(s => s.trim()).filter(Boolean) : undefined,
            designation: typeof q.designation === 'string' ? q.designation : undefined,
            department: typeof q.department === 'string' ? q.department : undefined,
            ageMin: q.ageMin ? Number(q.ageMin) : undefined,
            ageMax: q.ageMax ? Number(q.ageMax) : undefined,
            hasCareerBreak: q.hasCareerBreak === 'true' ? true : q.hasCareerBreak === 'false' ? false : undefined,
            hasResume: q.hasResume === 'true' ? true : q.hasResume === 'false' ? false : undefined,
            verifiedMobile: q.verifiedMobile === 'true' ? true : q.verifiedMobile === 'false' ? false : undefined,
            verifiedEmail: q.verifiedEmail === 'true' ? true : q.verifiedEmail === 'false' ? false : undefined,
            registeredAfter: typeof q.registeredAfter === 'string' ? q.registeredAfter : undefined,
            modifiedAfter: typeof q.modifiedAfter === 'string' ? q.modifiedAfter : undefined,
            education: typeof q.education === 'string' ? q.education : undefined,
            certifications: typeof q.certifications === 'string' ? q.certifications : undefined,
            disabilityType: typeof q.disabilityType === 'string' ? q.disabilityType as any : undefined,
            openToWork: typeof q.openToWork === 'string' ? q.openToWork as any : undefined,
            category: typeof q.category === 'string' ? q.category as any : undefined,
            isVeteran: q.isVeteran === 'true' ? 'true' : undefined,
            careerBreakType: typeof q.careerBreakType === 'string' ? q.careerBreakType as any : undefined,
            keywordOperator: typeof q.keywordOperator === 'string' ? q.keywordOperator as any : undefined,
            itSkill: typeof q.itSkill === 'string' ? q.itSkill : undefined,
            workPermit: typeof q.workPermit === 'string' ? q.workPermit : undefined,
            educationLevel: typeof q.educationLevel === 'string' ? q.educationLevel : undefined,
            latitude: q.latitude ? Number(q.latitude) : undefined,
            longitude: q.longitude ? Number(q.longitude) : undefined,
            radiusKm: q.radiusKm ? Number(q.radiusKm) : undefined,
            page: q.page ? Number(q.page) : 1,
            limit: q.limit ? Number(q.limit) : 20,
            sortBy: typeof q.sortBy === 'string' ? q.sortBy as any : undefined,
        };

        const result = await candidateService.searchCandidates(filters.keyword || '', filters);

        const total = result.pagination?.total ?? result.candidates.length;
        const pg = result.pagination ?? { total, page: 1, limit: total || 20, pages: 1 };

        res.status(200).json({
            status: 'success',
            data: {
                items: result.candidates,
                total: pg.total,
                page: pg.page,
                limit: pg.limit,
                totalPages: pg.pages,
                hasMore: pg.page < pg.pages,
            },
        });
    } catch (error) {
        next(error);
    }
};


/**
 * Get current employer's company profile
 */
export const getMyCompany = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) {
            throw new AppError('Not authorized', 401);
        }

        const profile = await employerService.getProfile(req.user.id);

        res.status(200).json({
            status: 'success',
            data: { profile },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update company profile
 */
export const updateMyCompany = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) {
            throw new AppError('Not authorized', 401);
        }

        const profile = await employerService.updateProfile(req.user.id, req.body);

        res.status(200).json({
            status: 'success',
            data: { profile },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Upload Company Logo
 */
export const uploadLogo = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) {
            throw new AppError('Not authorized', 401);
        }

        if (!req.file) {
            throw new AppError('No file uploaded', 400);
        }

        const profile = await employerService.uploadLogo(req.user.id, req.file);

        res.status(200).json({
            status: 'success',
            message: 'Company logo uploaded successfully',
            data: {
                logo: profile.logo
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Remove Company Logo
 */
export const removeLogo = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) {
            throw new AppError('Not authorized', 401);
        }

        await employerService.removeLogo(req.user.id);

        res.status(200).json({
            status: 'success',
            message: 'Company logo removed successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get Profile Views (who viewed my company profile)
 */
export const getProfileViews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        const { profileViewService } = await import('../services/profile-view.service');
        const page = req.query.page ? Number(req.query.page) : 1;
        const limit = req.query.limit ? Number(req.query.limit) : 10;
        const result = await profileViewService.getProfileViews(req.user.id, page, limit);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) { next(error); }
};

/**
 * Get Engagement Metrics
 */
export const getEngagementMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        const data = await employerService.getEngagementMetrics(req.user.id);
        res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
};

/**
 * Get Employer Dashboard Analytics
 */
export const getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        const analytics = await employerService.getDashboardAnalytics(req.user.id);
        res.status(200).json({ status: 'success', data: analytics });
    } catch (error) { next(error); }
};

/**
 * Get Employer Analytics (detailed, with date filtering)
 */
export const getAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        const { startDate, endDate, groupBy } = req.query as Record<string, string>;
        const { employerAnalyticsService } = await import('../services/employer-analytics.service');
        const data = await employerAnalyticsService.getAnalytics(
            req.user.id,
            { startDate, endDate, groupBy: groupBy as 'day' | 'week' | 'month' },
        );
        res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
};

/**
 * Export Employer Analytics as CSV
 */
export const exportAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        const { startDate, endDate } = req.query as Record<string, string>;
        const { employerAnalyticsService } = await import('../services/employer-analytics.service');
        const csv = await employerAnalyticsService.exportAnalyticsCsv(
            req.user.id,
            { startDate, endDate },
        );
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="employer-analytics.csv"');
        res.send(csv);
    } catch (error) { next(error); }
};
