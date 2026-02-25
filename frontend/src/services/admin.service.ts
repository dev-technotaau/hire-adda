import api from '@/lib/api';
import { API } from '@/constants/api';
import { buildQueryString } from '@/lib/utils';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
  AdminStats,
  RecentActivity,
  UserListItem,
  UserDetail,
  AuditLog,
  AuditLogFilters,
  AnalyticsData,
  AnalyticsFilters,
  SystemConfig,
  SuspendUserRequest,
  UpdateUserRoleRequest,
  FlagJobRequest,
  CreateUserRequest,
  UpdateUserProfileRequest,
  AdminResetPasswordRequest,
  UserSession,
  DailyActiveUsersData,
  AdminApplication,
  ApplicationStats,
} from '@/types/admin';
import type { Job } from '@/types/job';
import type { FeatureFlags } from '@/types/feature-flag';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      newUsersThisWeek: d?.users?.newThisWeek ?? d?.newUsersThisWeek ?? 0,
      newUsersThisMonth: d?.users?.newThisMonth ?? d?.newUsersThisMonth ?? 0,
      pendingVerifications: d?.verifications?.pending ?? d?.pendingVerifications ?? 0,
      // Comprehensive fields
      totalAdmins: d?.users?.admins,
      activeThisWeek: d?.users?.activeThisWeek,
      expiredJobs: d?.jobs?.expired,
      newJobsThisWeek: d?.jobs?.newThisWeek,
      newJobsThisMonth: d?.jobs?.newThisMonth,
      applicationsThisWeek: d?.applications?.thisWeek,
      applicationConversionRate: d?.applications?.conversionRate,
      verificationsApproved: d?.verifications?.approved,
      verificationsRejected: d?.verifications?.rejected,
      topSkills: d?.topSkills,
      topLocations: d?.topLocations,
      registrationTrends: d?.registrationTrends,
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

  async getActivity(): Promise<ApiResponse<RecentActivity>> {
    const res = await api.get(API.ADMIN.ACTIVITY);
    return res.data;
  },

  async getUsers(
    filters?: Record<string, string | number | undefined>,
  ): Promise<PaginatedResponse<UserListItem>> {
    const qs = buildQueryString((filters || {}) as Record<string, string | undefined>);
    const res = await api.get(`${API.ADMIN.USERS}${qs}`);
    return res.data;
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

  async moderateJob(
    id: string,
    data: { status: string; reason?: string },
  ): Promise<ApiResponse<null>> {
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
      data: [
        {
          period: d?.period ?? filters?.groupBy ?? 'month',
          registrations: d?.newRegistrations ?? d?.registrations ?? 0,
          jobPostings: d?.newJobs ?? d?.jobPostings ?? 0,
          applications: d?.totalApplications ?? d?.applications ?? 0,
        },
      ],
    };
  },

  async getAuditLogs(filters?: AuditLogFilters): Promise<PaginatedResponse<AuditLog>> {
    const qs = buildQueryString((filters || {}) as Record<string, string | number | undefined>);
    const res = await api.get(`${API.ADMIN.AUDIT_LOGS}${qs}`);
    return res.data;
  },

  async createAdmin(data: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
  }): Promise<ApiResponse<null>> {
    const res = await api.post(API.SUPER_ADMIN.CREATE_ADMIN, data);
    return res.data;
  },

  async listAdmins(): Promise<PaginatedResponse<UserListItem>> {
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
    // Backend returns flat Record<string, unknown> → Frontend expects SystemConfig[]
    if (Array.isArray(d)) return body;
    return {
      ...body,
      data: Object.entries(d ?? {}).map(([key, value]) => ({
        key,
        value:
          typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? ''),
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
      responseType: 'blob',
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

  async getJobs(
    filters?: Record<string, string | number | undefined>,
  ): Promise<PaginatedResponse<Job>> {
    const qs = buildQueryString((filters || {}) as Record<string, string | undefined>);
    const res = await api.get(`${API.ADMIN.JOBS}${qs}`);
    return res.data;
  },

  async deleteAdminJob(id: string): Promise<ApiResponse<null>> {
    const res = await api.delete(API.ADMIN.DELETE_JOB(id));
    return res.data;
  },

  // ── Application Monitoring ──

  async getApplications(
    filters?: Record<string, string | number | undefined>,
  ): Promise<PaginatedResponse<AdminApplication>> {
    const qs = buildQueryString((filters || {}) as Record<string, string | undefined>);
    const res = await api.get(`${API.ADMIN.APPLICATIONS}${qs}`);
    return res.data;
  },

  async getApplicationStats(): Promise<ApiResponse<ApplicationStats>> {
    const res = await api.get(API.ADMIN.APPLICATION_STATS);
    return res.data;
  },

  // ── System Health ──

  async getSystemHealth(): Promise<ApiResponse<Record<string, unknown>>> {
    const res = await api.get(API.HEALTH);
    return res.data;
  },

  // ── Analytics Dashboard (advanced) ──

  async getAnalyticsDashboard(params?: { startDate?: string; endDate?: string }): Promise<
    ApiResponse<{
      userGrowth: unknown;
      applicationFunnel: unknown;
      popularSkills: unknown;
      salaryTrends: unknown;
      jobTrends: unknown;
    }>
  > {
    const qs = buildQueryString((params || {}) as Record<string, string | undefined>);
    const [userGrowth, applicationFunnel, popularSkills, salaryTrends, jobTrends] =
      await Promise.all([
        api.get(`${API.ADVANCED_ANALYTICS.USER_GROWTH}${qs}`),
        api.get(`${API.ADVANCED_ANALYTICS.APPLICATION_FUNNEL}${qs}`),
        api.get(`${API.ADVANCED_ANALYTICS.POPULAR_SKILLS}${qs}`),
        api.get(`${API.ADVANCED_ANALYTICS.SALARY_TRENDS}${qs}`),
        api.get(`${API.ADVANCED_ANALYTICS.JOB_TRENDS}${qs}`),
      ]);
    return {
      status: 'success',
      message: 'Analytics dashboard loaded',
      data: {
        userGrowth: userGrowth.data?.data,
        applicationFunnel: applicationFunnel.data?.data,
        popularSkills: popularSkills.data?.data,
        salaryTrends: salaryTrends.data?.data,
        jobTrends: jobTrends.data?.data,
      },
    };
  },

  // ── Unified Report Export ──

  async exportReport(params: {
    type: 'users' | 'jobs' | 'analytics';
    period?: 'week' | 'month' | 'year';
  }): Promise<Blob> {
    const endpoints: Record<string, string> = {
      users: API.ADMIN.REPORTS.USERS,
      jobs: API.ADMIN.REPORTS.JOBS,
      analytics: API.ADMIN.REPORTS.ANALYTICS,
    };
    const res = await api.get(endpoints[params.type], {
      params: params.period ? { period: params.period } : undefined,
      responseType: 'blob',
    });
    return res.data;
  },

  // ── Email Templates ──

  async getEmailTemplates(): Promise<ApiResponse<unknown>> {
    const res = await api.get(API.ADMIN.EMAIL_TEMPLATES);
    return res.data;
  },

  async previewEmailTemplate(
    templateId: string,
    data?: Record<string, unknown>,
  ): Promise<ApiResponse<unknown>> {
    const res = await api.post(`${API.ADMIN.EMAIL_TEMPLATES}/${templateId}/preview`, data);
    return res.data;
  },

  async testEmailTemplate(
    templateId: string,
    recipientEmail: string,
  ): Promise<ApiResponse<unknown>> {
    const res = await api.post(`${API.ADMIN.EMAIL_TEMPLATES}/${templateId}/test`, {
      recipientEmail,
    });
    return res.data;
  },

  // ── Kafka Events ──

  async getKafkaEvents(limit?: number): Promise<ApiResponse<unknown>> {
    const res = await api.get(API.ADMIN.KAFKA_EVENTS, { params: { limit } });
    return res.data;
  },

  // ── Live Counters ──

  async getLiveCounters(): Promise<ApiResponse<unknown>> {
    const res = await api.get(API.ADMIN.LIVE_COUNTERS);
    return res.data;
  },

  // ── Feature Flags ──

  async getFeatureFlags(): Promise<ApiResponse<FeatureFlags>> {
    const res = await api.get(API.FEATURE_FLAGS.ALL);
    return res.data;
  },

  // ── Admin MFA Management (Super Admin) ──

  async setupAdminMfa(
    adminId: string,
  ): Promise<ApiResponse<{ secret: string; qrCodeUrl: string }>> {
    const res = await api.post(API.SUPER_ADMIN.MFA_SETUP(adminId));
    return res.data;
  },

  async enableAdminMfa(
    adminId: string,
    token: string,
  ): Promise<ApiResponse<{ backupCodes: string[] }>> {
    const res = await api.post(API.SUPER_ADMIN.MFA_ENABLE(adminId), { token });
    return res.data;
  },

  async disableAdminMfa(adminId: string): Promise<ApiResponse<null>> {
    const res = await api.post(API.SUPER_ADMIN.MFA_DISABLE(adminId));
    return res.data;
  },

  async getAdminMfaStatus(
    adminId: string,
  ): Promise<ApiResponse<{ mfaEnabled: boolean; backupCodesRemaining: number }>> {
    const res = await api.get(API.SUPER_ADMIN.MFA_STATUS(adminId));
    return res.data;
  },

  async regenerateAdminBackupCodes(
    adminId: string,
  ): Promise<ApiResponse<{ backupCodes: string[] }>> {
    const res = await api.post(API.SUPER_ADMIN.MFA_REGEN_BACKUP(adminId));
    return res.data;
  },

  async getAdminSessions(adminId: string): Promise<ApiResponse<UserSession[]>> {
    const res = await api.get(API.SUPER_ADMIN.USER_SESSIONS(adminId));
    return res.data;
  },

  async revokeAdminSessions(adminId: string): Promise<ApiResponse<null>> {
    const res = await api.delete(API.SUPER_ADMIN.REVOKE_USER_SESSIONS(adminId));
    return res.data;
  },
};
