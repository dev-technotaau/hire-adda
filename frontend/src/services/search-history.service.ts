/**
 * Frontend client for /api/v1/public/search-history.
 * Optional auth — works for guests via the `ha_search_session` cookie
 * managed by the BFF, and auto-binds to the user's history once logged in.
 */
import api from '@/lib/api';

export type SearchHistoryType = 'JOB' | 'CANDIDATE' | 'COMPANY';

export interface SearchHistoryEntry {
  id: string;
  userId: string | null;
  sessionId: string | null;
  searchType: SearchHistoryType;
  filters: Record<string, unknown>;
  filtersHash: string;
  query: string | null;
  location: string | null;
  resultsCount: number;
  hits: number;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
  /** Computed delta: how many new matching jobs/companies since last seen. */
  newCount: number;
}

interface BackendEnvelope<T> {
  status?: string;
  data: T;
}

export const searchHistoryService = {
  async list(type: SearchHistoryType, limit = 12): Promise<SearchHistoryEntry[]> {
    const { data } = await api.get<BackendEnvelope<{ items: SearchHistoryEntry[] }>>(
      '/public/search-history',
      { params: { type, limit } },
    );
    return data?.data?.items ?? [];
  },

  async record(input: {
    searchType: SearchHistoryType;
    filters: Record<string, unknown>;
    query?: string;
    location?: string;
    resultsCount?: number;
  }): Promise<SearchHistoryEntry | null> {
    const { data } = await api.post<BackendEnvelope<SearchHistoryEntry | null>>(
      '/public/search-history',
      input,
    );
    return data?.data ?? null;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/public/search-history/${encodeURIComponent(id)}`);
  },

  /** Called by the auth flow on successful login. */
  async migrate(sessionId?: string): Promise<{ migrated: number; dedup: number }> {
    const { data } = await api.post<BackendEnvelope<{ migrated: number; dedup: number }>>(
      '/public/search-history/migrate',
      sessionId ? { sessionId } : {},
    );
    return data?.data ?? { migrated: 0, dedup: 0 };
  },
};
