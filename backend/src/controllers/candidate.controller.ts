import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { candidateService } from '../services/candidate.service';
import { candidateAnalyticsService } from '../services/candidate-analytics.service';
import { AppError } from '../middleware/error';
import { resumeParseQueue } from '../jobs/resume-parse.queue';
import prisma from '../config/prisma';

/**
 * Get current user's candidate profile
 */
export const getMyProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) {
            throw new AppError('Not authorized', 401);
        }

        const profile = await candidateService.getProfile(req.user.id);

        res.status(200).json({
            status: 'success',
            data: { profile },
        });
    } catch (error) {
        // If profile doesn't exist yet, return empty object or specific message?
        // Service throws 404 if not found. 
        // For /me endpoint, it might be better to return null or create one?
        // For now, let's bubble up the 404 from service.
        next(error);
    }
};

/**
 * Update candidate profile
 */
export const updateMyProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) {
            throw new AppError('Not authorized', 401);
        }

        const profile = await candidateService.updateProfile(req.user.id, req.body);

        res.status(200).json({
            status: 'success',
            data: { profile },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Upload Resume
 */
export const uploadResume = async (
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

        const profile = await candidateService.uploadResume(req.user.id, req.file);

        res.status(200).json({
            status: 'success',
            message: 'Resume uploaded successfully',
            data: {
                resume: profile.resume,
                resumeOriginalName: profile.resumeOriginalName,
                resumeSize: profile.resumeSize,
                resumeMimeType: profile.resumeMimeType,
                resumeUploadedAt: profile.resumeUploadedAt,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Upload Profile Image/Avatar
 */
export const uploadAvatar = async (
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

        const profile = await candidateService.uploadProfileImage(req.user.id, req.file);

        res.status(200).json({
            status: 'success',
            message: 'Avatar uploaded successfully',
            data: {
                profileImage: profile.profileImage
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Remove Profile Image/Avatar
 */
export const removeAvatar = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) {
            throw new AppError('Not authorized', 401);
        }

        await candidateService.removeProfileImage(req.user.id);

        res.status(200).json({
            status: 'success',
            message: 'Avatar removed successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete Resume (uploaded and/or generated)
 */
export const deleteResume = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) {
            throw new AppError('Not authorized', 401);
        }

        // Optional query param to specify which resume to delete: uploaded, generated, or both (default)
        const resumeType = (req.query.type as 'uploaded' | 'generated' | 'both') || 'both';

        if (!['uploaded', 'generated', 'both'].includes(resumeType)) {
            throw new AppError('Invalid resume type. Must be: uploaded, generated, or both', 400);
        }

        await candidateService.deleteResume(req.user.id, resumeType);

        res.status(200).json({
            status: 'success',
            message: 'Resume deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get Profile Completeness (Candidate)
 */
export const getProfileCompleteness = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        const completeness = await candidateService.getProfileCompleteness(req.user.id);
        res.status(200).json({ status: 'success', data: completeness });
    } catch (error) { next(error); }
};

/**
 * Get Candidate Dashboard
 */
export const getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        const dashboard = await candidateService.getCandidateDashboard(req.user.id);
        res.status(200).json({ status: 'success', data: dashboard });
    } catch (error) { next(error); }
};

/**
 * Get resume generation readiness status
 */
export const getResumeReadiness = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        const profile = await candidateService.getProfile(req.user.id);
        const { resumeGenerator } = await import('../services/resume-generator.service');
        const readiness = resumeGenerator.validateResumeReadiness(profile);
        res.status(200).json({ status: 'success', data: readiness });
    } catch (error) { next(error); }
};

/**
 * Generate Resume PDF from profile
 */
export const generateResumePdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        const profile = await candidateService.getProfile(req.user.id);
        const { resumeGenerator } = await import('../services/resume-generator.service');

        // Validate readiness
        const readiness = resumeGenerator.validateResumeReadiness(profile);
        if (!readiness.canGenerate) {
            throw new AppError('Profile incomplete — add required fields before generating resume', 400, 'RESUME_NOT_READY');
        }

        const resumeData = {
            fullName: `${profile.user.firstName || ''} ${profile.user.lastName || ''}`.trim(),
            email: profile.user.email,
            phone: profile.phone || '',
            location: profile.currentLocation || '',
            headline: profile.headline || undefined,
            linkedin: profile.linkedinProfile || undefined,
            portfolio: profile.portfolioUrl || undefined,
            github: profile.githubProfile || undefined,
            summary: profile.bio || undefined,
            experience: profile.experience ? (profile.experience as any[]).map(e => ({
                title: e.role, company: e.company, location: e.location || '',
                startDate: e.startDate, endDate: e.endDate || 'Present',
                description: e.description || '',
                highlights: e.keyAchievements?.length ? e.keyAchievements : undefined,
            })) : undefined,
            education: profile.education ? (profile.education as any[]).map(e => ({
                institution: e.institution || e.college, degree: e.degree,
                field: e.field || '', year: e.year || e.endDate || '',
                grade: e.grade || undefined,
            })) : undefined,
            skills: profile.skills.length > 0 ? profile.skills : undefined,
            certifications: profile.certifications ? (profile.certifications as any[]).map(c => ({
                name: c.name, issuer: c.issuer,
                date: c.issueDate || '', credentialId: c.credentialId || undefined,
                url: c.url || undefined,
            })) : undefined,
            projects: profile.projects ? (profile.projects as any[]).map(p => ({
                name: p.name, description: p.description || '',
                technologies: p.technologies || [], url: p.url || undefined,
                role: p.role || undefined,
            })) : undefined,
            awards: profile.awards ? (profile.awards as any[]).map(a => ({
                title: a.title, issuer: a.issuer || '',
                date: a.date || '', description: a.description || undefined,
            })) : undefined,
            languages: profile.languageProficiency ? (profile.languageProficiency as any[]).map(l => ({
                language: l.language, proficiency: l.proficiency,
            })) : undefined,
        };
        const pdfBuffer = await resumeGenerator.generateResume(resumeData);

        // Delete old generated resume from R2
        const { uploadFileToR2, extractR2KeyFromUrl, deleteFileFromR2 } = await import('../services/storage.service');
        if (profile.generatedResumeUrl) {
            const oldKey = extractR2KeyFromUrl(profile.generatedResumeUrl as string);
            if (oldKey) deleteFileFromR2(oldKey).catch(() => {});
        }

        // Save to R2
        const filename = `resume-${profile.user.firstName || 'candidate'}-${Date.now()}.pdf`;
        const { url } = await uploadFileToR2(pdfBuffer, filename, 'generated-resumes', 'application/pdf');

        // Persist URL in profile
        await prisma.candidateProfile.update({
            where: { userId: req.user.id },
            data: { generatedResumeUrl: url, generatedResumeAt: new Date() },
        });

        res.status(200).json({
            status: 'success',
            data: { url, generatedAt: new Date().toISOString() },
        });
    } catch (error) { next(error); }
};

/**
 * Set generated resume as the active profile resume
 */
export const useGeneratedResume = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);

        const profile = await prisma.candidateProfile.findUnique({ where: { userId: req.user.id } });
        if (!profile?.generatedResumeUrl) {
            throw new AppError('No generated resume found — generate one first', 400, 'NO_GENERATED_RESUME');
        }

        // Delete old uploaded resume from R2 (skip if it's the same as generated)
        if (profile.resume && profile.resume !== profile.generatedResumeUrl) {
            const { extractR2KeyFromUrl, deleteFileFromR2 } = await import('../services/storage.service');
            const oldKey = extractR2KeyFromUrl(profile.resume);
            if (oldKey) deleteFileFromR2(oldKey).catch(() => {});
        }

        await prisma.candidateProfile.update({
            where: { userId: req.user.id },
            data: {
                resume: profile.generatedResumeUrl,
                resumeOriginalName: 'Generated Resume.pdf',
                resumeSize: null,
                resumeMimeType: 'application/pdf',
                resumeUploadedAt: new Date(),
            },
        });

        res.status(200).json({
            status: 'success',
            message: 'Generated resume set as profile resume',
            data: { resume: profile.generatedResumeUrl },
        });
    } catch (error) { next(error); }
};

/**
 * Get Candidate Public Profile (Employer viewing candidate)
 */
export const getCandidateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        const candidateUserId = req.params.id as string;
        const profile = await candidateService.getCandidatePublicProfile(candidateUserId);

        // Track profile view
        try {
            const { profileViewService } = await import('../services/profile-view.service');
            await profileViewService.trackView(req.user.id, candidateUserId, 'CANDIDATE_PROFILE');
        } catch (e) { /* non-critical */ }

        res.status(200).json({ status: 'success', data: { profile } });
    } catch (error) { next(error); }
};

