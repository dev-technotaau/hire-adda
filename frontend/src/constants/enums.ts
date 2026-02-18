export const ROLE_LABELS: Record<string, string> = {
    CANDIDATE: 'Candidate',
    EMPLOYER: 'Employer',
    ADMIN: 'Admin',
    SUPER_ADMIN: 'Super Admin',
};

export const JOB_TYPE_LABELS: Record<string, string> = {
    FULL_TIME: 'Full Time',
    PART_TIME: 'Part Time',
    CONTRACT: 'Contract',
    INTERNSHIP: 'Internship',
    FREELANCE: 'Freelance',
};

export const JOB_STATUS_LABELS: Record<string, string> = {
    OPEN: 'Open',
    CLOSED: 'Closed',
    DRAFT: 'Draft',
    EXPIRED: 'Expired',
};

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
    APPLIED: 'Applied',
    VIEWED: 'Viewed',
    SHORTLISTED: 'Shortlisted',
    INTERVIEW_SCHEDULED: 'Interview Scheduled',
    REJECTED: 'Rejected',
    OFFERED: 'Offered',
    HIRED: 'Hired',
    WITHDRAWN: 'Withdrawn',
};

export const APPLICATION_STATUS_COLORS: Record<string, string> = {
    APPLIED: 'info',
    VIEWED: 'info',
    SHORTLISTED: 'success',
    INTERVIEW_SCHEDULED: 'warning',
    REJECTED: 'error',
    OFFERED: 'success',
    HIRED: 'success',
    WITHDRAWN: 'neutral',
};

export const WORK_MODE_LABELS: Record<string, string> = {
    ON_SITE: 'On Site',
    REMOTE: 'Remote',
    HYBRID: 'Hybrid',
};

export const SHIFT_TYPE_LABELS: Record<string, string> = {
    DAY: 'Day Shift',
    NIGHT: 'Night Shift',
    ROTATIONAL: 'Rotational',
    FLEXIBLE: 'Flexible',
};

export const EXPERIENCE_LEVEL_LABELS: Record<string, string> = {
    FRESHER: 'Fresher',
    ENTRY: 'Entry Level',
    MID: 'Mid Level',
    SENIOR: 'Senior',
    LEAD: 'Lead',
    EXECUTIVE: 'Executive',
};

export const EDUCATION_LEVEL_LABELS: Record<string, string> = {
    TENTH: '10th',
    TWELFTH: '12th',
    DIPLOMA: 'Diploma',
    BACHELORS: 'Bachelor\'s',
    MASTERS: 'Master\'s',
    PHD: 'PhD',
    POST_DOCTORAL: 'Post Doctoral',
};

export const SALARY_TYPE_LABELS: Record<string, string> = {
    ANNUAL: 'Per Year',
    MONTHLY: 'Per Month',
    HOURLY: 'Per Hour',
};

export const COMPANY_TYPE_LABELS: Record<string, string> = {
    PRIVATE: 'Private',
    PUBLIC: 'Public',
    STARTUP: 'Startup',
    MNC: 'MNC',
    GOVERNMENT: 'Government',
    NGO: 'NGO',
    SEMI_GOVERNMENT: 'Semi Government',
};

export const URGENCY_LEVEL_LABELS: Record<string, string> = {
    NORMAL: 'Normal',
    URGENT: 'Urgent',
    IMMEDIATE: 'Immediate',
};

export const GENDER_LABELS: Record<string, string> = {
    MALE: 'Male',
    FEMALE: 'Female',
    NON_BINARY: 'Non Binary',
    PREFER_NOT_TO_SAY: 'Prefer Not to Say',
    OTHER: 'Other',
};

export const WORK_STATUS_LABELS: Record<string, string> = {
    EMPLOYED: 'Employed',
    UNEMPLOYED: 'Unemployed',
    STUDENT: 'Student',
    FREELANCER: 'Freelancer',
    ACTIVELY_LOOKING: 'Actively Looking',
};

export const NOTICE_PERIOD_LABELS: Record<string, string> = {
    IMMEDIATE: 'Immediate',
    FIFTEEN_DAYS: '15 Days',
    THIRTY_DAYS: '30 Days',
    SIXTY_DAYS: '60 Days',
    NINETY_DAYS: '90 Days',
    MORE_THAN_NINETY_DAYS: '90+ Days',
};

export const MARITAL_STATUS_LABELS: Record<string, string> = {
    SINGLE: 'Single',
    MARRIED: 'Married',
    DIVORCED: 'Divorced',
    WIDOWED: 'Widowed',
    PREFER_NOT_TO_SAY: 'Prefer Not to Say',
};

export const DISABILITY_TYPE_LABELS: Record<string, string> = {
    NONE: 'None',
    VISUAL: 'Visual',
    HEARING: 'Hearing',
    LOCOMOTOR: 'Locomotor',
    INTELLECTUAL: 'Intellectual',
    MULTIPLE: 'Multiple',
    OTHER: 'Other',
};

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
    INFO: 'Information',
    SUCCESS: 'Success',
    WARNING: 'Warning',
    ERROR: 'Error',
};

export const CAREER_BREAK_TYPE_LABELS: Record<string, string> = {
    HEALTH: 'Health Reasons',
    FAMILY: 'Family Responsibilities',
    HIGHER_EDUCATION: 'Higher Education',
    TRAVEL: 'Travel / Sabbatical',
    LAYOFF: 'Layoff / Restructuring',
    PERSONAL: 'Personal Reasons',
    CAREGIVING: 'Caregiving',
    CAREER_TRANSITION: 'Career Transition',
    OTHER: 'Other',
};

