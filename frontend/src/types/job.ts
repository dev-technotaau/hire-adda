export type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'FREELANCE';
export type JobStatus = 'OPEN' | 'CLOSED' | 'DRAFT' | 'EXPIRED';
export type ApplicationStatus = 'APPLIED' | 'VIEWED' | 'SHORTLISTED' | 'INTERVIEW_SCHEDULED' | 'REJECTED' | 'OFFERED' | 'HIRED' | 'WITHDRAWN';
export type WorkMode = 'ON_SITE' | 'REMOTE' | 'HYBRID';
export type ShiftType = 'DAY' | 'NIGHT' | 'ROTATIONAL' | 'FLEXIBLE';
export type ExperienceLevel = 'FRESHER' | 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE';
export type SalaryType = 'ANNUAL' | 'MONTHLY' | 'HOURLY';
export type EducationLevel = 'TENTH' | 'TWELFTH' | 'DIPLOMA' | 'BACHELORS' | 'MASTERS' | 'PHD' | 'POST_DOCTORAL';
export type UrgencyLevel = 'NORMAL' | 'URGENT' | 'IMMEDIATE';
export type CompanyType = 'PRIVATE' | 'PUBLIC' | 'STARTUP' | 'MNC' | 'GOVERNMENT' | 'NGO' | 'SEMI_GOVERNMENT';

export interface Job {
    id: string;
    companyId: string;
    title: string;
    description: string;
    keyResponsibilities: string | null;
    requirements: string | null;
    benefits: string | null;
    type: JobType;
    status: JobStatus;
    workMode: WorkMode | null;
    shiftType: ShiftType | null;
    industry: string | null;
    department: string | null;
    roleCategory: string | null;
    experienceMin: number;
    experienceMax: number | null;
    experienceLevel: ExperienceLevel | null;
    educationRequired: EducationLevel | null;
    location: string;
    latitude: number | null;
    longitude: number | null;
    isRemote: boolean;
    salaryMin: number | null;
    salaryMax: number | null;
    currency: string;
    salaryType: SalaryType | null;
    salaryDisclosed: boolean;
    skillsRequired: string[];
    niceToHaveSkills: string[];
    certificationsRequired: string[];
    numberOfOpenings: number | null;
    urgencyLevel: UrgencyLevel | null;
    isFeatured: boolean;
    isPremium: boolean;
    tags: string[];
    jobPerks: string[];
    travelRequirementPercent: number | null;
    relocationAssistance: boolean;
    applicationDeadline: string | null;
    interviewProcess: string | null;
    isWalkIn: boolean;
    walkInDetails: Record<string, unknown> | null;
    contactPerson: string | null;
    contactEmail: string | null;
    views: number;
    expiresAt: string | null;
    createdAt: string;
    updatedAt: string;
    company?: JobCompany;
    _applicationCount?: number;
    isSaved?: boolean;
}

export interface JobCompany {
    id: string;
    userId?: string;
    companyName: string;
    logo: string | null;
    industry: string | null;
    companyType: CompanyType | null;
    companySize: string | null;
    isVerified: boolean;
}

export interface JobApplication {
    id: string;
    jobId: string;
    candidateId: string;
    status: ApplicationStatus;
    coverLetter: string | null;
    resumeSnapshot: string | null;
    matchScore: number | null;
    source: string | null;
    interviewDate: string | null;
    interviewNotes: string | null;
    rejectionReason: string | null;
    viewedAt: string | null;
    offerDetails: Record<string, unknown> | null;
    appliedAt: string;
    updatedAt: string;
    job?: Job;
    candidate?: {
        id: string;
        userId: string;
        headline: string | null;
        phone: string | null;
        experienceYears: number;
        currentCompany: string | null;
        currentRole: string | null;
        skills: string[];
        user: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            email: string;
            avatar: string | null;
        };
    };
}

export interface CreateJobRequest {
    title: string;
    description: string;
    keyResponsibilities?: string;
    requirements?: string;
    benefits?: string;
    type?: JobType;
    workMode?: WorkMode;
    shiftType?: ShiftType;
    industry?: string;
    department?: string;
    roleCategory?: string;
    experienceMin?: number;
    experienceMax?: number;
    experienceLevel?: ExperienceLevel;
    educationRequired?: EducationLevel;
    location: string;
    isRemote?: boolean;
    salaryMin?: number;
    salaryMax?: number;
    currency?: string;
    salaryType?: SalaryType;
    salaryDisclosed?: boolean;
    skillsRequired: string[];
    niceToHaveSkills?: string[];
    certificationsRequired?: string[];
    numberOfOpenings?: number;
    urgencyLevel?: UrgencyLevel;
    isFeatured?: boolean;
    tags?: string[];
    jobPerks?: string[];
    travelRequirementPercent?: number;
    relocationAssistance?: boolean;
    applicationDeadline?: string;
    interviewProcess?: string;
    isWalkIn?: boolean;
    walkInDetails?: Record<string, unknown>;
    contactPerson?: string;
    contactEmail?: string;
}

export type UpdateJobRequest = Partial<CreateJobRequest>;

export interface JobSearchFilters {
    keyword?: string;
    location?: string;
    type?: string;
    isRemote?: string;
    workMode?: WorkMode;
    shiftType?: ShiftType;
    industry?: string;
    department?: string;
    experience?: string;
    experienceLevel?: ExperienceLevel;
    educationRequired?: EducationLevel;
    salaryMin?: string;
    salaryMax?: string;
    companyType?: CompanyType;
    companySize?: string;
    postedAfter?: string;
    postedBefore?: string;
    tags?: string;
    urgencyLevel?: UrgencyLevel;
    isFeatured?: string;
    isWalkIn?: string;
    latitude?: string;
    longitude?: string;
    radiusKm?: string;
    sortBy?: 'relevance' | 'date' | 'salary' | 'distance';
    page?: string;
    limit?: string;
}