/**
 * Get Profile Views (who viewed my profile)
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
 * Search Candidates (Employer only)
 */
export const searchCandidates = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
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
            latitude: q.latitude ? Number(q.latitude) : undefined,
            longitude: q.longitude ? Number(q.longitude) : undefined,
            radiusKm: q.radiusKm ? Number(q.radiusKm) : undefined,
            sortBy: typeof q.sortBy === 'string' ? q.sortBy as any : undefined,
            page: q.page ? Number(q.page) : 1,
            limit: q.limit ? Number(q.limit) : 10,
        };

        const result = await candidateService.searchCandidates(
            filters.keyword || '',
            filters
        );

        const total = result.pagination?.total ?? result.candidates.length;
        const pg = result.pagination ?? { total, page: 1, limit: total || 10, pages: 1 };

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
 * POST /api/v1/candidates/me/resume/parse
 * Trigger AI parsing of the current resume.
 */
export const triggerResumeParse = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) {
            throw new AppError('Not authorized', 401);
        }

        const profile = await prisma.candidateProfile.findUnique({
            where: { userId: req.user.id },
            select: { id: true, resume: true, resumeOriginalName: true },
        });

        if (!profile?.resume) {
            throw new AppError('No resume uploaded. Please upload a resume first.', 400, 'NO_RESUME');
        }

        const mimeType = profile.resumeOriginalName?.endsWith('.docx')
            ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            : profile.resumeOriginalName?.endsWith('.doc')
                ? 'application/msword'
                : 'application/pdf';

        await resumeParseQueue.add('parse-resume', {
            userId: req.user.id,
            candidateProfileId: profile.id,
            resumeUrl: profile.resume,
            mimeType,
        });

        res.status(202).json({
            status: 'success',
            message: 'Resume parsing started. You will be notified when complete.',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/candidates/me/analytics
 * Get candidate analytics & insights.
 */
export const getAnalytics = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        const { startDate, endDate, groupBy } = req.query as Record<string, string>;
        const data = await candidateAnalyticsService.getAnalytics(req.user.id, { startDate, endDate, groupBy: groupBy as 'day' | 'week' | 'month' });
        res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
};

/**
 * GET /api/v1/candidates/me/analytics/export
 * Export candidate analytics as CSV.
 */
export const exportAnalytics = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        const { startDate, endDate } = req.query as Record<string, string>;
        const csv = await candidateAnalyticsService.exportAnalyticsCsv(req.user.id, { startDate, endDate });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="analytics.csv"');
        res.send(csv);
    } catch (error) { next(error); }
};

