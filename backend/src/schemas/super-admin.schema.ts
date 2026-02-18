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
        value: z.any(),
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

export const updateUserProfileSchema = z.object({
    body: z.object({
        firstName: z.string().min(1).max(50).optional(),
        lastName: z.string().min(1).max(50).optional(),
        email: z.string().email('Invalid email').optional(),
    }),
});

export const adminResetPasswordSchema = z.object({
    body: z.object({
        newPassword: z.string().min(8).max(128),
        otp: z.string().length(6),
    }),
});

export type CreateAdminInput = z.infer<typeof createAdminSchema>['body'];
