import { z } from 'zod';
import {
    JobType, JobStatus, ApplicationStatus,
    WorkMode, ShiftType, ExperienceLevel, EducationLevel,
    SalaryType, UrgencyLevel, LanguageProficiency,
} from '@prisma/client';

// --- Reusable sub-schemas ---

const languageRequiredSchema = z.object({
    language: z.string().min(1),
    proficiency: z.nativeEnum(LanguageProficiency, { error: 'Invalid proficiency level' }),
});

const walkInDetailsSchema = z.object({
    date: z.string().optional(),
    time: z.string().optional(),
    venue: z.string().optional(),
    contactPerson: z.string().optional(),
    contactPhone: z.string().optional(),
});

// --- Create job schema ---

export const createJobSchema = z.object({
    body: z.object({
        // Core
        title: z.string().min(3).max(200),
        description: z.string().min(10),
        requirements: z.string().optional(),
        benefits: z.string().optional(),
        keyResponsibilities: z.string().optional(),
        type: z.nativeEnum(JobType).default(JobType.FULL_TIME),
        industry: z.string().optional(),
        department: z.string().optional(),
        roleCategory: z.string().optional(),

        // Location & Work arrangement
        location: z.string().min(1),
        isRemote: z.boolean().optional().default(false),
        workMode: z.nativeEnum(WorkMode, { error: 'Invalid work mode' }).optional(),
        shiftType: z.nativeEnum(ShiftType, { error: 'Invalid shift type' }).optional(),

        // Experience & Education
        experienceMin: z.number().int().min(0).optional().default(0),
        experienceMax: z.number().int().optional(),
        experienceLevel: z.nativeEnum(ExperienceLevel, { error: 'Invalid experience level' }).optional(),
        educationRequired: z.nativeEnum(EducationLevel, { error: 'Invalid education level' }).optional(),
        preferredEducationField: z.string().optional(),

        // Compensation
        salaryMin: z.number().positive().optional(),
        salaryMax: z.number().positive().optional(),
        currency: z.string().default('INR'),
        salaryType: z.nativeEnum(SalaryType, { error: 'Invalid salary type' }).optional(),
        salaryDisclosed: z.boolean().optional(),
        jobPerks: z.array(z.string()).optional(),

        // Skills
        skillsRequired: z.array(z.string()).optional().default([]),
        niceToHaveSkills: z.array(z.string()).optional(),
        certificationsRequired: z.array(z.string()).optional(),
        languagesRequired: z.array(languageRequiredSchema).optional(),

        // Tags & SEO
        tags: z.array(z.string()).optional(),

        // Vacancy & Urgency
        numberOfOpenings: z.number().int().min(1).optional(),
        urgencyLevel: z.nativeEnum(UrgencyLevel, { error: 'Invalid urgency level' }).optional(),
        isFeatured: z.boolean().optional(),
        isPremium: z.boolean().optional(),

        // Travel & Relocation
        travelRequirementPercent: z.number().int().min(0).max(100).optional(),
        relocationAssistance: z.boolean().optional(),

        // Application & Interview
        expiresAt: z.string().date().or(z.string().datetime()).optional(),
        applicationDeadline: z.string().date().or(z.string().datetime()).optional(),
        interviewProcess: z.string().optional(),
        isWalkIn: z.boolean().optional(),
        walkInDetails: walkInDetailsSchema.optional(),
        contactPerson: z.string().optional(),
        contactEmail: z.string().email().optional().or(z.literal('')),
    }),
});

// --- Update job schema ---

export const updateJobSchema = z.object({
    body: z.object({
        // Core
        title: z.string().min(3).max(200).optional(),
        description: z.string().min(10).optional(),
        requirements: z.string().optional(),
        benefits: z.string().optional(),
        keyResponsibilities: z.string().optional(),
        type: z.nativeEnum(JobType).optional(),
        status: z.nativeEnum(JobStatus).optional(),
        industry: z.string().optional(),
        department: z.string().optional(),
        roleCategory: z.string().optional(),

        // Location & Work arrangement
        location: z.string().min(1).optional(),
        isRemote: z.boolean().optional(),
        workMode: z.nativeEnum(WorkMode, { error: 'Invalid work mode' }).optional(),
        shiftType: z.nativeEnum(ShiftType, { error: 'Invalid shift type' }).optional(),

        // Experience & Education
        experienceMin: z.number().int().min(0).optional(),
        experienceMax: z.number().int().optional(),
        experienceLevel: z.nativeEnum(ExperienceLevel, { error: 'Invalid experience level' }).optional(),
        educationRequired: z.nativeEnum(EducationLevel, { error: 'Invalid education level' }).optional(),
        preferredEducationField: z.string().optional(),

        // Compensation
        salaryMin: z.number().positive().optional(),
        salaryMax: z.number().positive().optional(),
        salaryType: z.nativeEnum(SalaryType, { error: 'Invalid salary type' }).optional(),
        salaryDisclosed: z.boolean().optional(),
        jobPerks: z.array(z.string()).optional(),

        // Skills
        skillsRequired: z.array(z.string()).optional(),
        niceToHaveSkills: z.array(z.string()).optional(),
        certificationsRequired: z.array(z.string()).optional(),
        languagesRequired: z.array(languageRequiredSchema).optional(),

        // Tags & SEO
        tags: z.array(z.string()).optional(),

        // Vacancy & Urgency
        numberOfOpenings: z.number().int().min(1).optional(),
        urgencyLevel: z.nativeEnum(UrgencyLevel, { error: 'Invalid urgency level' }).optional(),
        isFeatured: z.boolean().optional(),
        isPremium: z.boolean().optional(),

        // Travel & Relocation
        travelRequirementPercent: z.number().int().min(0).max(100).optional(),
        relocationAssistance: z.boolean().optional(),

        // Application & Interview
        expiresAt: z.string().date().or(z.string().datetime()).optional(),
        applicationDeadline: z.string().date().or(z.string().datetime()).optional(),
        interviewProcess: z.string().optional(),
        isWalkIn: z.boolean().optional(),
        walkInDetails: walkInDetailsSchema.optional(),
        contactPerson: z.string().optional(),
        contactEmail: z.string().email().optional().or(z.literal('')),
    }),
});

// --- Application status update schema ---

export const updateApplicationStatusSchema = z.object({
    body: z.object({
        status: z.nativeEnum(ApplicationStatus, { error: 'Invalid application status' }),
        interviewDate: z.string().date().or(z.string().datetime()).optional(),
        interviewNotes: z.string().max(2000).optional(),
        rejectionReason: z.string().max(2000).optional(),
    }),
});

export type CreateJobInput = z.infer<typeof createJobSchema>['body'];
export type UpdateJobInput = z.infer<typeof updateJobSchema>['body'];
