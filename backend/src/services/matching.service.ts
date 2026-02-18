import { prisma } from '../config/prisma';
import elasticClient from '../config/elasticsearch';
import { ELASTIC_INDICES } from '../constants';
import logger from '../config/logger';

// Education level hierarchy for comparison
const EDUCATION_RANK: Record<string, number> = {
    TENTH: 1, TWELFTH: 2, DIPLOMA: 3, BACHELORS: 4, MASTERS: 5, PHD: 6, POST_DOCTORAL: 7,
};

// Notice period urgency — lower = more available
const NOTICE_RANK: Record<string, number> = {
    IMMEDIATE: 1, FIFTEEN_DAYS: 2, ONE_MONTH: 3, TWO_MONTHS: 4, THREE_MONTHS: 5, SIX_MONTHS: 6,
};

interface CandidateMatch {
    userId: string;
    candidateId: string;
    score: number;
    fullName: string;
}

interface JobMatch {
    jobId: string;
    score: number;
    title: string;
    companyName: string;
}

/**
 * Matching Engine — 8-dimension weighted scoring
 *
 * | Dimension        | Weight |
 * |------------------|--------|
 * | Skills overlap   | 30%    |
 * | Experience fit   | 15%    |
 * | Salary overlap   | 15%    |
 * | Location match   | 10%    |
 * | Industry match   | 8%     |
 * | Work mode match  | 8%     |
 * | Education match  | 7%     |
 * | Notice period    | 7%     |
 */
class MatchingService {
    /**
     * Find candidates that match a given job posting.
     */
    async findMatchingCandidates(jobId: string): Promise<CandidateMatch[]> {
        const job = await prisma.jobPost.findUnique({
            where: { id: jobId },
            include: { company: true },
        });

        if (!job) {
            logger.warn(`Matching: job ${jobId} not found`);
            return [];
        }

        const skills: string[] = (job.skillsRequired as string[]) || [];
        const functions: any[] = [];

        // 1. Skills overlap (30%)
        if (skills.length > 0) {
            functions.push({
                filter: { terms: { skills } },
                weight: 30,
            });
        }

        // 2. Experience fit (15%)
        if (job.experienceMin !== null || job.experienceMax !== null) {
            functions.push({
                filter: {
                    range: {
                        experienceYears: {
                            ...(job.experienceMin !== null ? { gte: job.experienceMin } : {}),
                            ...(job.experienceMax !== null ? { lte: job.experienceMax } : {}),
                        },
                    },
                },
                weight: 15,
            });
        }

        // 3. Salary overlap (15%)
        if (job.salaryMin !== null || job.salaryMax !== null) {
            functions.push({
                filter: {
                    bool: {
                        should: [
                            ...(job.salaryMax !== null
                                ? [{ range: { expectedSalaryMin: { lte: job.salaryMax } } }]
                                : []),
                            ...(job.salaryMin !== null
                                ? [{ range: { expectedSalaryMax: { gte: job.salaryMin } } }]
                                : []),
                        ],
                    },
                },
                weight: 15,
            });
        }

        // 4. Location match (10%)
        if (job.location) {
            functions.push({
                filter: {
                    bool: {
                        should: [
                            { match: { currentLocation: job.location } },
                            { term: { preferredLocations: job.location } },
                            { term: { city: job.location } },
                        ],
                    },
                },
                weight: 10,
            });
        }

        // 5. Industry match (8%)
        if (job.industry) {
            functions.push({
                filter: { term: { currentIndustry: job.industry } },
                weight: 8,
            });
        }

        // 6. Work mode match (8%)
        if (job.workMode) {
            functions.push({
                filter: { term: { preferredWorkMode: job.workMode } },
                weight: 8,
            });
        }

        // 7. Education match (7%) — candidates whose education >= required
        if (job.educationRequired) {
            const requiredRank = EDUCATION_RANK[job.educationRequired] || 0;
            // Match candidates with education at or above required level
            const qualifyingLevels = Object.entries(EDUCATION_RANK)
                .filter(([, rank]) => rank >= requiredRank)
                .map(([level]) => level);
            if (qualifyingLevels.length > 0) {
                functions.push({
                    filter: {
                        nested: {
                            path: 'education',
                            query: { terms: { 'education.degree': qualifyingLevels } },
                        },
                    },
                    weight: 7,
                });
            }
        }

        // 8. Notice period fit (7%) — for URGENT/IMMEDIATE jobs, boost short-notice candidates
        if (job.urgencyLevel === 'URGENT' || job.urgencyLevel === 'IMMEDIATE') {
            functions.push({
                filter: {
                    terms: { noticePeriod: ['IMMEDIATE', 'FIFTEEN_DAYS'] },
                },
                weight: 7,
            });
        } else {
            // For normal jobs, boost any candidate with reasonable notice
            functions.push({
                filter: {
                    terms: { noticePeriod: ['IMMEDIATE', 'FIFTEEN_DAYS', 'ONE_MONTH', 'TWO_MONTHS'] },
                },
                weight: 7,
            });
        }

        // Base query
        const baseQuery: any =
            skills.length > 0
                ? {
                      bool: {
                          should: [{ terms: { skills } }],
                          minimum_should_match: 0,
                      },
                  }
                : { match_all: {} };

        try {
            const result = await (elasticClient.search as any)({
                index: ELASTIC_INDICES.CANDIDATES,
                size: 50,
                query: {
                    function_score: {
                        query: baseQuery,
                        functions,
                        score_mode: 'sum',
                        boost_mode: 'replace',
                        max_boost: 100,
                    },
                },
                min_score: 0.3,
            });

            const hits = result.hits.hits || [];
            const maxScore = hits.length > 0 ? Math.max(...hits.map((h: any) => h._score)) : 1;

            return hits.map((hit: any) => ({
                userId: hit._source.userId,
                candidateId: hit._source.id,
                score: maxScore > 0 ? hit._score / maxScore : 0,
                fullName: hit._source.fullName || '',
            }));
        } catch (error) {
            logger.error(`Failed to find matching candidates for job ${jobId}`, error);
            return [];
        }
    }

