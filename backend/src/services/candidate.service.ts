import { prisma } from '../config/prisma';
import { AppError } from '../middleware/error';
import { CandidateProfile } from '@prisma/client';
import { uploadImage, uploadOptions } from '../config/cloudinary';
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
                    const { userId, ...rest } = data as any;
                    return rest;
                })(),
            },
            include: { user: true }
        });

        // INDEXING
        if (profile) {
            searchService.indexCandidate(profile).catch((err: any) => console.error('Failed to index candidate', err));
        }

        // Update cached completeness score
        const completeness = await this.getProfileCompleteness(userId);
        if (completeness.percentage !== profile.profileCompleteness) {
            await prisma.candidateProfile.update({
                where: { userId },
                data: { profileCompleteness: completeness.percentage }
            });

            // GA4: track profile_completed when 100%
            if (completeness.percentage >= 100) {
                trackEvent(getClientId(userId), { name: 'profile_completed', params: { completeness: 100 } }).catch(() => {});
            }
        }

        // Trigger geocoding if location fields changed
        const locationAddress = [data.currentLocation, data.city, data.state, data.country].filter(Boolean).join(', ');
        if (locationAddress) {
            import('../jobs/geocoding.queue').then(({ addGeocodingJob }) =>
                addGeocodingJob({ entityType: 'candidate', entityId: userId, address: locationAddress })
            ).catch(() => {});
        }

        // Trigger job matching
        try {
            const { matchingQueue } = await import('../jobs/matching.queue');
            await matchingQueue.add('match-jobs', { userId });
        } catch (err) { console.error('Failed to enqueue matching job', err); }

        // Publish Kafka event
        publishEvent(KafkaTopics.PROFILE_UPDATED, userId, { userId, profileId: profile.id });

        return profile;
    }

    /**
     * Upload Resume to Cloudinary
     */
    async uploadResume(userId: string, file: Express.Multer.File) {
        const uploadResult = await uploadImage(profileImageBufferOrPath(file), uploadOptions.resume);

        const profile = await prisma.candidateProfile.upsert({
            where: { userId },
            create: {
                userId,
                resume: uploadResult.secure_url,
                resumeOriginalName: file.originalname,
            },
            update: {
                resume: uploadResult.secure_url,
                resumeOriginalName: file.originalname,
            },
            include: { user: true }
        });

        // Sync with Search
        if (profile) {
            searchService.indexCandidate(profile).catch((err: any) => console.error('Failed to index candidate (resume upload)', err));
        }

        // GA4: track resume_uploaded
        trackEvent(getClientId(userId), { name: 'resume_uploaded' }).catch(() => {});

        return profile;
    }

    /**
     * Upload Profile Image (Avatar)
     */
    async uploadProfileImage(userId: string, file: Express.Multer.File) {
        const uploadResult = await uploadImage(profileImageBufferOrPath(file), uploadOptions.profileImage);

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
                include: { user: true }
            }),
            prisma.user.update({
                where: { id: userId },
                data: { avatar: uploadResult.secure_url },
            }),
        ]);

        // Sync with Search
        if (candidateProfile) {
            searchService.indexCandidate(candidateProfile).catch((err: any) => console.error('Failed to index candidate (image upload)', err));
        }

        return candidateProfile;
    }

    /**
     * Remove Profile Image (Avatar)
     */
    async removeProfileImage(userId: string) {
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
    }

    /**
     * Search Candidates (Employer Only)
     */
    async searchCandidates(query: string, filters: {
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
        latitude?: number;
        longitude?: number;
        radiusKm?: number;
        sortBy?: string;
        page?: number;
        limit?: number;
    }) {
        try {
            const { hits, total } = await searchService.searchCandidates(query || filters.keyword, {
                ...filters,
                from: ((filters.page || PAGINATION.DEFAULT_PAGE) - 1) * (filters.limit || PAGINATION.DEFAULT_LIMIT),
                size: filters.limit || PAGINATION.DEFAULT_LIMIT,
            });

            return {
                candidates: hits,
                pagination: {
                    total,
                    page: filters.page || PAGINATION.DEFAULT_PAGE,
                    limit: filters.limit || PAGINATION.DEFAULT_LIMIT,
                    pages: Math.ceil(total / (filters.limit || PAGINATION.DEFAULT_LIMIT)),
                },
            };
        } catch (error) {
            console.warn('Elasticsearch candidate search failed, falling back to DB', error);

            const page = filters.page || PAGINATION.DEFAULT_PAGE;
            const limit = filters.limit || PAGINATION.DEFAULT_LIMIT;
            const skip = (page - 1) * limit;

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
                    title: [{ headline: { contains: kw, mode: 'insensitive' } }, { currentRole: { contains: kw, mode: 'insensitive' } }],
                    skills: [], // skills are string[] — handled by hasSome below
                    designation: [{ currentRole: { contains: kw, mode: 'insensitive' } }, { headline: { contains: kw, mode: 'insensitive' } }],
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
                    take: limit,
                    orderBy: { updatedAt: 'desc' },
                }),
                prisma.candidateProfile.count({ where }),
            ]);

            return {
                candidates,
                pagination: { total, page, limit, pages: Math.ceil(total / limit) },
            };
        }
    }

    /**
     * Get profile completeness percentage
     */
    async getProfileCompleteness(userId: string) {
        const [profile, user] = await prisma.$transaction([
            prisma.candidateProfile.findUnique({ where: { userId } }),
            prisma.user.findUnique({ where: { id: userId } }),
        ]);
        if (!profile || !user) return { percentage: 0, completed: [], missing: ['Create your profile'] };

        const checks = [
            { field: 'Personal Info', weight: 12, check: !!(profile.gender && profile.dob && user.firstName && user.lastName) },
            { field: 'Contact', weight: 6, check: !!(profile.phone || (user as any).mobileNumber) },
            { field: 'Professional', weight: 12, check: !!(profile.currentRole && profile.experienceYears > 0) },
            { field: 'Skills', weight: 10, check: profile.skills.length > 0 },
            { field: 'Education', weight: 10, check: !!(profile.education && (profile.education as any[]).length > 0) },
            { field: 'Experience', weight: 10, check: !!(profile.experience && (profile.experience as any[]).length > 0) },
            { field: 'Resume', weight: 5, check: !!profile.resume },
            { field: 'Headline', weight: 5, check: !!profile.headline },
            { field: 'Preferences', weight: 5, check: !!(profile.preferredWorkMode.length > 0 || profile.preferredJobType.length > 0 || profile.willingToRelocate !== null) },
            { field: 'Certifications/Projects', weight: 5, check: !!((profile.certifications as any[])?.length > 0 || (profile.projects as any[])?.length > 0) },
            { field: 'Language Proficiency', weight: 5, check: !!((profile.languageProficiency as any[])?.length > 0) },
            { field: 'Social Profiles', weight: 5, check: !!(profile.linkedinProfile || profile.githubProfile || profile.portfolioUrl) },
            { field: 'Publications/Patents/Volunteer', weight: 3, check: !!((profile.publications as any[])?.length || (profile.patents as any[])?.length || (profile.volunteerExperience as any[])?.length) },
            { field: 'Interests/Hobbies', weight: 3, check: !!(profile.interests.length > 0 || profile.hobbies.length > 0) },
            { field: 'References', weight: 2, check: !!((profile.references as any[])?.length > 0) },
            { field: 'Documents', weight: 2, check: !!(profile.passportNumber || profile.hasDrivingLicense) },
        ];

        const completed = checks.filter(c => c.check).map(c => c.field);
        const missing = checks.filter(c => !c.check).map(c => c.field);
        const percentage = checks.reduce((acc, c) => acc + (c.check ? c.weight : 0), 0);

        return { percentage, completed, missing };
    }
    /**
     * Get Candidate Dashboard Statistics
     */
    async getCandidateDashboard(userId: string) {
        const [user, profile, applicationStats, savedJobsCount, profileViewsWeek, profileViewsMonth] = await prisma.$transaction([
            prisma.user.findUnique({
                where: { id: userId },
                select: {
                    isEmailVerified: true, isMobileVerified: true, isWhatsappVerified: true,
                    lastActiveAt: true, lastLoginAt: true,
                }
            }),
            prisma.candidateProfile.findUnique({
                where: { userId },
                select: { profileCompleteness: true, updatedAt: true }
            }),
            prisma.jobApplication.groupBy({
                by: ['status'],
                where: { candidate: { userId } },
                orderBy: { status: 'asc' },
                _count: { _all: true },
            }),
            prisma.savedJob.count({ where: { userId } }),
            prisma.profileView.count({
                where: { profileUserId: userId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
            }),
            prisma.profileView.count({
                where: { profileUserId: userId, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
            }),
        ]);

        const totalApplications = applicationStats.reduce((sum, s) => sum + ((s._count as { _all: number })?._all ?? 0), 0);

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
                byStatus: Object.fromEntries(applicationStats.map(s => [s.status, (s._count as { _all: number })?._all ?? 0])),
            },
            savedJobsCount,
            profileViews: { week: profileViewsWeek, month: profileViewsMonth },
        };
    }

    /**
     * Get candidate public profile (for employer viewing)
     */
    async getCandidatePublicProfile(candidateUserId: string) {
        const profile = await prisma.candidateProfile.findFirst({
            where: { userId: candidateUserId },
            include: {
                user: {
                    select: {
                        id: true, firstName: true, lastName: true, email: true, avatar: true,
                        isEmailVerified: true, isMobileVerified: true, isWhatsappVerified: true,
                        lastActiveAt: true,
                    }
                }
            }
        });
        if (!profile) throw new AppError('Candidate not found', 404);
        return profile;
    }
}

// Helper to handle Multer file -> Buffer/Base64 for Cloudinary
const profileImageBufferOrPath = (file: Express.Multer.File): string | Buffer => {
    return file.buffer;
};

export const candidateService = new CandidateService();
