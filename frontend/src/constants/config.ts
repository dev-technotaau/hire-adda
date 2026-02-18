export const APP_CONFIG = {
    name: 'Talent Bridge',
    description: 'India\'s Leading Job Portal & Recruitment Platform',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
    socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000',
    supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@talentbridge.com',
} as const;

export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    JOBS_PER_PAGE: 20,
    CANDIDATES_PER_PAGE: 20,
    APPLICATIONS_PER_PAGE: 15,
    NOTIFICATIONS_PER_PAGE: 20,
    USERS_PER_PAGE: 25,
    AUDIT_LOGS_PER_PAGE: 50,
} as const;

export const FILE_LIMITS = {
    RESUME_MAX_SIZE: 5 * 1024 * 1024, // 5MB
    AVATAR_MAX_SIZE: 5 * 1024 * 1024, // 5MB
    LOGO_MAX_SIZE: 5 * 1024 * 1024, // 5MB
    RESUME_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    RESUME_EXTENSIONS: ['.pdf', '.doc', '.docx'],
    IMAGE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
} as const;

export const PASSWORD_RULES = {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: true,
} as const;

export const OTP_CONFIG = {
    LENGTH: 6,
    RESEND_COOLDOWN: 60, // seconds
    EXPIRY: 300, // 5 minutes
} as const;

export const QUERY_KEYS = {
    AUTH: {
        ME: ['auth', 'me'],
    },
    JOBS: {
        LIST: ['jobs', 'list'],
        DETAIL: (id: string) => ['jobs', 'detail', id],
        SEARCH: (filters: Record<string, unknown>) => ['jobs', 'search', filters],
        APPLIED: ['jobs', 'applied'],
        SAVED: ['jobs', 'saved'],
        MY_JOBS: ['jobs', 'my-jobs'],
        APPLICATIONS: (jobId: string) => ['jobs', 'applications', jobId],
    },
    CANDIDATES: {
        PROFILE: ['candidates', 'profile'],
        DASHBOARD: ['candidates', 'dashboard'],
        COMPLETENESS: ['candidates', 'completeness'],
        PROFILE_VIEWS: ['candidates', 'profile-views'],
        SEARCH: (filters: Record<string, unknown>) => ['candidates', 'search', filters],
        DETAIL: (id: string) => ['candidates', 'detail', id],
        ANALYTICS: (filters: Record<string, unknown>) => ['candidates', 'analytics', filters],
        JOB_ALERTS: ['candidates', 'job-alerts'],
        JOB_ALERT_MATCHES: (id: string) => ['candidates', 'job-alert-matches', id],
    },
    EMPLOYERS: {
        DASHBOARD: ['employers', 'dashboard'],
        COMPANY: ['employers', 'company'],
        PROFILE_VIEWS: ['employers', 'profile-views'],
        SAVED_CANDIDATES: ['employers', 'saved-candidates'],
        ANALYTICS: (filters: Record<string, unknown>) => ['employers', 'analytics', filters],
    },
    NOTIFICATIONS: {
        LIST: ['notifications', 'list'],
        UNREAD_COUNT: ['notifications', 'unread-count'],
    },
    SESSIONS: {
        LIST: ['sessions', 'list'],
    },
    DRAFTS: {
        LIST: ['drafts', 'list'],
        DETAIL: (id: string) => ['drafts', 'detail', id],
    },
    ADMIN: {
        STATS: ['admin', 'stats'],
        COMPREHENSIVE_STATS: ['admin', 'comprehensive-stats'],
        USERS: (filters: Record<string, unknown>) => ['admin', 'users', filters],
        USER_DETAIL: (id: string) => ['admin', 'user', id],
        ACTIVITY: ['admin', 'activity'],
        ANALYTICS: (filters: Record<string, unknown>) => ['admin', 'analytics', filters],
        AUDIT_LOGS: (filters: Record<string, unknown>) => ['admin', 'audit-logs', filters],
        JOBS: (filters: Record<string, unknown>) => ['admin', 'jobs', filters],
        APPLICATIONS: (filters: Record<string, unknown>) => ['admin', 'applications', filters],
        APPLICATION_STATS: ['admin', 'application-stats'],
        EMAIL_TEMPLATES: ['admin', 'email-templates'],
        EMAIL_PREVIEW: (template: string) => ['admin', 'email-preview', template],
        MODERATION_KEYWORDS: ['admin', 'moderation-keywords'],
        LIVE_COUNTERS: ['admin', 'live-counters'],
        KAFKA_EVENTS: ['admin', 'kafka-events'],
        DAILY_ACTIVE_USERS: ['admin', 'daily-active-users'],
    },
    WEBAUTHN: {
        CREDENTIALS: ['webauthn', 'credentials'],
    },
    RECOMMENDATIONS: {
        JOBS: ['recommendations', 'jobs'],
        CANDIDATES: (jobId: string) => ['recommendations', 'candidates', jobId],
        FEED: (filters: Record<string, unknown>) => ['recommendations', 'feed', filters],
    },
    FEATURE_FLAGS: {
        CLIENT: ['feature-flags', 'client'],
        ALL: ['feature-flags', 'all'],
    },
    ADVANCED_ANALYTICS: {
        SKILLS: ['advanced-analytics', 'skills'],
        FUNNEL: (startDate?: string, endDate?: string) => ['advanced-analytics', 'funnel', startDate, endDate],
        USER_GROWTH: (startDate?: string, endDate?: string) => ['advanced-analytics', 'user-growth', startDate, endDate],
        SALARY: ['advanced-analytics', 'salary'],
        JOB_TRENDS: (startDate?: string, endDate?: string) => ['advanced-analytics', 'job-trends', startDate, endDate],
    },
    VERIFICATIONS: {
        MINE: ['verifications', 'mine'],
        PENDING: (filters: Record<string, unknown>) => ['verifications', 'pending', filters],
        ALL: (filters: Record<string, unknown>) => ['verifications', 'all', filters],
        STATS: ['verifications', 'stats'],
    },
    SAVED_SEARCHES: {
        LIST: (type?: string) => ['saved-searches', 'list', type],
    },
    TICKETS: {
        MY_LIST: ['tickets', 'my-list'],
        ALL_LIST: ['tickets', 'all-list'],
        DETAIL: (id: string) => ['tickets', 'detail', id],
        STATS: ['tickets', 'stats'],
        ANALYTICS: ['tickets', 'analytics'],
    },
    SUPER_ADMIN: {
        ADMINS: ['super-admin', 'admins'],
        USER_SESSIONS: (id: string) => ['super-admin', 'user-sessions', id],
    },
} as const;
