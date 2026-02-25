import api from '@/lib/api';
import { API } from '@/constants/api';
import type { ApiResponse } from '@/types/api';
import type { Session } from '@/types/auth';

export const sessionService = {
  async listSessions(): Promise<ApiResponse<Session[]>> {
    const res = await api.get(API.SESSIONS.LIST);
    const data = res.data as ApiResponse<Session[]>;
    // Map backend field names to UI-friendly aliases
    if (data.data) {
      data.data = data.data.map((session, index) => ({
        ...session,
        deviceInfo: session.userAgent || session.deviceInfo || null,
        lastActive: session.lastSeenAt || session.lastActive || session.createdAt,
        isCurrent: index === 0, // First session (most recent) is assumed current
      }));
    }
    return data;
  },

  async revokeSession(id: string): Promise<ApiResponse<null>> {
    const res = await api.delete(API.SESSIONS.REVOKE(id));
    return res.data;
  },

  async revokeAllSessions(): Promise<ApiResponse<null>> {
    const res = await api.delete(API.SESSIONS.REVOKE_ALL);
    return res.data;
  },
};
