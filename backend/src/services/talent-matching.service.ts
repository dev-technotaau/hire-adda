import { jobClient } from '../config/talent';
import { env } from '../config/env';
import logger from '../config/logger';
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('talent-matching-service');

const TENANT_ID = 'default-tenant';

function getTenantName(): string {
    return `projects/${env.GOOGLE_CLOUD_PROJECT_ID}/tenants/${TENANT_ID}`;
}

export const talentMatchingService = {
    /**
     * Mirror a job to Cloud Talent index (fire-and-forget, best-effort).
     */
    async syncJobToTalent(jobPost: {
        id: string;
        title: string;
        description: string | null;
        location: string | null;
        company: { companyName: string } | null;
        skills: string[];
        jobType: string;
    }): Promise<void> {
        if (!jobClient || !env.GOOGLE_CLOUD_PROJECT_ID) return;

        await tracer.startActiveSpan('cloudtalent.syncJob', async (span) => {
            span.setAttribute('cloud.service', 'cloud-talent');
            span.setAttribute('cloud.operation', 'createJob');
            span.setAttribute('job.id', jobPost.id);
            try {
                const parent = getTenantName();
                await jobClient!.createJob({
                    parent,
                    job: {
                        company: parent,
                        requisitionId: jobPost.id,
                        title: jobPost.title,
                        description: jobPost.description || jobPost.title,
                        addresses: jobPost.location ? [jobPost.location] : [],
                        customAttributes: {
                            skills: {
                                stringValues: jobPost.skills,
                                filterable: true,
                            },
                        },
                    },
                });
                logger.debug(`Job ${jobPost.id} synced to Cloud Talent`);
                span.setStatus({ code: SpanStatusCode.OK });
            } catch (error) {
                span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
                logger.debug(`Cloud Talent sync failed for job ${jobPost.id}: ${(error as Error).message}`);
            } finally {
                span.end();
            }
        });
    },

    /**
     * Remove a job from Cloud Talent index.
     */
    async deleteJobFromTalent(jobId: string): Promise<void> {
        if (!jobClient || !env.GOOGLE_CLOUD_PROJECT_ID) return;

        try {
            const parent = getTenantName();
            const [jobs] = await jobClient.listJobs({
                parent,
                filter: `requisitionId="${jobId}"`,
            });

            for (const job of jobs) {
                if (job.name) {
                    await jobClient.deleteJob({ name: job.name });
                }
            }
            logger.debug(`Job ${jobId} removed from Cloud Talent`);
        } catch (error) {
            logger.debug(`Cloud Talent delete failed for job ${jobId}: ${(error as Error).message}`);
        }
    },

    /**
     * Get AI-recommended jobs for a candidate based on their profile.
     * Returns empty array if Cloud Talent is unavailable.
     */
    async getAIRecommendedJobs(candidateProfile: {
        skills: string[];
        currentRole: string | null;
        currentLocation: string | null;
        experienceYears: number;
    }): Promise<Array<{ jobId: string; matchScore: number }>> {
        if (!jobClient || !env.GOOGLE_CLOUD_PROJECT_ID) return [];

        return tracer.startActiveSpan('cloudtalent.recommendJobs', async (span) => {
            span.setAttribute('cloud.service', 'cloud-talent');
            span.setAttribute('cloud.operation', 'searchJobs');
            try {
                const parent = getTenantName();

                const query: string[] = [];
                if (candidateProfile.currentRole) {
                    query.push(candidateProfile.currentRole);
                }
                if (candidateProfile.skills.length > 0) {
                    query.push(...candidateProfile.skills.slice(0, 5));
                }

                if (query.length === 0) {
                    span.setStatus({ code: SpanStatusCode.OK });
                    span.end();
                    return [];
                }

                const [response] = await jobClient!.searchJobs({
                    parent,
                    searchMode: 'JOB_SEARCH',
                    requestMetadata: {
                        userId: 'recommendation-engine',
                        sessionId: `rec-${Date.now()}`,
                        domain: 'talentbridge.com',
                    },
                    jobQuery: {
                        query: query.join(' '),
                        locationFilters: candidateProfile.currentLocation
                            ? [{ address: candidateProfile.currentLocation }]
                            : [],
                    },
                    maxPageSize: 10,
                });

                const matchingJobs = response.matchingJobs || [];
                const results = matchingJobs.map((match) => ({
                    jobId: match.job?.requisitionId || '',
                    matchScore: match.jobTitleSnippet ? 0.9 : 0.7,
                })).filter((j) => j.jobId);
                span.setAttribute('cloud.results_count', results.length);
                span.setStatus({ code: SpanStatusCode.OK });
                span.end();
                return results;
            } catch (error) {
                span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
                span.end();
                logger.debug(`Cloud Talent recommendation failed: ${(error as Error).message}`);
                return [];
            }
        });
    },

    /**
     * Get AI-recommended candidates for a job.
     * Returns empty array if Cloud Talent is unavailable.
     */
    async getAIRecommendedCandidates(_jobPost: {
        title: string;
        skills: string[];
        location: string | null;
    }): Promise<Array<{ candidateId: string; matchScore: number }>> {
        if (!jobClient || !env.GOOGLE_CLOUD_PROJECT_ID) return [];

        try {
            // Cloud Talent's searchProfiles API can be used here
            // For now, return empty since profile indexing is separate
            logger.debug('Cloud Talent candidate recommendations not yet indexed');
            return [];
        } catch (error) {
            logger.debug(`Cloud Talent candidate recommendation failed: ${(error as Error).message}`);
            return [];
        }
    },
};
