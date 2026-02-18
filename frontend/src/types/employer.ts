import type { CompanyType } from './job';

export type FundingStage = 'BOOTSTRAPPED' | 'SEED' | 'SERIES_A' | 'SERIES_B' | 'SERIES_C' | 'SERIES_D_PLUS' | 'PRE_IPO' | 'PUBLIC' | 'ACQUIRED' | 'NOT_APPLICABLE';

export interface LeadershipEntry {
    name: string;
    designation: string;
    linkedinUrl?: string;
    imageUrl?: string;
    bio?: string;
}

export interface EmployeeTestimonialEntry {
    name: string;
    designation?: string;
    department?: string;
    quote: string;
    imageUrl?: string;
}

export interface OfficePhotoEntry {
    url: string;
    caption?: string;
    location?: string;
}

export interface CompanyProfile {
    id: string;
    userId: string;
    companyName: string;
    companyType: CompanyType | null;
    tagline: string | null;
    logo: string | null;
    coverImage: string | null;
    industry: string | null;
    subIndustry: string | null;
    specialties: string[];
    companySize: string | null;
    employeeCount: number | null;
    description: string | null;
    whyWorkForUs: string | null;
    website: string | null;
    careersPageUrl: string | null;
    blogUrl: string | null;
    foundedYear: number | null;
    parentCompany: string | null;
    stockTicker: string | null;
    gstNumber: string | null;
    cinNumber: string | null;
    panNumber: string | null;
    isVerified: boolean;
    annualRevenueRange: string | null;
    fundingStage: FundingStage | null;
    totalFundingRaised: string | null;
    investors: string[];
    productsServices: string[];
    techStack: string[];
    companyCulture: string | null;
    missionStatement: string | null;
    visionStatement: string | null;
    coreValues: string[];
    diversityStatement: string | null;
    employeeResourceGroups: string[];
    csrInitiatives: string | null;
    benefits: string[];
    structuredPerks: Record<string, string[]> | null;
    workplacePolicies: Record<string, string> | null;
    interviewProcess: string | null;
    awardsRecognitions: Array<{ title: string; year?: number; issuer?: string }> | null;
    leadershipTeam: LeadershipEntry[] | null;
    employeeTestimonials: EmployeeTestimonialEntry[] | null;
    officePhotos: OfficePhotoEntry[] | null;
    socialLinks: { linkedin?: string; twitter?: string; facebook?: string; instagram?: string; youtube?: string; glassdoor?: string } | null;
    contactEmail: string | null;
    contactPhone: string | null;
    contactPersonName: string | null;
    contactPersonDesignation: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    country: string | null;
    headquarters: string | null;
    locations: string[];
    latitude: number | null;
    longitude: number | null;
    createdAt: string;
    updatedAt: string;
    user?: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string;
        avatar: string | null;
    };
}

export interface UpdateCompanyRequest {
    companyName?: string;
    companyType?: CompanyType;
    tagline?: string;
    industry?: string;
    subIndustry?: string;
    specialties?: string[];
    companySize?: string;
    employeeCount?: number;
    description?: string;
    whyWorkForUs?: string;
    website?: string;
    careersPageUrl?: string;
    blogUrl?: string;
    foundedYear?: number;
    parentCompany?: string;
    stockTicker?: string;
    gstNumber?: string;
    cinNumber?: string;
    panNumber?: string;
    annualRevenueRange?: string;
    fundingStage?: FundingStage;
    totalFundingRaised?: string;
    investors?: string[];
    productsServices?: string[];
    techStack?: string[];
    companyCulture?: string;
    missionStatement?: string;
    visionStatement?: string;
    coreValues?: string[];
    diversityStatement?: string;
    employeeResourceGroups?: string[];
    csrInitiatives?: string;
    benefits?: string[];
    structuredPerks?: Record<string, string[]>;
    workplacePolicies?: Record<string, string>;
    interviewProcess?: string;
    awardsRecognitions?: Array<{ title: string; year?: number; issuer?: string }>;
    leadershipTeam?: LeadershipEntry[];
    employeeTestimonials?: EmployeeTestimonialEntry[];
    officePhotos?: OfficePhotoEntry[];
    socialLinks?: { linkedin?: string; twitter?: string; facebook?: string; instagram?: string; youtube?: string; glassdoor?: string };
    contactEmail?: string;
    contactPhone?: string;
    contactPersonName?: string;
    contactPersonDesignation?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
    headquarters?: string;
    locations?: string[];
    notificationPreferences?: {
        emailApplications?: boolean;
        emailMessages?: boolean;
        emailMarketing?: boolean;
        smsAlerts?: boolean;
        pushNotifications?: boolean;
        weeklyDigest?: boolean;
    };
    showCompany?: boolean;
    showContact?: boolean;
}

export interface EmployerDashboard {
    activeJobsCount: number;
    totalApplications: number;
    shortlistedCount: number;
    profileViews: number;
    recentApplications: Array<{
        id: string;
        candidateName: string;
        jobTitle: string;
        status: string;
        appliedAt: string;
    }>;
    jobPerformance: Array<{
        jobId: string;
        jobTitle: string;
        views: number;
        applications: number;
    }>;
}

export interface EngagementMetrics {
    avgTimeToHireDays: number | null;
    funnel: {
        applied: number;
        viewed: number;
        shortlisted: number;
        interviewScheduled: number;
        offered: number;
        hired: number;
        rejected: number;
        withdrawn: number;
    };
    conversions: {
        appliedToViewed: number;
        viewedToShortlisted: number;
        shortlistedToInterview: number;
        interviewToOffered: number;
        offeredToHired: number;
        overallHireRate: number;
    };
    hiringVelocity: number;
    totalHires: number;
}

export interface EmployerAnalytics {
    summary: {
        totalJobsPosted: number;
        activeJobs: number;
        totalApplications: number;
        avgTimeToHireDays: number | null;
        overallHireRate: number;
        profileViews: number;
        savedCandidates: number;
        hiringVelocity: number;
    };
    funnel: Record<string, number>;
    trends: Array<{
        period: string;
        applications: number;
        profileViews: number;
        jobsPosted: number;
    }>;
    statusDistribution: Array<{ status: string; count: number }>;
    sourceDistribution: Array<{ source: string; count: number }>;
    topSkillsInDemand: Array<{ skill: string; count: number }>;
    salaryCompetitiveness: {
        yourAvg: { min: number; max: number };
        platformAvg: { min: number; max: number };
    };
    jobPerformance: Array<{
        jobId: string;
        title: string;
        views: number;
        applications: number;
        hiredCount: number;
        conversionRate: number;
    }>;
    recentActivity: Array<{
        candidateName: string;
        jobTitle: string;
        status: string;
        date: string;
    }>;
}
