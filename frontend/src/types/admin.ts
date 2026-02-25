import type { Role } from './auth';

export interface AdminStats {
  totalUsers: number;
  totalCandidates: number;
  totalEmployers: number;
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  pendingVerifications: number;
  // Comprehensive stats (from getComprehensiveStats)
  totalAdmins?: number;
  activeThisWeek?: number;
  expiredJobs?: number;
  newJobsThisWeek?: number;
  newJobsThisMonth?: number;
  applicationsThisWeek?: number;
  applicationConversionRate?: number;
  verificationsApproved?: number;
  verificationsRejected?: number;
  topSkills?: Array<{ skill: string; count: number }>;
  topLocations?: Array<{ location: string; count: number }>;
  registrationTrends?: Array<{ date: string; count: number }>;
}

export interface RecentActivity {
  users: Array<{
    id: string;
    email: string;
    role: Role;
    createdAt: string;
    firstName: string | null;
  }>;
  jobs: Array<{
    id: string;
    title: string;
    company: { companyName: string } | null;
    createdAt: string;
  }>;
  applications: Array<{
    id: string;
    status: string;
    job: { title: string } | null;
    candidate: { user: { email: string } } | null;
  }>;
}

export interface UserListItem {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  isActive: boolean;
  isSuspended: boolean;
  isEmailVerified: boolean;
  mfaEnabled: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface UserDetail extends UserListItem {
  avatar: string | null;
  mobileNumber: string | null;
  isMobileVerified: boolean;
  whatsappNumber: string | null;
  isWhatsappVerified: boolean;
  loginAttempts: number;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  performedBy: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: { email: string; firstName: string | null; lastName: string | null } | null;
}

export interface AuditLogFilters {
  action?: string;
  entity?: string;
  performedBy?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AnalyticsData {
  period: string;
  registrations: number;
  jobPostings: number;
  applications: number;
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
}

export interface SystemConfig {
  key: string;
  value: string;
  description?: string;
}

export interface SuspendUserRequest {
  reason: string;
  duration?: number;
}

export interface UpdateUserRoleRequest {
  role: Role;
}

export interface FlagJobRequest {
  reason: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'CANDIDATE' | 'EMPLOYER' | 'ADMIN';
}

export interface UpdateUserProfileRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  mobileNumber?: string | null;
  whatsappNumber?: string | null;
  isMobileVerified?: boolean;
  isWhatsappVerified?: boolean;
}

export interface AdminResetPasswordRequest {
  newPassword: string;
  otp: string;
}

export interface UserSession {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  isActive: boolean;
  createdAt: string;
  lastSeenAt: string | null;
}

export interface DailyActiveUsersData {
  date: string;
  total: number;
  candidates: number;
  employers: number;
}

export interface AdminApplication {
  id: string;
  status: string;
  appliedAt: string;
  jobTitle: string;
  companyName: string;
  candidateName: string;
  candidateEmail: string;
}

export interface ApplicationStats {
  total: number;
  byStatus: Record<string, number>;
  dailyTrend: Array<{ date: string; count: number }>;
}
