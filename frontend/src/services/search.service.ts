import api from '@/lib/api';
import type { ApiResponse } from '@/types/api';
import type {
    AutocompleteResult,
    SuggestionItem,
    SearchHistoryItem,
    PopularSearch,
} from '@/types/search';

const BASE = '/search';

export const searchService = {
    async autocomplete(
        q: string,
        type: 'jobs' | 'candidates' | 'all' = 'all',
        limit: number = 10,
    ): Promise<ApiResponse<{ suggestions: AutocompleteResult[] }>> {
        const res = await api.get(`${BASE}/autocomplete`, { params: { q, type, limit } });
        return res.data;
    },

    async suggestSkills(q: string, limit: number = 15): Promise<ApiResponse<{ suggestions: SuggestionItem[] }>> {
        const res = await api.get(`${BASE}/suggest/skills`, { params: { q, limit } });
        return res.data;
    },

    async suggestLocations(q: string, limit: number = 10): Promise<ApiResponse<{ suggestions: SuggestionItem[] }>> {
        const res = await api.get(`${BASE}/suggest/locations`, { params: { q, limit } });
        return res.data;
    },

    async suggestCompanies(q: string, limit: number = 10): Promise<ApiResponse<{ suggestions: SuggestionItem[] }>> {
        const res = await api.get(`${BASE}/suggest/companies`, { params: { q, limit } });
        return res.data;
    },

    async suggestJobTitles(q: string, limit: number = 10): Promise<ApiResponse<{ suggestions: SuggestionItem[] }>> {
        const res = await api.get(`${BASE}/suggest/titles`, { params: { q, limit } });
        return res.data;
    },

    async didYouMean(q: string, index: 'jobs' | 'candidates' = 'jobs'): Promise<ApiResponse<{ suggestion: string | null }>> {
        const res = await api.get(`${BASE}/did-you-mean`, { params: { q, index } });
        return res.data;
    },

    async getSearchHistory(limit: number = 10): Promise<ApiResponse<{ history: SearchHistoryItem[] }>> {
        const res = await api.get(`${BASE}/history`, { params: { limit } });
        return res.data;
    },

    async addToSearchHistory(query: string, type: 'job' | 'candidate'): Promise<void> {
        await api.post(`${BASE}/history`, { query, type });
    },

    async clearSearchHistory(): Promise<void> {
        await api.delete(`${BASE}/history`);
    },

    async getPopularSearches(limit: number = 10): Promise<ApiResponse<{ searches: PopularSearch[] }>> {
        const res = await api.get(`${BASE}/popular`, { params: { limit } });
        return res.data;
    },
};
