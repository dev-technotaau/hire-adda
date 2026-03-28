export enum KafkaTopics {
  // Original events
  USER_REGISTERED = 'user.registered',
  USER_LOGIN = 'user.login',
  JOB_POSTED = 'job.posted',
  JOB_UPDATED = 'job.updated',
  JOB_CLOSED = 'job.closed',
  APPLICATION_SUBMITTED = 'application.submitted',
  APPLICATION_STATUS_CHANGED = 'application.status_changed',
  PROFILE_UPDATED = 'profile.updated',
  NOTIFICATION_SENT = 'notification.sent',

  // Company events
  COMPANY_VERIFIED = 'company.verified',
  COMPANY_PROFILE_UPDATED = 'company.profile_updated',

  // Search events
  SEARCH_PERFORMED = 'search.performed',

  // Verification events
  VERIFICATION_SUBMITTED = 'verification.submitted',
  VERIFICATION_APPROVED = 'verification.approved',
  VERIFICATION_REJECTED = 'verification.rejected',

  // Admin events
  ADMIN_USER_SUSPENDED = 'admin.user_suspended',
  ADMIN_JOB_REJECTED = 'admin.job_rejected',
  ADMIN_ROLE_CHANGED = 'admin.role_changed',

  // Session events
  SESSION_CREATED = 'session.created',
  SESSION_REVOKED = 'session.revoked',

  // File events
  RESUME_UPLOADED = 'resume.uploaded',
  AVATAR_CHANGED = 'avatar.changed',
}

export const ConsolidatedTopics = {
  USERS: 'ha.users',
  JOBS: 'ha.jobs',
  APPLICATIONS: 'ha.applications',
  NOTIFICATIONS: 'ha.notifications',
} as const;