/**
 * GET /api/v1/candidates/me/resume/parsed
 * Get parsed resume data.
 */
export const getParsedResumeData = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) {
            throw new AppError('Not authorized', 401);
        }

        const profile = await prisma.candidateProfile.findUnique({
            where: { userId: req.user.id },
            select: { parsedResumeData: true },
        });

        res.status(200).json({
            status: 'success',
            data: profile?.parsedResumeData || null,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/candidates/:id/resume
 * Secure resume download — returns a short-lived signed URL.
 * Candidates can download their own; employers/admins who have a relationship can download others'.
 */
export const getResumeDownloadUrl = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);

        const candidateUserId = req.params.id as string;
        const isSelf = req.user.id === candidateUserId;

        // If not self, must be EMPLOYER or ADMIN
        if (!isSelf && req.user.role !== Role.EMPLOYER && req.user.role !== Role.ADMIN && req.user.role !== Role.SUPER_ADMIN) {
            throw new AppError('Not authorized to access this resume', 403);
        }

        // For employers, verify they have a relationship (received an application or saved the candidate)
        if (!isSelf && req.user.role === Role.EMPLOYER) {
            const company = await prisma.companyProfile.findUnique({
                where: { userId: req.user.id },
                select: { id: true },
            });
            if (!company) throw new AppError('Employer profile not found', 404);

            const hasRelationship = await prisma.jobApplication.findFirst({
                where: {
                    candidate: { user: { id: candidateUserId } },
                    job: { companyId: company.id },
                },
                select: { id: true },
            });

            const hasSaved = !hasRelationship ? await prisma.savedCandidate.findFirst({
                where: {
                    employerId: company.id,
                    candidateId: candidateUserId,
                },
                select: { id: true },
            }) : hasRelationship;

            if (!hasSaved) {
                throw new AppError('You must have an application or save this candidate before accessing their resume', 403);
            }
        }

        // Determine which resume URL to use — query param `snapshot` for application resume
        const applicationId = req.query.applicationId as string | undefined;
        let resumeUrl: string | null = null;

        if (applicationId) {
            const application = await prisma.jobApplication.findUnique({
                where: { id: applicationId },
                select: { resumeSnapshot: true, candidate: { select: { resume: true } } },
            });
            resumeUrl = application?.resumeSnapshot || application?.candidate?.resume || null;
        } else {
            const profile = await prisma.candidateProfile.findFirst({
                where: { userId: candidateUserId },
                select: { resume: true },
            });
            resumeUrl = profile?.resume || null;
        }

        if (!resumeUrl) {
            throw new AppError('No resume found', 404);
        }

        // Extract R2 key and generate signed URL
        const { extractR2KeyFromUrl, getSignedDownloadUrl } = await import('../services/storage.service');
        const key = extractR2KeyFromUrl(resumeUrl);

        if (!key) {
            // Fallback: if URL is not R2 (e.g. Cloudinary legacy), redirect directly
            res.status(200).json({ status: 'success', data: { url: resumeUrl } });
            return;
        }

        const signedUrl = await getSignedDownloadUrl(key, 300); // 5 minutes
        res.status(200).json({ status: 'success', data: { url: signedUrl } });
    } catch (error) {
        next(error);
    }
};