    /**
     * Find jobs that match a given candidate's profile.
     */
    async findMatchingJobs(userId: string): Promise<JobMatch[]> {
        const candidate = await prisma.candidateProfile.findUnique({
            where: { userId },
            include: { user: true },
        });

        if (!candidate) {
            logger.warn(`Matching: candidate profile for user ${userId} not found`);
            return [];
        }

        const skills: string[] = (candidate.skills as string[]) || [];
        const functions: any[] = [];

        // 1. Skills overlap (30%)
        if (skills.length > 0) {
            functions.push({
                filter: { terms: { skills } },
                weight: 30,
            });
        }

        // 2. Experience fit (15%)
        if (candidate.experienceYears !== null) {
            functions.push({
                filter: {
                    bool: {
                        must: [
                            { range: { experienceMin: { lte: candidate.experienceYears } } },
                            { range: { experienceMax: { gte: candidate.experienceYears } } },
                        ],
                    },
                },
                weight: 15,
            });
        }

        // 3. Salary overlap (15%)
        if (candidate.expectedSalaryMin || candidate.expectedSalaryMax) {
            const salaryFilter: any[] = [];
            if (candidate.expectedSalaryMin) {
                salaryFilter.push({ range: { salaryMax: { gte: candidate.expectedSalaryMin } } });
            }
            if (candidate.expectedSalaryMax) {
                salaryFilter.push({ range: { salaryMin: { lte: candidate.expectedSalaryMax } } });
            }
            functions.push({
                filter: { bool: { should: salaryFilter } },
                weight: 15,
            });
        }

        // 4. Location match (10%)
        const locations: string[] = (candidate.preferredLocations as string[]) || [];
        if (candidate.currentLocation || locations.length > 0) {
            const locationShould: any[] = [];
            if (candidate.currentLocation) {
                locationShould.push({ match: { location: candidate.currentLocation } });
            }
            if (locations.length > 0) {
                locationShould.push({ terms: { 'location.keyword': locations } });
            }
            functions.push({
                filter: { bool: { should: locationShould } },
                weight: 10,
            });
        }

        // 5. Industry match (8%)
        if (candidate.currentIndustry) {
            functions.push({
                filter: { term: { industry: candidate.currentIndustry } },
                weight: 8,
            });
        }

        // 6. Work mode match (8%)
        const preferredWorkModes = (candidate.preferredWorkMode as string[]) || [];
        if (preferredWorkModes.length > 0) {
            functions.push({
                filter: { terms: { workMode: preferredWorkModes } },
                weight: 8,
            });
        }

        // 7. Education match (7%) — boost jobs that require at or below candidate's education
        // (We use a simple approach: just boost if any education level matches)
        if (candidate.education && (candidate.education as any[]).length > 0) {
            functions.push({
                filter: { exists: { field: 'educationRequired' } },
                weight: 7,
            });
        }

        // 8. Notice period fit (7%) — boost urgent jobs if candidate is immediately available
        if (candidate.noticePeriod) {
            const noticeRank = NOTICE_RANK[candidate.noticePeriod] || 99;
            if (noticeRank <= 2) {
                // Candidate is immediately/quickly available — boost urgent jobs
                functions.push({
                    filter: { terms: { urgencyLevel: ['URGENT', 'IMMEDIATE'] } },
                    weight: 7,
                });
            } else {
                // Standard availability — boost normal urgency
                functions.push({
                    filter: { terms: { urgencyLevel: ['NORMAL', 'URGENT'] } },
                    weight: 7,
                });
            }
        }

        // Base query: open jobs, optionally matching skills
        const baseQuery: any = {
            bool: {
                must: [{ term: { status: 'OPEN' } }],
                ...(skills.length > 0
                    ? { should: [{ terms: { skills } }], minimum_should_match: 0 }
                    : {}),
            },
        };

        try {
            const result = await (elasticClient.search as any)({
                index: ELASTIC_INDICES.JOBS,
                size: 20,
                query: {
                    function_score: {
                        query: baseQuery,
                        functions,
                        score_mode: 'sum',
                        boost_mode: 'replace',
                        max_boost: 100,
                    },
                },
                min_score: 0.3,
            });

            const hits = result.hits.hits || [];
            const maxScore = hits.length > 0 ? Math.max(...hits.map((h: any) => h._score)) : 1;

            return hits.map((hit: any) => ({
                jobId: hit._source.id,
                score: maxScore > 0 ? hit._score / maxScore : 0,
                title: hit._source.title || '',
                companyName: hit._source.companyName || '',
            }));
        } catch (error) {
            logger.error(`Failed to find matching jobs for user ${userId}`, error);
            return [];
        }
    }

