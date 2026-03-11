import { z } from 'zod';
import {
  JobType,
  JobStatus,
  ApplicationStatus,
  WorkMode,
  ShiftType,
  ExperienceLevel,
  EducationLevel,
  SalaryType,
  UrgencyLevel,
  LanguageProficiency,
  NoticePeriodPreference,
  FunctionalArea,
  SpecificDegree,
  GenderPreference,
  DrivingLicenseType,
  PostingVisibility,
  ApplyMethod,
  ScreeningQuestionType,
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

const screeningQuestionSchema = z.object({
  question: z.string().min(3).max(500),
  questionType: z.nativeEnum(ScreeningQuestionType).default(ScreeningQuestionType.TEXT),
  isRequired: z.boolean().optional().default(false),
  isDealBreaker: z.boolean().optional().default(false),
  options: z.array(z.string()).optional(),
  idealAnswer: z.string().optional(),
  displayOrder: z.number().int().min(0).optional().default(0),
});

const screeningAnswerSchema = z.object({
  questionId: z.string().uuid(),
  answer: z.string().min(1),
});

// --- Shared enterprise fields ---

const enterpriseFields = {
  // Classification
  functionalArea: z.nativeEnum(FunctionalArea, { error: 'Invalid functional area' }).optional(),

  // Education (UG/PG separation + specific degrees)
  ugRequired: z.nativeEnum(EducationLevel, { error: 'Invalid UG level' }).optional(),
  pgRequired: z.nativeEnum(EducationLevel, { error: 'Invalid PG level' }).optional(),
  specificDegrees: z.array(z.nativeEnum(SpecificDegree)).optional(),
  degreeSpecializations: z.array(z.string()).optional(),

  // Compensation
  salaryNegotiable: z.boolean().optional(),

  // Notice period
  noticePeriodPreference: z.array(z.nativeEnum(NoticePeriodPreference)).optional(),

  // Posting identity
  isConfidential: z.boolean().optional(),
  referenceCode: z.string().max(50).optional(),

  // Multi-location
  additionalLocations: z.array(z.string()).optional(),
  accommodationProvided: z.boolean().optional(),

  // Walk-in structured fields
  walkInStartDate: z.string().date().or(z.string().datetime()).optional(),
  walkInEndDate: z.string().date().or(z.string().datetime()).optional(),
  walkInTime: z.string().optional(),
  walkInVenue: z.string().optional(),
  walkInContactPerson: z.string().optional(),
  walkInContactPhone: z.string().optional(),
  walkInInstructions: z.string().optional(),

  // Diversity & Inclusion
  diversityTags: z.array(z.string()).optional(),

  // Compliance & Requirements
  visaSponsorshipAvailable: z.boolean().optional(),
  backgroundCheckRequired: z.boolean().optional(),
  isPwdFriendly: z.boolean().optional(),
  passportRequired: z.boolean().optional(),
  bondDetails: z.string().max(500).optional(),
  drivingLicenseRequired: z
    .nativeEnum(DrivingLicenseType, { error: 'Invalid driving license type' })
    .optional(),

  // Age & Gender
  ageMin: z.number().int().min(18).max(65).optional(),
  ageMax: z.number().int().min(18).max(65).optional(),
  genderPreference: z
    .nativeEnum(GenderPreference, { error: 'Invalid gender preference' })
    .optional(),

  // Posting Control
  postingVisibility: z.nativeEnum(PostingVisibility, { error: 'Invalid visibility' }).optional(),
  applyMethod: z.nativeEnum(ApplyMethod, { error: 'Invalid apply method' }).optional(),
  externalApplyUrl: z.string().url().optional().or(z.literal('')),
  scheduledPublishAt: z.string().datetime().optional(),

  // Screening Questions
  screeningQuestions: z.array(screeningQuestionSchema).max(20).optional(),
};

// --- Create job schema ---

export const createJobSchema = z.object({
  body: z
    .object({
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
      experienceLevel: z
        .nativeEnum(ExperienceLevel, { error: 'Invalid experience level' })
        .optional(),
      educationRequired: z
        .nativeEnum(EducationLevel, { error: 'Invalid education level' })
        .optional(),
      preferredEducationField: z.string().optional(),

      // Compensation (Prisma Decimal fields serialize as strings)
      salaryMin: z.coerce.number().positive().optional(),
      salaryMax: z.coerce.number().positive().optional(),
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

      // Enterprise features
      ...enterpriseFields,
    })
    .refine((data) => !data.ageMin || !data.ageMax || data.ageMin <= data.ageMax, {
      message: 'Minimum age must be less than or equal to maximum age',
      path: ['ageMax'],
    })
    .refine(
      (data) =>
        data.applyMethod !== 'EXTERNAL_URL' ||
        (data.externalApplyUrl && data.externalApplyUrl.length > 0),
      {
        message: 'External apply URL is required when apply method is EXTERNAL_URL',
        path: ['externalApplyUrl'],
      }
    ),
});

// --- Update job schema ---

export const updateJobSchema = z.object({
  body: z
    .object({
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
      experienceLevel: z
        .nativeEnum(ExperienceLevel, { error: 'Invalid experience level' })
        .optional(),
      educationRequired: z
        .nativeEnum(EducationLevel, { error: 'Invalid education level' })
        .optional(),
      preferredEducationField: z.string().optional(),

      // Compensation (Prisma Decimal fields serialize as strings)
      salaryMin: z.coerce.number().positive().optional(),
      salaryMax: z.coerce.number().positive().optional(),
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

      // Enterprise features
      ...enterpriseFields,
    })
    .refine((data) => !data.ageMin || !data.ageMax || data.ageMin <= data.ageMax, {
      message: 'Minimum age must be less than or equal to maximum age',
      path: ['ageMax'],
    })
    .refine(
      (data) =>
        data.applyMethod !== 'EXTERNAL_URL' ||
        !data.applyMethod ||
        (data.externalApplyUrl && data.externalApplyUrl.length > 0),
      {
        message: 'External apply URL is required when apply method is EXTERNAL_URL',
        path: ['externalApplyUrl'],
      }
    ),
});

// --- Apply with screening answers ---

export const applyToJobSchema = z.object({
  body: z.object({
    coverLetter: z.string().optional(),
    screeningAnswers: z.array(screeningAnswerSchema).optional(),
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
