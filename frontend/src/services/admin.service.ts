import api from '@/lib/api';
import { API } from '@/constants/api';
import { buildQueryString } from '@/lib/utils';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { AdminStats, UserListItem, UserDetail, AuditLog, AuditLogFilters, AnalyticsData, AnalyticsFilters, SystemConfig, SuspendUserRequest, UpdateUserRoleRequest, FlagJobRequest, CreateUserRequest, UpdateUserProfileRequest, AdminResetPasswordRequest, UserSession, DailyActiveUsersData, AdminApplication, ApplicationStats } from '@/types/admin';

/* eslint-disable @typescript-eslint/no-explicit-any */

function transformStats(body: any): ApiResponse<AdminStats> {
    const d = body.data;
    return {
        ...body,
        data: {
            totalUsers: d?.users?.total ?? d?.totalUsers ?? 0,
            totalCandidates: d?.users?.candidates ?? d?.totalCandidates ?? 0,
            totalEmployers: d?.users?.employers ?? d?.totalEmployers ?? 0,
            totalJobs: d?.jobs?.total ?? d?.totalJobs ?? 0,
            activeJobs: d?.jobs?.active ?? d?.activeJobs ?? 0,
            totalApplications: d?.applications?.total ?? d?.totalApplications ?? 0,
            newUsersToday: d?.newUsersToday ?? 0,
            newUsersThisWeek: d?.newUsersThisWeek ?? 0,
            newUsersThisMonth: d?.newUsersThisMonth ?? 0,
            pendingVerifications: d?.verifications?.pending ?? d?.pendingVerifications ?? 0,
        },
    };
}