    /**
     * Calculate skills overlap with proficiency weighting.
     * EXPERT=1.0, ADVANCED=0.75, INTERMEDIATE=0.5, BEGINNER=0.25
     */
    calculateSkillsOverlap(candidateSkills: string[], requiredSkills: string[], skillsWithProficiency?: any[]): number {
        if (!candidateSkills.length || !requiredSkills.length) return 0;

        const requiredSet = new Set(requiredSkills.map(s => s.toLowerCase()));

        // If proficiency data exists, use weighted scoring
        if (skillsWithProficiency && skillsWithProficiency.length > 0) {
            const proficiencyWeights: Record<string, number> = {
                EXPERT: 1.0, ADVANCED: 0.75, INTERMEDIATE: 0.5, BEGINNER: 0.25,
            };
            const profMap = new Map<string, number>();
            for (const sp of skillsWithProficiency) {
                profMap.set(sp.skill.toLowerCase(), proficiencyWeights[sp.proficiency] || 0.5);
            }

            let weightedScore = 0;
            let maxPossible = requiredSet.size;
            for (const skill of requiredSet) {
                if (profMap.has(skill)) {
                    weightedScore += profMap.get(skill)!;
                }
            }
            return maxPossible > 0 ? weightedScore / maxPossible : 0;
        }

        // Fallback: Jaccard similarity
        const setA = new Set(candidateSkills.map(s => s.toLowerCase()));
        let intersection = 0;
        for (const skill of setA) {
            if (requiredSet.has(skill)) intersection++;
        }
        const union = new Set([...setA, ...requiredSet]).size;
        return union > 0 ? intersection / union : 0;
    }
}

export const matchingService = new MatchingService();