export const RESERVATION_CATEGORY_LABELS: Record<string, string> = {
    GENERAL: 'General',
    SC: 'SC (Scheduled Caste)',
    ST: 'ST (Scheduled Tribe)',
    OBC: 'OBC (Other Backward Class)',
    EWS: 'EWS (Economically Weaker Section)',
    PREFER_NOT_TO_SAY: 'Prefer Not to Say',
};

export const COURSE_TYPE_LABELS: Record<string, string> = {
    FULL_TIME: 'Full Time',
    PART_TIME: 'Part Time',
    DISTANCE: 'Distance Learning',
    CORRESPONDENCE: 'Correspondence',
};

export const OPEN_TO_WORK_LABELS: Record<string, string> = {
    ACTIVELY_LOOKING: 'Actively Looking',
    OPEN_TO_OFFERS: 'Open to Offers',
    NOT_LOOKING: 'Not Looking',
};

export const PATENT_STATUS_LABELS: Record<string, string> = {
    FILED: 'Filed',
    PUBLISHED: 'Published',
    GRANTED: 'Granted',
};

export const GRADE_TYPE_LABELS: Record<string, string> = {
    PERCENTAGE: 'Percentage',
    CGPA: 'CGPA',
    GPA: 'GPA',
};

export const FUNDING_STAGE_LABELS: Record<string, string> = {
    BOOTSTRAPPED: 'Bootstrapped',
    SEED: 'Seed',
    SERIES_A: 'Series A',
    SERIES_B: 'Series B',
    SERIES_C: 'Series C',
    SERIES_D_PLUS: 'Series D+',
    PRE_IPO: 'Pre-IPO',
    PUBLIC: 'Public',
    ACQUIRED: 'Acquired',
    NOT_APPLICABLE: 'Not Applicable',
};

export const PRONOUN_OPTIONS: Record<string, string> = {
    'he/him': 'He/Him',
    'she/her': 'She/Her',
    'they/them': 'They/Them',
    'prefer-not-to-say': 'Prefer Not to Say',
};

export const LAST_ACTIVE_LABELS: Record<string, string> = {
    '1': 'Last 24 hours',
    '3': 'Last 3 days',
    '7': 'Last 7 days',
    '14': 'Last 2 weeks',
    '30': 'Last 30 days',
    '90': 'Last 3 months',
};

export const YES_NO_LABELS: Record<string, string> = {
    'true': 'Yes',
    'false': 'No',
};

export const SALARY_CURRENCY_LABELS: Record<string, string> = {
    'INR': 'INR (₹)',
    'USD': 'USD ($)',
    'EUR': 'EUR (€)',
    'GBP': 'GBP (£)',
    'AED': 'AED (د.إ)',
    'SGD': 'SGD (S$)',
    'CAD': 'CAD (C$)',
    'AUD': 'AUD (A$)',
};

export const EDUCATION_LEVEL_SEARCH_LABELS: Record<string, string> = {
    'UG': 'Under Graduate (UG)',
    'PG': 'Post Graduate (PG)',
    'DOCTORATE': 'Doctorate / PhD',
};

export const KEYWORD_OPERATOR_LABELS: Record<string, string> = {
    'or': 'Any keyword (OR)',
    'and': 'All keywords (AND)',
};

export const BROAD_REGION_PRESETS: Record<string, { label: string; special?: 'clear' | 'international'; cities?: string[] }> = {
    'anywhere_india': { label: 'Anywhere in India', special: 'clear' },
    'international': { label: 'Any International Location', special: 'international' },
    'north_india': { label: 'North India', cities: ['Delhi', 'Noida', 'Gurugram', 'Chandigarh', 'Lucknow', 'Jaipur', 'Dehradun'] },
    'south_india': { label: 'South India', cities: ['Bangalore', 'Chennai', 'Hyderabad', 'Kochi', 'Thiruvananthapuram', 'Coimbatore'] },
    'east_india': { label: 'East India', cities: ['Kolkata', 'Bhubaneswar', 'Patna', 'Guwahati', 'Ranchi'] },
    'west_india': { label: 'West India', cities: ['Mumbai', 'Pune', 'Ahmedabad', 'Surat', 'Goa', 'Vadodara'] },
};

export const INDIAN_REGION_PRESETS: Record<string, string[]> = {
    'NCR / Delhi': ['Delhi', 'Noida', 'Gurugram', 'Ghaziabad', 'Faridabad', 'Greater Noida'],
    'Mumbai Metropolitan': ['Mumbai', 'Navi Mumbai', 'Thane', 'Kalyan'],
    'Bangalore Region': ['Bangalore', 'Bengaluru', 'Electronic City', 'Whitefield'],
    'Hyderabad Region': ['Hyderabad', 'Secunderabad', 'HITEC City'],
    'Chennai Region': ['Chennai', 'Tambaram', 'Avadi'],
    'Pune Region': ['Pune', 'Pimpri-Chinchwad', 'Hinjewadi'],
    'Kolkata Region': ['Kolkata', 'Salt Lake', 'Howrah'],
    'Ahmedabad Region': ['Ahmedabad', 'Gandhinagar'],
};
