// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// User Roles
export const USER_ROLES = {
  CANDIDATE: 'CANDIDATE',
  EMPLOYER: 'EMPLOYER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

// Job Status
export const JOB_STATUS = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  DRAFT: 'DRAFT',
  EXPIRED: 'EXPIRED',
} as const;

// Application Status
export const APPLICATION_STATUS = {
  APPLIED: 'APPLIED',
  VIEWED: 'VIEWED',
  SHORTLISTED: 'SHORTLISTED',
  INTERVIEW_SCHEDULED: 'INTERVIEW_SCHEDULED',
  REJECTED: 'REJECTED',
  OFFERED: 'OFFERED',
  HIRED: 'HIRED',
} as const;

// Employment Types
export const EMPLOYMENT_TYPES = {
  FULL_TIME: 'FULL_TIME',
  PART_TIME: 'PART_TIME',
  CONTRACT: 'CONTRACT',
  INTERNSHIP: 'INTERNSHIP',
  FREELANCE: 'FREELANCE',
} as const;

// Experience Levels (matches Prisma ExperienceLevel enum)
export const EXPERIENCE_LEVELS = {
  FRESHER: 'FRESHER',
  ENTRY: 'ENTRY',
  MID: 'MID',
  SENIOR: 'SENIOR',
  LEAD: 'LEAD',
  EXECUTIVE: 'EXECUTIVE',
} as const;

// Work Modes
export const WORK_MODES = {
  ON_SITE: 'ON_SITE',
  REMOTE: 'REMOTE',
  HYBRID: 'HYBRID',
} as const;

// Shift Types
export const SHIFT_TYPES = {
  DAY: 'DAY',
  NIGHT: 'NIGHT',
  ROTATIONAL: 'ROTATIONAL',
  FLEXIBLE: 'FLEXIBLE',
} as const;

// Salary Types
export const SALARY_TYPES = {
  ANNUAL: 'ANNUAL',
  MONTHLY: 'MONTHLY',
  HOURLY: 'HOURLY',
} as const;

// Company Types
export const COMPANY_TYPES = {
  PRIVATE: 'PRIVATE',
  PUBLIC: 'PUBLIC',
  STARTUP: 'STARTUP',
  MNC: 'MNC',
  GOVERNMENT: 'GOVERNMENT',
  NGO: 'NGO',
  SEMI_GOVERNMENT: 'SEMI_GOVERNMENT',
} as const;

// Urgency Levels
export const URGENCY_LEVELS = {
  NORMAL: 'NORMAL',
  URGENT: 'URGENT',
  IMMEDIATE: 'IMMEDIATE',
} as const;

// Gender
export const GENDERS = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  NON_BINARY: 'NON_BINARY',
  PREFER_NOT_TO_SAY: 'PREFER_NOT_TO_SAY',
  OTHER: 'OTHER',
} as const;

// Work Status
export const WORK_STATUSES = {
  EMPLOYED: 'EMPLOYED',
  UNEMPLOYED: 'UNEMPLOYED',
  FREELANCING: 'FREELANCING',
  STUDENT: 'STUDENT',
  NOT_LOOKING: 'NOT_LOOKING',
} as const;

// Notice Periods
export const NOTICE_PERIODS = {
  IMMEDIATE: 'IMMEDIATE',
  FIFTEEN_DAYS: 'FIFTEEN_DAYS',
  ONE_MONTH: 'ONE_MONTH',
  TWO_MONTHS: 'TWO_MONTHS',
  THREE_MONTHS: 'THREE_MONTHS',
  SIX_MONTHS: 'SIX_MONTHS',
} as const;

// Education Levels
export const EDUCATION_LEVELS = {
  TENTH: 'TENTH',
  TWELFTH: 'TWELFTH',
  DIPLOMA: 'DIPLOMA',
  BACHELORS: 'BACHELORS',
  MASTERS: 'MASTERS',
  PHD: 'PHD',
  POST_DOCTORAL: 'POST_DOCTORAL',
} as const;

// Disability Types
export const DISABILITY_TYPES = {
  NONE: 'NONE',
  VISUAL: 'VISUAL',
  HEARING: 'HEARING',
  LOCOMOTOR: 'LOCOMOTOR',
  INTELLECTUAL: 'INTELLECTUAL',
  MULTIPLE: 'MULTIPLE',
  OTHER: 'OTHER',
} as const;

// Skill Proficiency Levels
export const SKILL_PROFICIENCY_LEVELS = {
  BEGINNER: 'BEGINNER',
  INTERMEDIATE: 'INTERMEDIATE',
  ADVANCED: 'ADVANCED',
  EXPERT: 'EXPERT',
} as const;

// Language Proficiency Levels
export const LANGUAGE_PROFICIENCY_LEVELS = {
  BASIC: 'BASIC',
  INTERMEDIATE: 'INTERMEDIATE',
  FLUENT: 'FLUENT',
  NATIVE: 'NATIVE',
} as const;

// Marital Status
export const MARITAL_STATUSES = {
  SINGLE: 'SINGLE',
  MARRIED: 'MARRIED',
  DIVORCED: 'DIVORCED',
  WIDOWED: 'WIDOWED',
  PREFER_NOT_TO_SAY: 'PREFER_NOT_TO_SAY',
} as const;

// Application Sources
export const APPLICATION_SOURCES = {
  SEARCH: 'SEARCH',
  RECOMMENDATION: 'RECOMMENDATION',
  DIRECT: 'DIRECT',
  WALK_IN: 'WALK_IN',
  REFERRAL: 'REFERRAL',
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// Elasticsearch Indices
export const ELASTIC_INDICES = {
  JOBS: 'jobs',
  CANDIDATES: 'candidates',
  EMPLOYERS: 'employers',
} as const;

// Notification Categories
export const NOTIFICATION_CATEGORIES = {
  JOB_MATCH: 'job_match',
  APPLICATION_UPDATE: 'application_update',
  PROFILE_VIEWED: 'profile_viewed',
  VERIFICATION: 'verification',
  SECURITY: 'security',
  SYSTEM: 'system',
} as const;

// Form Draft Types
export const FORM_DRAFT_TYPES = {
  CANDIDATE_PROFILE: 'CANDIDATE_PROFILE',
  JOB_SEARCH_PREFERENCES: 'JOB_SEARCH_PREFERENCES',
  CANDIDATE_SEARCH: 'CANDIDATE_SEARCH',
  JOB_POSTING: 'JOB_POSTING',
  EMPLOYER_PROFILE: 'EMPLOYER_PROFILE',
} as const;
