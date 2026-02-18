import api from '@/lib/api';
import { API } from '@/constants/api';
import { buildQueryString } from '@/lib/utils';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { Job } from '@/types/job';

export const recommendationService = {
    async getRecommendedJobs(): Promise<ApiResponse<any[]>> {
        const res = await api.get(API.RECOMMENDATIONS.JOBS);
        return res.data;
    },

    async getRecommendationFeed(filters?: { workMode?: string; type?: string; experienceLevel?: string; page?: string; limit?: string }): Promise<PaginatedResponse<Job>> {
        const qs = filters ? buildQueryString(filters as Record<string, string | undefined>) : '';
        const res = await api.get(`${API.RECOMMENDATIONS.JOBS}${qs}`);
        return res.data;
    },

    async dismissRecommendation(jobId: string): Promise<ApiResponse<null>> {
        const res = await api.post(API.RECOMMENDATIONS.DISMISS_JOB(jobId));
        return res.data;
    },

    async getRecommendedCandidates(jobId: string): Promise<ApiResponse<any[]>> {
        const res = await api.get(API.RECOMMENDATIONS.CANDIDATES(jobId));
        return res.data;
    },
};
