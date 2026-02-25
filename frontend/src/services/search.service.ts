import api from '@/lib/api';
import { API } from '@/constants/api';
import type { ApiResponse } from '@/types/api';
import type {
  AutocompleteResult,
  SuggestionItem,
  SearchHistoryItem,
  PopularSearch,
} from '@/types/search';

export const searchService = {
  async autocomplete(
    q: string,
    type: 'jobs' | 'candidates' | 'all' = 'all',
    limit: number = 10,
  ): Promise<ApiResponse<{ suggestions: AutocompleteResult[] }>> {
    const res = await api.get(API.SEARCH.AUTOCOMPLETE, { params: { q, type, limit } });
    return res.data;
  },

  async suggestSkills(
    q: string,
    limit: number = 15,
  ): Promise<ApiResponse<{ suggestions: SuggestionItem[] }>> {
    const res = await api.get(API.SEARCH.SUGGEST_SKILLS, { params: { q, limit } });
    return res.data;
  },

  async suggestLocations(
    q: string,
    limit: number = 10,
  ): Promise<ApiResponse<{ suggestions: SuggestionItem[] }>> {
    const res = await api.get(API.SEARCH.SUGGEST_LOCATIONS, { params: { q, limit } });
    return res.data;
  },

  async suggestCompanies(
    q: string,
    limit: number = 10,
  ): Promise<ApiResponse<{ suggestions: SuggestionItem[] }>> {
    const res = await api.get(API.SEARCH.SUGGEST_COMPANIES, { params: { q, limit } });
    return res.data;
  },

  async suggestJobTitles(
    q: string,
    limit: number = 10,
  ): Promise<ApiResponse<{ suggestions: SuggestionItem[] }>> {
    const res = await api.get(API.SEARCH.SUGGEST_TITLES, { params: { q, limit } });
    return res.data;
  },

  async didYouMean(
    q: string,
    index: 'jobs' | 'candidates' = 'jobs',
  ): Promise<ApiResponse<{ suggestion: string | null }>> {
    const res = await api.get(API.SEARCH.DID_YOU_MEAN, { params: { q, index } });
    return res.data;
  },

  async getSearchHistory(
    limit: number = 10,
  ): Promise<ApiResponse<{ history: SearchHistoryItem[] }>> {
    const res = await api.get(API.SEARCH.HISTORY, { params: { limit } });
    return res.data;
  },

  async addToSearchHistory(query: string, type: 'job' | 'candidate'): Promise<void> {
    await api.post(API.SEARCH.HISTORY, { query, type });
  },

  async clearSearchHistory(): Promise<void> {
    await api.delete(API.SEARCH.HISTORY);
  },

  async getPopularSearches(
    limit: number = 10,
  ): Promise<ApiResponse<{ searches: PopularSearch[] }>> {
    const res = await api.get(API.SEARCH.POPULAR, { params: { limit } });
    return res.data;
  },
};