export const adminService = {
    async getStats(): Promise<ApiResponse<AdminStats>> {
        const res = await api.get(API.ADMIN.STATS);
        return transformStats(res.data);
    },

    async getComprehensiveStats(): Promise<ApiResponse<AdminStats>> {
        const res = await api.get(API.ADMIN.COMPREHENSIVE_STATS);
        return transformStats(res.data);
    },

    async getActivity(): Promise<ApiResponse<Array<{ action: string; user: string; timestamp: string }>>> {
        const res = await api.get(API.ADMIN.ACTIVITY);
        return res.data;
    },

    async getUsers(filters?: Record<string, string | number | undefined>): Promise<PaginatedResponse<UserListItem>> {
        const qs = buildQueryString((filters || {}) as Record<string, string | undefined>);
        const res = await api.get(`${API.ADMIN.USERS}${qs}`);
        const body = res.data;
        const d = body.data;
        // Backend: {users[], total, page, limit} → Frontend: PaginatedResponse {items[], total, page, limit, totalPages, hasMore}
        const users = d?.users ?? d?.items ?? [];
        const total = d?.total ?? 0;
        const page = d?.page ?? 1;
        const limit = d?.limit ?? 10;
        const totalPages = d?.totalPages ?? (Math.ceil(total / limit) || 1);
        return {
            ...body,
            data: {
                items: users,
                total,
                page,
                limit,
                totalPages,
                hasMore: d?.hasMore ?? page < totalPages,
            },
        };
    },

    async getUserDetails(id: string): Promise<ApiResponse<UserDetail>> {
        const res = await api.get(API.ADMIN.USER_DETAIL(id));
        return res.data;
    },

    async deleteUser(id: string): Promise<ApiResponse<null>> {
        const res = await api.delete(API.ADMIN.DELETE_USER(id));
        return res.data;
    },

    async suspendUser(id: string, data: SuspendUserRequest): Promise<ApiResponse<null>> {
        const res = await api.patch(API.ADMIN.SUSPEND_USER(id), data);
        return res.data;
    },

    async activateUser(id: string): Promise<ApiResponse<null>> {
        const res = await api.patch(API.ADMIN.ACTIVATE_USER(id));
        return res.data;
    },

    async updateUserRole(id: string, data: UpdateUserRoleRequest): Promise<ApiResponse<null>> {
        const res = await api.patch(API.ADMIN.UPDATE_USER_ROLE(id), data);
        return res.data;
    },

    async moderateJob(id: string, data: { status: string; reason?: string }): Promise<ApiResponse<null>> {
        const res = await api.patch(API.ADMIN.MODERATE_JOB(id), data);
        return res.data;
    },

    async flagJob(id: string, data: FlagJobRequest): Promise<ApiResponse<null>> {
        const res = await api.patch(API.ADMIN.FLAG_JOB(id), data);
        return res.data;
    },

    async getAnalytics(filters?: AnalyticsFilters): Promise<ApiResponse<AnalyticsData[]>> {
        const qs = buildQueryString((filters || {}) as Record<string, string | undefined>);
        const res = await api.get(`${API.ADMIN.ANALYTICS}${qs}`);
        const body = res.data;
        const d = body.data;
        // Backend may return a single summary object → Frontend expects AnalyticsData[]
        if (Array.isArray(d)) return body;
        return {
            ...body,
            data: [{
                period: d?.period ?? filters?.groupBy ?? 'month',
                registrations: d?.newRegistrations ?? d?.registrations ?? 0,
                jobPostings: d?.newJobs ?? d?.jobPostings ?? 0,
                applications: d?.totalApplications ?? d?.applications ?? 0,
            }],
        };
    },

    async getAuditLogs(filters?: AuditLogFilters): Promise<PaginatedResponse<AuditLog>> {
        const qs = buildQueryString((filters || {}) as Record<string, string | number | undefined>);
        const res = await api.get(`${API.ADMIN.AUDIT_LOGS}${qs}`);
        const body = res.data;
        const d = body.data;
        // Backend: {logs[], pagination:{total, page, limit, pages}} → Frontend: PaginatedResponse
        const logs = d?.logs ?? d?.items ?? [];
        const pagination = d?.pagination ?? {};
        const total = pagination.total ?? d?.total ?? 0;
        const page = pagination.page ?? d?.page ?? 1;
        const limit = pagination.limit ?? d?.limit ?? 10;
        const totalPages = pagination.pages ?? d?.totalPages ?? (Math.ceil(total / limit) || 1);
        return {
            ...body,
            data: {
                items: logs,
                total,
                page,
                limit,
                totalPages,
                hasMore: d?.hasMore ?? page < totalPages,
            },
        };
    },

    async createAdmin(data: { email: string; firstName: string; lastName: string; password: string }): Promise<ApiResponse<null>> {
        const res = await api.post(API.SUPER_ADMIN.CREATE_ADMIN, data);
        return res.data;
    },

    async listAdmins(): Promise<ApiResponse<UserListItem[]>> {
        const res = await api.get(API.SUPER_ADMIN.LIST_ADMINS);
        return res.data;
    },

    async removeAdmin(id: string): Promise<ApiResponse<null>> {
        const res = await api.delete(API.SUPER_ADMIN.REMOVE_ADMIN(id));
        return res.data;
    },

    async getSystemConfig(): Promise<ApiResponse<SystemConfig[]>> {
        const res = await api.get(API.SUPER_ADMIN.GET_CONFIG);
        const body = res.data;
        const d = body.data;
        // Backend returns flat Record<string, any> → Frontend expects SystemConfig[]
        if (Array.isArray(d)) return body;
        return {
            ...body,
            data: Object.entries(d ?? {}).map(([key, value]) => ({
                key,
                value: String(value),
            })),
        };
    },

    async updateSystemConfig(key: string, value: string): Promise<ApiResponse<null>> {
        // Backend expects {key, value} body
        const res = await api.patch(API.SUPER_ADMIN.UPDATE_CONFIG, { key, value });
        return res.data;
    },

    async exportUsers(): Promise<Blob> {
        const res = await api.get(API.ADMIN.REPORTS.USERS, { responseType: 'blob' });
        return res.data;
    },

    async exportJobs(): Promise<Blob> {
        const res = await api.get(API.ADMIN.REPORTS.JOBS, { responseType: 'blob' });
        return res.data;
    },

    async exportAnalytics(period: 'week' | 'month' | 'year'): Promise<Blob> {
        const res = await api.get(API.ADMIN.REPORTS.ANALYTICS, {
            params: { period },
            responseType: 'blob'
        });
        return res.data;
    },

    // ── Super-Admin User Management ──

    async createUser(data: CreateUserRequest): Promise<ApiResponse<null>> {
        const res = await api.post(API.SUPER_ADMIN.CREATE_USER, data);
        return res.data;
    },

    async updateUserProfile(id: string, data: UpdateUserProfileRequest): Promise<ApiResponse<null>> {
        const res = await api.patch(API.SUPER_ADMIN.UPDATE_USER_PROFILE(id), data);
        return res.data;
    },

    async sendPasswordResetOtp(id: string): Promise<ApiResponse<null>> {
        const res = await api.post(API.SUPER_ADMIN.SEND_PASSWORD_RESET_OTP(id));
        return res.data;
    },

    async resetUserPassword(id: string, data: AdminResetPasswordRequest): Promise<ApiResponse<null>> {
        const res = await api.patch(API.SUPER_ADMIN.RESET_USER_PASSWORD(id), data);
        return res.data;
    },

    async deactivateUser(id: string): Promise<ApiResponse<null>> {
        const res = await api.patch(API.SUPER_ADMIN.DEACTIVATE_USER(id));
        return res.data;
    },

    async uploadUserAvatar(id: string, file: File): Promise<ApiResponse<{ avatar: string }>> {
        const formData = new FormData();
        formData.append('avatar', file);
        const res = await api.post(API.SUPER_ADMIN.UPLOAD_USER_AVATAR(id), formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
    },

    async removeUserAvatar(id: string): Promise<ApiResponse<null>> {
        const res = await api.delete(API.SUPER_ADMIN.REMOVE_USER_AVATAR(id));
        return res.data;
    },

    async getUserSessions(id: string): Promise<ApiResponse<UserSession[]>> {
        const res = await api.get(API.SUPER_ADMIN.USER_SESSIONS(id));
        return res.data;
    },

    async revokeUserSessions(id: string): Promise<ApiResponse<null>> {
        const res = await api.delete(API.SUPER_ADMIN.REVOKE_USER_SESSIONS(id));
        return res.data;
    },

    // ── Daily Active Users ──

    async getDailyActiveUsers(days?: number): Promise<ApiResponse<DailyActiveUsersData[]>> {
        const qs = days ? `?days=${days}` : '';
        const res = await api.get(`${API.ADMIN.DAILY_ACTIVE_USERS}${qs}`);
        return res.data;
    },

    // ── Content Moderation ──

    async getModerationKeywords(): Promise<ApiResponse<string[]>> {
        const res = await api.get(API.ADMIN.MODERATION_KEYWORDS);
        return res.data;
    },

    async addModerationKeyword(keyword: string): Promise<ApiResponse<string[]>> {
        const res = await api.post(API.ADMIN.MODERATION_KEYWORDS, { keyword });
        return res.data;
    },

    async removeModerationKeyword(keyword: string): Promise<ApiResponse<string[]>> {
        const res = await api.delete(API.ADMIN.MODERATION_KEYWORD_DELETE(keyword));
        return res.data;
    },

    // ── Admin Jobs Management ──

    async getJobs(filters?: Record<string, string | number | undefined>): Promise<PaginatedResponse<any>> {
        const qs = buildQueryString((filters || {}) as Record<string, string | undefined>);
        const res = await api.get(`${API.ADMIN.JOBS}${qs}`);
        return res.data;
    },

    async deleteAdminJob(id: string): Promise<ApiResponse<null>> {
        const res = await api.delete(API.ADMIN.DELETE_JOB(id));
        return res.data;
    },

    // ── Application Monitoring ──

    async getApplications(filters?: Record<string, string | number | undefined>): Promise<PaginatedResponse<AdminApplication>> {
        const qs = buildQueryString((filters || {}) as Record<string, string | undefined>);
        const res = await api.get(`${API.ADMIN.APPLICATIONS}${qs}`);
        return res.data;
    },

    async getApplicationStats(): Promise<ApiResponse<ApplicationStats>> {
        const res = await api.get(API.ADMIN.APPLICATION_STATS);
        return res.data;
    },
};
