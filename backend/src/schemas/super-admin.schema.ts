import { z } from 'zod';

export const createAdminSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(8).max(128),
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
  }),
});

export const updateConfigSchema = z.object({
  body: z.object({
    key: z.string().min(1),
    value: z.union([z.string(), z.number(), z.boolean(), z.record(z.string(), z.unknown())]),
  }),
});

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(8).max(128),
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    role: z.enum(['CANDIDATE', 'EMPLOYER', 'ADMIN']),
  }),
});

const e164Phone = z
  .string()
  .regex(/^\+[1-9]\d{6,14}$/, 'Must be E.164 format (e.g. +919876543210)');

export const updateUserProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    email: z.string().email('Invalid email').optional(),
    mobileNumber: e164Phone.nullable().optional(),
    whatsappNumber: e164Phone.nullable().optional(),
    isMobileVerified: z.boolean().optional(),
    isWhatsappVerified: z.boolean().optional(),
  }),
});

export const adminResetPasswordSchema = z.object({
  body: z.object({
    newPassword: z.string().min(8).max(128),
    otp: z.string().length(6),
  }),
});

export type CreateAdminInput = z.infer<typeof createAdminSchema>['body'];
